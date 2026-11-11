import { useCallback, useEffect, useRef, useState } from 'react';
import { planning } from '../../app/dependencies';
import { maskRoomVotes, type Room } from '../../domain/room';
import { session } from '../../infra/session';

export function useRoom(id: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roomRef = useRef<Room | null>(null);
  const pendingMutations = useRef(0);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const refresh = useCallback(
    async (options?: { force?: boolean }) => {
      try {
        const viewerId = session.participantId(id);
        const result = await planning.findRoom(id, viewerId);
        if (!options?.force && pendingMutations.current > 0) return result;
        setRoom(result);
        roomRef.current = result;
        setError('');
        return result;
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Não foi possível carregar a sala.',
        );
        throw loadError;
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    setLoading(true);
    const unsubscribe = planning.subscribe(id, () => {
      void refresh().catch(() => {});
    });
    void refresh().catch(() => {});
    return unsubscribe;
  }, [id, refresh]);

  const mutate = useCallback(
    async (transform: (current: Room) => Room, persist: () => Promise<Room>) => {
      const current = roomRef.current;
      if (!current) throw new Error('Sala não carregada.');

      const optimistic = transform(current);
      pendingMutations.current += 1;
      setRoom(optimistic);
      roomRef.current = optimistic;

      try {
        const saved = await persist();
        const masked = maskRoomVotes(saved, session.participantId(id));
        setRoom(masked);
        roomRef.current = masked;
        setError('');
        return masked;
      } catch (persistError) {
        await refresh({ force: true }).catch(() => {});
        throw persistError;
      } finally {
        pendingMutations.current = Math.max(0, pendingMutations.current - 1);
        if (pendingMutations.current === 0) {
          void refresh().catch(() => {});
        }
      }
    },
    [id, refresh],
  );

  return { room, loading, error, mutate, refresh };
}
