import { useEffect, useState } from 'react';
import { planning } from '../../app/dependencies';
import type { Room } from '../../domain/room';
export function useRoom(id: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await planning.findRoom(id);
        if (active) {
          setRoom(result);
          setError('');
        }
      } catch (error) {
        if (active)
          setError(error instanceof Error ? error.message : 'Não foi possível carregar a sala.');
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
