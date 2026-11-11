import { useEffect, useRef, useState } from 'react';
import { hasSupabaseEnv } from '../../infra/env';
import { getSupabase } from '../../infra/supabase-client';
import { useToast } from '../components/ui/toast';

type PokePayload = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
};

const SHAKE_MS = 650;

export function useRoomPoke(
  roomId: string,
  self: { id: string; name: string } | null,
  enabled: boolean,
) {
  const { pushToast } = useToast();
  const [shakingId, setShakingId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const lastSentRef = useRef(0);
  const shakeTimerRef = useRef<number | null>(null);

  function triggerShake(id: string) {
    setShakingId(id);
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => {
      setShakingId((current) => (current === id ? null : current));
      shakeTimerRef.current = null;
    }, SHAKE_MS);
  }

  useEffect(() => {
    if (!enabled || !self) return;

    const onPoke = (payload: PokePayload) => {
      if (!payload?.fromId || !payload?.toId || payload.fromId === self.id) return;
      triggerShake(payload.toId);
      if (payload.toId !== self.id) return;
      pushToast({
        tone: 'poke',
        avatarName: payload.fromName,
        title: `${payload.fromName} te cutucou`,
        durationMs: 2800,
      });
    };

    if (hasSupabaseEnv()) {
      const channel = getSupabase()
        .channel(`room-poke:${roomId}`, { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'poke' }, ({ payload }) => onPoke(payload as PokePayload))
        .subscribe();
      channelRef.current = channel;
      return () => {
        void getSupabase().removeChannel(channel);
        channelRef.current = null;
        if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
      };
    }

    const local = new BroadcastChannel(`tradeuppoker:poke:${roomId}`);
    local.onmessage = (event) => onPoke(event.data as PokePayload);
    localChannelRef.current = local;
    return () => {
      local.close();
      localChannelRef.current = null;
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    };
  }, [enabled, pushToast, roomId, self?.id, self?.name]);

  function poke(target: { id: string; name: string }) {
    if (!enabled || !self || target.id === self.id) return false;
    const now = Date.now();
    if (now - lastSentRef.current < 1200) {
      pushToast({
        tone: 'info',
        title: 'Espere um instante',
        durationMs: 1800,
      });
      return false;
    }
    lastSentRef.current = now;
    const payload: PokePayload = {
      fromId: self.id,
      fromName: self.name,
      toId: target.id,
      toName: target.name,
    };

    if (channelRef.current) {
      void channelRef.current.send({ type: 'broadcast', event: 'poke', payload });
    } else {
      localChannelRef.current?.postMessage(payload);
    }

    triggerShake(target.id);
    pushToast({
      tone: 'success',
      avatarName: target.name,
      title: `Você cutucou ${target.name}`,
      durationMs: 2000,
    });
    return true;
  }

  return { poke, shakingId };
}
