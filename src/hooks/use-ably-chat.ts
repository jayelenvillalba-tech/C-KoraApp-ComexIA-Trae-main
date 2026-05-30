import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAblyClient } from '../lib/ably';
import * as Ably from 'ably';

interface UseAblyChatProps {
  conversationId: string;
  userId: string;
  enabled?: boolean;
}

export function useAblyChat({ conversationId, userId, enabled = true }: UseAblyChatProps) {
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>('initialized');
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !conversationId) return;

    let mounted = true;
    
    fetch(`/api/chat/ably-auth?userId=${userId}`)
      .then(res => {

        if (!res.ok) throw new Error('Ably auth unavailable');
        
        if (mounted) {
          setupAbly();
        }
      })
      .catch(() => {
        if (mounted) {
          console.warn('Ably not configured or unavailable, falling back to polling');
          setIsPollingFallback(true);
        }
      });

    let ably: any;
    let channel: any;

    const setupAbly = () => {
      try {
        ably = getAblyClient(userId);
        
        // Listen to connection state changes
        ably.connection.on((stateChange: Ably.ConnectionStateChange) => {
          if (mounted) setConnectionState(stateChange.current);
          
          if (stateChange.current === 'failed' || stateChange.current === 'suspended') {
            console.warn('Ably connection failed, falling back to polling');
            if (mounted) setIsPollingFallback(true);
          }
        });

        // Connect explicitly
        ably.connect();

        // Subscribe to conversation channel
        channel = ably.channels.get(`conversation:${conversationId}`);
        
        channel.subscribe('new_message', (message: Ably.Message) => {
          const newMessage = message.data;
          
          // Optimistically update React Query cache for this conversation
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            const oldMessages = old || [];
            // Check if message already exists (from optimistic UI update)
            const exists = oldMessages.some((m: any) => m.id === newMessage.id || (m.pending && m.content === newMessage.content));
            if (exists) {
              // Replace pending message with confirmed one
              return oldMessages.map((m: any) => 
                (m.pending && m.content === newMessage.content) ? newMessage : m
              );
            }
            return [...oldMessages, newMessage];
          });
          
          // Also invalidate conversations list to update last message preview
          queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
        });
      } catch (err) {
        console.error('Error setting up Ably:', err);
        if (mounted) setIsPollingFallback(true);
      }
    };

    return () => {
      mounted = false;
      if (channel) {
        channel.unsubscribe('new_message');
        channel.detach();
      }
      // We don't disconnect the client entirely here so other conversations can reuse it
    };
  }, [conversationId, userId, enabled, queryClient]);

  return {
    connectionState,
    isPollingFallback,
    isOnline: connectionState === 'connected'
  };
}
