import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const DB_PATH = path.join(process.cwd(), 'comexia_v2.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// ── S3 / CLOUDFLARE R2 CLIENT ─────────────────────────────────────
// Cloudflare R2 es compatible con S3 API y cuesta USD 0.015/GB/mes

const s3Client = process.env.R2_ACCESS_KEY_ID ? new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
}) : null;

async function createBackup(): Promise<string> {
  // Asegurar que existe el directorio de backups
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `checomex-db-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  // Copiar la DB (SQLite soporta hot backup con VACUUM INTO, pero cp es suficiente acá)
  try {
     fs.copyFileSync(DB_PATH, backupPath);
     console.log(`[backup] ✅ Backup local creado: ${backupName}`);
  } catch (err: any) {
     console.warn(`[backup] ⚠️ No se pudo copiar DB (puede que no esté inicializada): ${err.message}`);
  }
  return backupPath;
}

async function uploadToR2(backupPath: string, backupName: string) {
  if (!s3Client || !process.env.R2_BUCKET_NAME) {
    console.log('[backup] ⚠️  R2 no configurado — solo backup local');
    return;
  }

  try {
      const fileContent = fs.readFileSync(backupPath);

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `backups/${backupName}`,
        Body: fileContent,
        ContentType: 'application/x-sqlite3',
      }));

      console.log(`[backup] ✅ Backup subido a R2: ${backupName}`);
  } catch(e: any) {
      console.error(`[backup] ❌ Error subiendo a R2:`, e);
  }
}

async function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  // Mantener solo los últimos 7 backups locales
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('checomex-db-'))
    .sort()
    .reverse();

  const toDelete = files.slice(7);
  toDelete.forEach(f => {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`[backup] 🗑️  Backup antiguo eliminado: ${f}`);
  });
}

export async function runBackup() {
  try {
    console.log('[backup] 🚀 Iniciando backup de base de datos...');
    const backupPath = await createBackup();
    if (fs.existsSync(backupPath)) {
        const backupName = path.basename(backupPath);
        await uploadToR2(backupPath, backupName);
        await cleanOldBackups();
        console.log('[backup] ✅ Backup completado');
    }
  } catch (error) {
    console.error('[backup] ❌ Error en backup:', error);
  }
}

// Cron: todos los días a las 3:00 AM
export function startBackupJob() {
  cron.schedule('0 3 * * *', runBackup, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  // También correr backup al arrancar el servidor
  // (con delay de 30s para no interferir con el startup)
  setTimeout(runBackup, 30_000);

  console.log('[backup] ✅ Job de backup programado — diario 3:00 AM AR');
}
