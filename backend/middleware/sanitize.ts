import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import validator from 'validator';
import { Request, Response, NextFunction } from 'express';

// DOMPurify necesita un DOM — usar jsdom en Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// ── FUNCIONES DE SANITIZACIÓN ─────────────────────────────────────

export function sanitizeHtml(input: string): string {
  return purify.sanitize(input, { ALLOWED_TAGS: [] }); // strip ALL HTML
}

export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim());
}

export function sanitizeEmail(input: string): string {
  const normalized = validator.normalizeEmail(input) || '';
  return normalized as string;
}

export function sanitizeUrl(input: string): string {
  if (!input) return '';
  if (!validator.isURL(input, { protocols: ['http', 'https'], require_protocol: true })) {
    return '';
  }
  return input;
}

export function sanitizeHsCode(input: string): string {
  // Solo números y puntos
  return input.replace(/[^0-9.]/g, '').substring(0, 10);
}

export function sanitizeNumeric(input: any): number | null {
  const num = parseFloat(input);
  return isNaN(num) ? null : num;
}

// ── MIDDLEWARE RECURSIVO ──────────────────────────────────────────
// Sanitiza automáticamente todos los campos del body

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') return sanitizeHtml(obj);
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

// ── VALIDACIONES ESPECÍFICAS ──────────────────────────────────────

export function validateMarketplacePost(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.product || body.product.length < 3 || body.product.length > 200) {
    errors.push('Nombre del producto inválido (3-200 caracteres)');
  }

  if (!body.hsCode || !/^\d{4,10}$/.test(body.hsCode)) {
    errors.push('Código HS inválido (4-10 dígitos)');
  }

  if (!body.price || body.price <= 0 || body.price > 10_000_000) {
    errors.push('Precio inválido');
  }

  if (!body.quantity || body.quantity <= 0) {
    errors.push('Cantidad inválida');
  }

  const validIncoterms = ['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'];
  if (!validIncoterms.includes(body.incoterm)) {
    errors.push('Incoterm inválido');
  }

  return { valid: errors.length === 0, errors };
}

export function validateChatMessage(body: any): { valid: boolean; error?: string } {
  if (!body.content || typeof body.content !== 'string') {
    return { valid: false, error: 'Mensaje vacío' };
  }
  if (body.content.length > 5000) {
    return { valid: false, error: 'Mensaje demasiado largo (máx 5000 caracteres)' };
  }
  return { valid: true };
}
