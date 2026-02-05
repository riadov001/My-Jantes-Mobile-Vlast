import type { Express, Request, Response } from "express";

const PWA_BACKEND_URL = 'https://appmytools.replit.app';

async function proxyRequest(req: Request, res: Response, method: string, path: string) {
  try {
    const url = `${PWA_BACKEND_URL}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Forward cookies from client
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }
    
    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };
    
    if (method !== 'GET' && method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, fetchOptions);
    
    // Forward Set-Cookie headers from PWA backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Erreur de connexion au serveur' });
  }
}

export function setupPwaProxy(app: Express) {
  // Auth endpoints
  app.post('/api/login', (req, res) => proxyRequest(req, res, 'POST', '/api/login'));
  app.post('/api/logout', (req, res) => proxyRequest(req, res, 'POST', '/api/logout'));
  app.get('/api/auth/user', (req, res) => proxyRequest(req, res, 'GET', '/api/auth/user'));
  app.post('/api/register', (req, res) => proxyRequest(req, res, 'POST', '/api/register'));
  
  // Data endpoints
  app.get('/api/quotes', (req, res) => proxyRequest(req, res, 'GET', '/api/quotes'));
  app.get('/api/quotes/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/quotes/${req.params.id}`));
  app.post('/api/quotes', (req, res) => proxyRequest(req, res, 'POST', '/api/quotes'));
  app.patch('/api/quotes/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/quotes/${req.params.id}`));
  
  app.get('/api/invoices', (req, res) => proxyRequest(req, res, 'GET', '/api/invoices'));
  app.get('/api/invoices/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/invoices/${req.params.id}`));
  
  app.get('/api/reservations', (req, res) => proxyRequest(req, res, 'GET', '/api/reservations'));
  app.post('/api/reservations', (req, res) => proxyRequest(req, res, 'POST', '/api/reservations'));
  app.patch('/api/reservations/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/reservations/${req.params.id}`));
  
  app.get('/api/notifications', (req, res) => proxyRequest(req, res, 'GET', '/api/notifications'));
  app.patch('/api/notifications/:id/read', (req, res) => proxyRequest(req, res, 'PATCH', `/api/notifications/${req.params.id}/read`));
  
  app.get('/api/services', (req, res) => proxyRequest(req, res, 'GET', '/api/services'));
  
  // Admin endpoints
  app.get('/api/admin/analytics', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    proxyRequest(req, res, 'GET', `/api/admin/analytics${queryString ? '?' + queryString : ''}`);
  });
  app.get('/api/admin/quotes', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/quotes'));
  app.post('/api/admin/quotes', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/quotes'));
  app.patch('/api/admin/quotes/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/quotes/${req.params.id}`));
  app.delete('/api/admin/quotes/:id', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/quotes/${req.params.id}`));
  app.post('/api/admin/quotes/:id/generate-invoice', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/quotes/${req.params.id}/generate-invoice`));
  
  app.get('/api/admin/invoices', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/invoices'));
  app.post('/api/admin/invoices', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/invoices'));
  app.patch('/api/admin/invoices/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/invoices/${req.params.id}`));
  app.post('/api/admin/invoices/:id/send-email', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/invoices/${req.params.id}/send-email`));
  
  app.get('/api/admin/reservations', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/reservations'));
  app.patch('/api/admin/reservations/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/reservations/${req.params.id}`));
  
  app.get('/api/admin/users', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/users'));
  app.patch('/api/admin/users/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/users/${req.params.id}`));
  
  app.get('/api/admin/garages', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/garages'));
  app.post('/api/admin/garages', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/garages'));
  app.patch('/api/admin/garages/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/garages/${req.params.id}`));
  
  app.post('/api/admin/services', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/services'));
  app.patch('/api/admin/services/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/services/${req.params.id}`));
  
  // Chat/Conversations endpoints
  app.get('/api/conversations', (req, res) => proxyRequest(req, res, 'GET', '/api/conversations'));
  app.post('/api/conversations', (req, res) => proxyRequest(req, res, 'POST', '/api/conversations'));
  app.get('/api/conversations/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/conversations/${req.params.id}`));
  app.get('/api/conversations/:id/messages', (req, res) => proxyRequest(req, res, 'GET', `/api/conversations/${req.params.id}/messages`));
  app.post('/api/conversations/:id/messages', (req, res) => proxyRequest(req, res, 'POST', `/api/conversations/${req.params.id}/messages`));
}
