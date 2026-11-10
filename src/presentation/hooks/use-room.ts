import { useEffect, useState } from 'react';
import { planning } from '../../app/dependencies';
import type { Room } from '../../domain/room';
import { session } from '../../infra/session';

export function useRoom(id: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const viewerId = session.read(id);
        const result = await planning.findRoom(id, viewerId);
        if (active) {
          setRoom(result);
          setError('');
        }
      } catch (loadError) {
        if (active)
          setError(
            loadError instanceof Error ? loadError.message : 'Não foi possível carregar a sala.',
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(true);
    const unsubscribe = planning.subscribe(id, () => {
      void refresh();
    });
    void refresh();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

  return { room, loading, error };
}
