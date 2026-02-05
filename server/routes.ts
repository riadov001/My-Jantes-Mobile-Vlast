import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { setupPwaProxy } from "./pwa-proxy";
import { setupChatRoutes } from "./chat-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup proxy to PWA backend
  setupPwaProxy(app);
  
  // Setup local chat routes
  setupChatRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
