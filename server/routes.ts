import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";
import authRoutes from "./auth";

const BACKEND_URL = process.env.BACKEND_URL || "https://myjantes.mytoolsgroup.eu";

export async function registerRoutes(app: Express): Promise<Server> {
  // Local auth routes (register, login, oauth, user, logout)
  app.use("/api/auth", authRoutes);

  // Proxy other /api/* requests to the external backend
  const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: {
      "myjantes.mytoolsgroup.eu": "",
      "*": ""
    },
    cookiePathRewrite: "/",
    pathRewrite: (path, req) => {
      // Ensure path starts with /api
      return path.startsWith('/api') ? path : `/api${path}`;
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Forward cookies and headers
        if (req.headers.cookie) {
          proxyReq.setHeader("Cookie", req.headers.cookie);
        }
        // Set Accept header to prefer JSON responses
        proxyReq.setHeader("Accept", "application/json");
      },
      proxyRes: (proxyRes, req, res) => {
        // Allow credentials
        proxyRes.headers["access-control-allow-credentials"] = "true";
        
        // Rewrite Set-Cookie headers to remove domain restriction
        const cookies = proxyRes.headers['set-cookie'];
        if (cookies) {
          proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
            return cookie
              .replace(/domain=[^;]+;?\s*/gi, '')
              .replace(/secure;?\s*/gi, '')
              .replace(/samesite=\w+;?\s*/gi, 'SameSite=Lax; ');
          });
        }
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err);
        if (res && typeof res.writeHead === 'function') {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend unavailable" }));
        }
      },
    },
  });

  app.use("/api", apiProxy);

  const httpServer = createServer(app);

  return httpServer;
}
