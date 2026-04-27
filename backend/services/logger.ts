import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// ── FORMATOS ──────────────────────────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

// ── LOGGER PRINCIPAL ──────────────────────────────────────────────
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Consola (desarrollo)
    new winston.transports.Console({ format: consoleFormat }),

    // Archivo general — rotación diaria, 14 días de retención
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'checomex-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),

    // Archivo de errores — rotación semanal, 30 días
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'checomex-errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
    }),

    // Archivo de seguridad — rotación diaria, 90 días
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'checomex-security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
    }),
  ],
});

// ── LOGGER DE SEGURIDAD ───────────────────────────────────────────
// Registra eventos de seguridad específicos

export const securityLogger = {
  loginFailed: (ip: string, email: string) => {
    logger.warn('LOGIN_FAILED', { ip, email, event: 'auth' });
    checkSecurityAlert('login_failures', ip);
  },

  loginSuccess: (ip: string, userId: string) => {
    logger.info('LOGIN_SUCCESS', { ip, userId, event: 'auth' });
  },

  registrationBlocked: (ip: string, company: string, reason: string) => {
    logger.warn('REGISTRATION_BLOCKED', { ip, company, reason, event: 'compliance' });
  },

  rateLimitHit: (ip: string, endpoint: string) => {
    logger.warn('RATE_LIMIT_HIT', { ip, endpoint, event: 'security' });
    checkSecurityAlert('rate_limits', ip);
  },

  adminAccess: (userId: string, ip: string, endpoint: string) => {
    logger.info('ADMIN_ACCESS', { userId, ip, endpoint, event: 'admin' });
  },

  suspiciousInput: (ip: string, endpoint: string, input: string) => {
    logger.warn('SUSPICIOUS_INPUT', {
      ip, endpoint,
      inputPreview: input.substring(0, 100),
      event: 'security'
    });
  },

  gdprDelete: (userId: string, ip: string) => {
    logger.info('GDPR_DELETE', { userId, ip, event: 'compliance' });
  },

  backupCompleted: (filename: string) => {
    logger.info('BACKUP_COMPLETED', { filename, event: 'system' });
  },

  apiError: (endpoint: string, error: string, statusCode: number) => {
    logger.error('API_ERROR', { endpoint, error, statusCode, event: 'system' });
  },
};

// ── DETECCIÓN DE ANOMALÍAS ────────────────────────────────────────
// Contar eventos por IP en ventana de tiempo
// Si supera umbral → loguear como alerta crítica

const eventCounts: Map<string, { count: number; firstSeen: number }> = new Map();

function checkSecurityAlert(eventType: string, ip: string) {
  const key = `${eventType}:${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutos

  const existing = eventCounts.get(key);
  if (!existing || now - existing.firstSeen > windowMs) {
    eventCounts.set(key, { count: 1, firstSeen: now });
    return;
  }

  existing.count++;

  const thresholds: Record<string, number> = {
    login_failures: 10,
    rate_limits: 20,
  };

  if (existing.count >= (thresholds[eventType] || 15)) {
    logger.error('SECURITY_ALERT', {
      event: 'security_alert',
      type: eventType,
      ip,
      count: existing.count,
      windowMinutes: 5,
      message: `IP ${ip} superó el umbral de ${eventType}`,
    });
    // TODO: enviar email de alerta cuando SendGrid esté integrado
    eventCounts.delete(key); // resetear para no spamear
  }
}

// ── MIDDLEWARE DE LOGGING ─────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]('HTTP_REQUEST', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
    });
  });

  next();
}
