import * as Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;

export const getAblyClient = (userId: string) => {
  if (ablyClient) return ablyClient;

  // Initialize Ably with the tokenAuth URL pointing to our backend
  ablyClient = new Ably.Realtime({
    authUrl: `/api/chat/ably-auth?userId=${encodeURIComponent(userId)}`,
    autoConnect: false, // Don't connect until explicitly requested
  });

  return ablyClient;
};

export const disconnectAbly = () => {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
  }
};
