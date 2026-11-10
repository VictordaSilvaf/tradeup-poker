import { z } from 'zod';
import type { RoomRepository } from '../application/ports';
import { DomainError } from '../domain/room';
import type { Room } from '../domain/room';

const roomSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  ownerId: z.string(),
  deck: z.enum(['fibonacci', 'simplified', 'tshirt']),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1).max(30),
      vote: z.string().nullable(),
      spectator: z.boolean(),
    }),
  ),
  revealed: z.boolean(),
  round: z.number().int().positive(),
  issues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
      estimate: z.number().nullable(),
    }),
  ),
  activeIssueId: z.string().nullable(),
  history: z.array(
    z.object({
      id: z.string(),
      number: z.number(),
      title: z.string(),
      votes: z.array(z.string()),
      finishedAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  timerEndsAt: z.number().nullable(),
  revealEndsAt: z.number().nullable().optional().transform((value) => value ?? null),
});
const PREFIX = 'tradeuppoker:room:v1:';
const CHANGE = 'tradeuppoker:room-changed';

export class LocalRoomRepository implements RoomRepository {
  constructor(private readonly storageOverride?: Storage) {}
  private get storage(): Storage {
    return this.storageOverride ?? localStorage;
  }
  async find(id: string): Promise<Room | null> {
    try {
      const raw = this.storage.getItem(PREFIX + id);
      if (!raw) return null;
      const result = roomSchema.safeParse(JSON.parse(raw));
      if (!result.success) throw new Error('Invalid schema');
      return result.data;
    } catch {
      throw new DomainError(
        'Não foi possível ler a sala. Verifique se o armazenamento do navegador está disponível.',
      );
    }
  }
  async list(): Promise<Room[]> {
    const rooms: Room[] = [];
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        try {
          const room = await this.find(key.slice(PREFIX.length));
          if (room) rooms.push(room);
        } catch {
          /* A broken record must not hide healthy rooms. */
        }
      }
    } catch {
      throw new DomainError('O armazenamento local não está disponível neste navegador.');
    }
    return rooms.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  private save(room: Room) {
    try {
      this.storage.setItem(PREFIX + room.id, JSON.stringify(room));
    } catch {
      throw new DomainError(
        'Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado.',
      );
    }
    window.dispatchEvent(new CustomEvent(CHANGE, { detail: room.id }));
  }
  async create(room: Room) {
    if (await this.find(room.id))
      throw new DomainError('Esse código de sala já existe. Tente novamente.');
    this.save(room);
  }
  async update(id: string, transform: (room: Room) => Room) {
    const write = async () => {
      const room = await this.find(id);
      if (!room)
        throw new DomainError(
          'Sala não encontrada neste navegador. Confira o código ou crie uma sala.',
        );
      const updated = transform(room);
      this.save(updated);
      return updated;
    };
    // Web Locks serialize read/modify/write operations across tabs of the same origin.
    return navigator.locks ? navigator.locks.request(PREFIX + id, write) : write();
  }
  subscribe(id: string, callback: () => void) {
    const local = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id) callback();
    };
    const remote = (event: StorageEvent) => {
      if (event.key === PREFIX + id || event.key === null) callback();
    };
    window.addEventListener(CHANGE, local);
    window.addEventListener('storage', remote);
    return () => {
      window.removeEventListener(CHANGE, local);
      window.removeEventListener('storage', remote);
    };
  }
}
