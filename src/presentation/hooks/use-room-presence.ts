import { useEffect, useRef } from 'react';
import { planning } from '../../app/dependencies';

const HEARTBEAT_MS = 8_000;

/**
 * Mantém o participante online via heartbeat e remove ao fechar a aba.
 * Quem fecha a aba some na hora (leave best-effort) e some da UI em ~25s
 * se o leave não completar; o estado é podado em ~50s.
 */
export function useRoomPresence(roomId: string, actorId: string | null, enabled: boolean) {
  const stoppedRef = useRef(false);
  const actorRef = useRef(actorId);
  actorRef.current = actorId;

  useEffect(() => {
    if (!enabled || !actorId) return;
    stoppedRef.current = false;

    const beat = () => {
      if (stoppedRef.current) return;
      void planning.heartbeat(roomId, actorId).catch(() => {});
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') beat();
    };

    const leaveQuietly = () => {
      const id = actorRef.current;
      if (!id || stoppedRef.current) return;
      stoppedRef.current = true;
      void planning.leave(roomId, id).catch(() => {});
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leaveQuietly);

    return () => {
      stoppedRef.current = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leaveQuietly);
    };
  }, [actorId, enabled, roomId]);
}
