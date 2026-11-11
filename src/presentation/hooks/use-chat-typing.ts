import { useEffect, useRef, useState } from 'react';
import { hasSupabaseEnv } from '../../infra/env';
import { getSupabase } from '../../infra/supabase-client';

type TypingUser = { id: string; name: string };

const TYPING_TTL_MS = 2500;

export function useChatTyping(roomId: string, self: TypingUser | null, enabled: boolean) {
  const [others, setOthers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const timersRef = useRef(new Map<string, number>());
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled || !self) return;

    const bump = (user: TypingUser) => {
      if (user.id === self.id) return;
      setOthers((current) => {
        if (current.some((entry) => entry.id === user.id)) return current;
        return [...current, user];
      });
      const existing = timersRef.current.get(user.id);
      if (existing) window.clearTimeout(existing);
      timersRef.current.set(
        user.id,
        window.setTimeout(() => {
          timersRef.current.delete(user.id);
          setOthers((current) => current.filter((entry) => entry.id !== user.id));
        }, TYPING_TTL_MS),
      );
    };

    if (hasSupabaseEnv()) {
      const channel = getSupabase()
        .channel(`room-chat:${roomId}`, { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          const user = payload as TypingUser;
          if (user?.id && user?.name) bump(user);
        })
        .subscribe();
      channelRef.current = channel;
      return () => {
        void getSupabase().removeChannel(channel);
        channelRef.current = null;
        for (const timer of timersRef.current.values()) window.clearTimeout(timer);
        timersRef.current.clear();
        setOthers([]);
      };
    }

    const local = new BroadcastChannel(`tradeuppoker:typing:${roomId}`);
    local.onmessage = (event) => {
      const user = event.data as TypingUser;
      if (user?.id && user?.name) bump(user);
    };
    localChannelRef.current = local;
    return () => {
      local.close();
      localChannelRef.current = null;
      for (const timer of timersRef.current.values()) window.clearTimeout(timer);
      timersRef.current.clear();
      setOthers([]);
    };
  }, [enabled, roomId, self?.id, self?.name]);

  function notifyTyping() {
    if (!enabled || !self) return;
    const now = Date.now();
    if (now - lastSentRef.current < 700) return;
    lastSentRef.current = now;
    const payload = { id: self.id, name: self.name };

    if (channelRef.current) {
      void channelRef.current.send({ type: 'broadcast', event: 'typing', payload });
      return;
    }
    localChannelRef.current?.postMessage(payload);
  }

  return { typingUsers: others, notifyTyping };
}
