import { Request, Response, NextFunction } from 'express';

export function additionalSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // Previene que el browser cachee respuestas de la API
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  // Elimina el header que revela la tecnología
  res.removeHeader('X-Powered-By');

  // Permite que el frontend en el mismo dominio embeba iframes propios
  // pero bloquea cualquier origen externo
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  next();
}
