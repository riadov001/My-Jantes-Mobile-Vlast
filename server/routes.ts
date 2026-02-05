import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import authRoutes from "./auth";
import { db } from "./db";
import { users, sessions, quotes, invoices, reservations, notifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;
  
  if (!token) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  getUserFromToken(token).then(user => {
    if (!user) {
      return res.status(401).json({ message: "Session expirée" });
    }
    (req as any).user = user;
    next();
  }).catch(err => {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/auth", authRoutes);

  app.get("/api/quotes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userQuotes = await db.query.quotes.findMany({
        where: eq(quotes.userId, user.id),
        orderBy: desc(quotes.createdAt),
      });
      res.json(userQuotes);
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/quotes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { vehicleBrand, vehicleModel, vehicleYear, wheelSize, serviceType, description } = req.body;
      
      const [quote] = await db.insert(quotes).values({
        userId: user.id,
        vehicleBrand,
        vehicleModel,
        vehicleYear,
        wheelSize,
        serviceType,
        description,
      }).returning();
      
      res.json(quote);
    } catch (error) {
      console.error("Create quote error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/invoices", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userInvoices = await db.query.invoices.findMany({
        where: eq(invoices.userId, user.id),
        orderBy: desc(invoices.createdAt),
      });
      res.json(userInvoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/reservations", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userReservations = await db.query.reservations.findMany({
        where: eq(reservations.userId, user.id),
        orderBy: desc(reservations.createdAt),
      });
      res.json(userReservations);
    } catch (error) {
      console.error("Get reservations error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/reservations", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { serviceType, date, time, notes } = req.body;
      
      const [reservation] = await db.insert(reservations).values({
        userId: user.id,
        serviceType,
        date: new Date(date),
        time,
        notes,
      }).returning();
      
      res.json(reservation);
    } catch (error) {
      console.error("Create reservation error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, user.id),
        orderBy: desc(notifications.createdAt),
      });
      res.json(userNotifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [notification] = await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id))
        .returning();
      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/services", requireAuth, async (req: Request, res: Response) => {
    const services = [
      { id: "1", name: "Réparation de jantes", description: "Réparation de jantes endommagées", price: 150 },
      { id: "2", name: "Changement de pneus", description: "Remplacement de pneus usés", price: 80 },
      { id: "3", name: "Équilibrage", description: "Équilibrage des roues", price: 40 },
      { id: "4", name: "Personnalisation", description: "Peinture et personnalisation de jantes", price: 200 },
      { id: "5", name: "Géométrie", description: "Réglage de la géométrie", price: 90 },
    ];
    res.json(services);
  });

  const httpServer = createServer(app);

  return httpServer;
}
