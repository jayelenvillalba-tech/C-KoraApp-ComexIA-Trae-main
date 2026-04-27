import { logger } from '../services/logger.js';

let ablyClient: any = null;

async function getAblyClient(): Promise<any | null> {
  if (!process.env.ABLY_API_KEY) return null;
  if (ablyClient) return ablyClient;

  try {
    const { Realtime } = await import('ably');
    ablyClient = new Realtime({
      key: process.env.ABLY_API_KEY,
      clientId: 'checomex-server',
    });
    return ablyClient;
  } catch (error) {
    logger.warn('[ably] Module not available, using polling fallback', { error: (error as Error).message });
    return null;
  }
}

export async function publishMessage(dealId: string, message: any): Promise<void> {
  const ably = await getAblyClient();
  if (!ably) return; // silent fallback — polling handles delivery

  try {
    const channel = ably.channels.get(`deal:${dealId}`);
    await channel.publish('message', message);
  } catch (error) {
    logger.warn('[ably] Publish failed', { error: (error as Error).message });
  }
}

export async function generateAblyToken(userId: string): Promise<any | null> {
  const ably = await getAblyClient();
  if (!ably) return null;

  try {
    return await new Promise((resolve, reject) => {
      ably.auth.createTokenRequest(
        { clientId: userId },
        (err: any, tokenRequest: any) => {
          if (err) reject(err);
          else resolve(tokenRequest);
        }
      );
    });
  } catch {
    return null;
  }
}
