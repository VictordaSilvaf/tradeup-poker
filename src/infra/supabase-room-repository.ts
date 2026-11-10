import type { RoomRepository } from '../application/ports';
import { DomainError, maskRoomVotes, type Room } from '../domain/room';
import { parseRoomPayload } from './room-schema';
import { getSupabase } from './supabase-client';

type RoomRow = {
  id: string;
  payload: unknown;
  version: number;
};

const MAX_RETRIES = 5;

export class SupabaseRoomRepository implements RoomRepository {
  async find(id: string, viewerId?: string | null): Promise<Room | null> {
    const row = await this.fetchRow(id);
    if (!row) return null;
    return maskRoomVotes(parseRoomPayload(row.payload), viewerId);
  }

  async list(ids: string[] = []): Promise<Room[]> {
    if (!ids.length) return [];
    const rooms = await Promise.all(
      ids.map(async (id) => {
        try {
          return await this.find(id);
        } catch {
          return null;
        }
      }),
    );
    return rooms
      .filter((room): room is Room => room !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(room: Room): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.rpc('create_room', {
      p_id: room.id,
      p_payload: room,
    });
    if (error) {
      if (error.message.includes('ROOM_EXISTS')) {
        throw new DomainError('Esse código de sala já existe. Tente novamente.');
      }
      throw new DomainError(friendlyError(error.message));
    }
    await this.broadcast(room.id);
  }

  async update(id: string, transform: (room: Room) => Room): Promise<Room> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const row = await this.fetchRow(id);
      if (!row) {
        throw new DomainError('Sala não encontrada. Confira o código ou o convite.');
      }
      const current = parseRoomPayload(row.payload);
      const updated = transform(current);
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('save_room', {
        p_id: id,
        p_version: row.version,
        p_payload: updated,
      });
      if (!error) {
        const saved = data as { payload: unknown } | null;
        await this.broadcast(id);
        return parseRoomPayload(saved?.payload ?? updated);
      }
      if (error.message.includes('VERSION_CONFLICT')) continue;
      throw new DomainError(friendlyError(error.message));
    }
    throw new DomainError('A sala mudou enquanto você agia. Tente novamente.');
  }

  subscribe(id: string, callback: () => void): () => void {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`room:${id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'room_changed' }, () => callback())
      .subscribe();

    // Fallback de rede / broadcast atrasado.
    const poll = window.setInterval(() => callback(), 5000);

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }

  private async broadcast(roomId: string) {
    const supabase = getSupabase();
    const channel = supabase.channel(`room:${roomId}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'room_changed',
      payload: { roomId, at: Date.now() },
    });
    void supabase.removeChannel(channel);
  }

  private async fetchRow(id: string): Promise<RoomRow | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_room', { p_id: id });
    if (error) throw new DomainError(friendlyError(error.message));
    if (!data) return null;
    const row = data as RoomRow;
    if (!row.id || row.payload == null || typeof row.version !== 'number') {
      throw new DomainError('Resposta inválida do servidor.');
    }
    return row;
  }
}

function friendlyError(message: string): string {
  if (/Failed to fetch|NetworkError|fetch/i.test(message)) {
    return 'Não foi possível conectar ao Supabase. Confira sua rede e o .env.';
  }
  if (/Invalid API key|JWT/i.test(message)) {
    return 'Chave do Supabase inválida. Confira VITE_SUPABASE_ANON_KEY no .env.';
  }
  return message || 'Falha ao sincronizar a sala.';
}
