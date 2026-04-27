import { logger } from '../services/logger.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@checomex.com',
  name: process.env.SENDGRID_FROM_NAME || 'Che.Comex',
};

const baseHtml = (content: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;background:#020a12;color:#eef6ff;margin:0;padding:20px}
  .c{max-width:560px;margin:0 auto;background:#050f1a;border:1px solid rgba(0,212,240,.2);border-radius:12px;overflow:hidden}
  .h{background:#020a12;padding:20px;border-bottom:1px solid rgba(0,212,240,.15)}
  .logo{font-size:18px;font-weight:900;color:#eef6ff;letter-spacing:1px}
  .logo span{color:#00d4f0}
  .b{padding:24px}
  .btn{display:inline-block;background:linear-gradient(135deg,#00d4f0,#1a8aff);color:#020a12;font-weight:700;font-size:13px;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px}
  .f{padding:12px 20px;border-top:1px solid rgba(255,255,255,.05);font-size:10px;color:#3d6e92;text-align:center}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">CHE.<span>COMEX</span></div></div>
  <div class="b">${content}</div>
  <div class="f">Che.Comex — Ecosistema de Comercio Exterior</div>
</div></body></html>`;

async function getSgMail() {
  if (!process.env.SENDGRID_API_KEY) return null;
  try {
    const sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail;
  } catch {
    return null;
  }
}

function getUserByIdFromAnyTable(userId: string): any {
  try {
    return db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
  } catch {
    return null;
  }
}

export async function sendNewMessageEmail(
  recipientUserId: string,
  senderName: string,
  dealId: string,
  messageContent: string
): Promise<void> {
  const sgMail = await getSgMail();
  if (!sgMail) return;

  const recipient = getUserByIdFromAnyTable(recipientUserId);
  if (!recipient?.email) return;

  const dealUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/chat/${dealId}`;

  try {
    await sgMail.send({
      to: recipient.email, from: FROM,
      subject: `Nuevo mensaje de ${senderName}`,
      html: baseHtml(`
        <h2 style="color:#eef6ff;font-size:18px">Tenés un mensaje nuevo</h2>
        <p style="color:#7fb0d0">${senderName} te escribió:</p>
        <div style="background:#071522;border-left:3px solid #00d4f0;padding:12px;border-radius:0 8px 8px 0;color:#c4dcf4;font-style:italic;margin:16px 0">
          "${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"
        </div>
        <a href="${dealUrl}" class="btn">Ver mensaje →</a>
      `),
    });
  } catch (error) {
    logger.error('[email] sendNewMessage error', { error: (error as Error).message });
  }
}

export async function sendWelcomeEmail(userId: string, plan: string): Promise<void> {
  const sgMail = await getSgMail();
  if (!sgMail) return;

  const user = getUserByIdFromAnyTable(userId);
  if (!user?.email) return;

  const planLabels: Record<string, string> = {
    pro: 'Pro PyME', enterprise: 'Enterprise', partner_pro: 'Partner Pro',
  };

  try {
    await sgMail.send({
      to: user.email, from: FROM,
      subject: '¡Bienvenido a Che.Comex! 🌎',
      html: baseHtml(`
        <h2 style="color:#00d4f0;font-size:22px">¡Bienvenido, ${user.name || 'Exportador'}!</h2>
        <p style="color:#7fb0d0">Tu cuenta <strong style="color:#eef6ff">${planLabels[plan] || plan}</strong> está activa.</p>
        <p style="color:#7fb0d0">Podés explorar oportunidades de comercio exterior en más de 195 países.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}" class="btn">Ir a la plataforma →</a>
      `),
    });
  } catch (error) {
    logger.error('[email] sendWelcome error', { error: (error as Error).message });
  }
}

export async function sendDealUpdateEmail(
  dealId: string,
  eventType: 'price_accepted' | 'deal_closed' | 'doc_requested'
): Promise<void> {
  const sgMail = await getSgMail();
  if (!sgMail) return;

  try {
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as any;
    if (!deal) return;
    const user = getUserByIdFromAnyTable(deal.initiator_id);
    if (!user?.email) return;

    const subjects: Record<string, string> = {
      price_accepted: `✅ Precio acordado — ${deal.product || 'tu deal'}`,
      deal_closed: `🎉 Deal cerrado — ${deal.product || 'tu deal'}`,
      doc_requested: `📄 Documento solicitado — ${deal.product || 'tu deal'}`,
    };
    const bodies: Record<string, string> = {
      price_accepted: `<p style="color:#7fb0d0">Se acordó el precio. El deal avanza a la etapa de documentación.</p>`,
      deal_closed: `<p style="color:#7fb0d0">Tu deal fue cerrado exitosamente.</p>`,
      doc_requested: `<p style="color:#7fb0d0">Tu contraparte solicitó un documento para continuar con el deal.</p>`,
    };

    await sgMail.send({
      to: user.email, from: FROM,
      subject: subjects[eventType],
      html: baseHtml(`
        <h2 style="color:#eef6ff;font-size:18px">${subjects[eventType]}</h2>
        ${bodies[eventType]}
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/chat/${dealId}" class="btn">Ver deal →</a>
      `),
    });
  } catch (error) {
    logger.error('[email] sendDealUpdate error', { error: (error as Error).message });
  }
}
