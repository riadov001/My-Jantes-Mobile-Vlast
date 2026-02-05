import type { Express, Request, Response } from "express";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

interface AuthenticatedUser {
  userId: string;
  role: string;
}

async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  try {
    const response = await fetch('https://appmytools.replit.app/api/auth/user', {
      headers: { 'Cookie': cookie }
    });
    
    if (response.ok) {
      const user = await response.json();
      return { userId: user.id, role: user.role };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  return null;
}

export function setupChatRoutes(app: Express) {
  app.get('/api/local/conversations', async (req: Request, res: Response) => {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (!['admin', 'superadmin', 'employee'].includes(auth.role)) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const result = await pool.query(
        `SELECT * FROM conversations 
         WHERE $1 = ANY(participant_ids) 
         ORDER BY last_message_at DESC NULLS LAST, created_at DESC`,
        [auth.userId]
      );

      res.json(result.rows.map((row: any) => ({
        id: row.id,
        participantIds: row.participant_ids,
        lastMessage: row.last_message,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.post('/api/local/conversations', async (req: Request, res: Response) => {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (!['admin', 'superadmin', 'employee'].includes(auth.role)) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { participantId } = req.body;
      if (!participantId) {
        return res.status(400).json({ message: 'participantId requis' });
      }

      const participantIds = [auth.userId, participantId].sort();

      const existing = await pool.query(
        `SELECT * FROM conversations WHERE participant_ids = $1`,
        [participantIds]
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return res.json({
          id: row.id,
          participantIds: row.participant_ids,
          lastMessage: row.last_message,
          lastMessageAt: row.last_message_at,
          createdAt: row.created_at
        });
      }

      const result = await pool.query(
        `INSERT INTO conversations (participant_ids) VALUES ($1) RETURNING *`,
        [participantIds]
      );

      const row = result.rows[0];
      res.json({
        id: row.id,
        participantIds: row.participant_ids,
        lastMessage: row.last_message,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get('/api/local/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (!['admin', 'superadmin', 'employee'].includes(auth.role)) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { id } = req.params;

      const conv = await pool.query(
        `SELECT * FROM conversations WHERE id = $1 AND $2 = ANY(participant_ids)`,
        [id, auth.userId]
      );

      if (conv.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }

      const result = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [id]
      );

      res.json(result.rows.map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        createdAt: row.created_at
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.post('/api/local/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (!['admin', 'superadmin', 'employee'].includes(auth.role)) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Contenu requis' });
      }

      const conv = await pool.query(
        `SELECT * FROM conversations WHERE id = $1 AND $2 = ANY(participant_ids)`,
        [id, auth.userId]
      );

      if (conv.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }

      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *`,
        [id, auth.userId, content.trim()]
      );

      await pool.query(
        `UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [content.trim().substring(0, 100), id]
      );

      const row = result.rows[0];
      res.json({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        createdAt: row.created_at
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });
}
