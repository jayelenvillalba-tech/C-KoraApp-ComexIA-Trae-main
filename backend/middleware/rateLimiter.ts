import rateLimit from 'express-rate-limit';

// ── LIMITERS POR TIPO DE ENDPOINT ────────────────────────────────

// Login / Register — protege contra fuerza bruta
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                      // 5 intentos por IP
  message: {
    error: 'too_many_attempts',
    message: 'Demasiados intentos. Intentá de nuevo en 15 minutos.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // solo cuenta intentos fallidos
});

// API general — protege contra scraping
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 100,               // 100 requests por IP por minuto
  message: {
    error: 'rate_limit_exceeded',
    message: 'Límite de requests alcanzado. Intentá en un momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// IA endpoints — Groq tiene límites propios, proteger doble
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 10,                // 10 requests por usuario por minuto
  message: {
    error: 'ai_rate_limit',
    message: 'Límite del asistente IA alcanzado. Esperá un momento.',
  },
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip || req.socket?.remoteAddress || 'unknown';
  },
});

// Marketplace publicaciones — anti-spam
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 10,                     // 10 publicaciones por hora
  message: {
    error: 'post_limit_exceeded',
    message: 'Límite de publicaciones por hora alcanzado.',
  },
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => (req as any).user?.userId || req.ip || req.socket?.remoteAddress || 'unknown',
});

// Admin endpoints — extra protección
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'admin_rate_limit' },
});

// Compliance/sanctions check — anti-abuso
export const complianceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'compliance_rate_limit' },
});
