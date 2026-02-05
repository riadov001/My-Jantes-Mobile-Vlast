import { Router, Request, Response } from "express";
import { db } from "./db";
import { users, sessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const router = Router();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

async function getUserFromToken(token: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  return db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    
    const hashedPassword = await hashPassword(password);
    
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name: name || email.split("@")[0],
      authProvider: "email",
    }).returning();
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
});

router.post("/oauth", async (req: Request, res: Response) => {
  try {
    const { provider, providerId, email, name, profileImage } = req.body;
    
    if (!provider || !providerId || !email) {
      return res.status(400).json({ message: "Données OAuth manquantes" });
    }
    
    let user = await db.query.users.findFirst({
      where: eq(users.providerId, providerId),
    });
    
    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (user) {
        [user] = await db.update(users)
          .set({ providerId, authProvider: provider, profileImage })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        [user] = await db.insert(users).values({
          email,
          name: name || email.split("@")[0],
          profileImage,
          authProvider: provider,
          providerId,
        }).returning();
      }
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
    });
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification OAuth" });
  }
});

router.get("/user", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ message: "Session expirée" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token;
    
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    
    res.clearCookie("auth_token");
    res.json({ message: "Déconnecté" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
});

export default router;
