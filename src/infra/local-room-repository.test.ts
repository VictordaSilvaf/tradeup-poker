import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { LocalRoomRepository } from './local-room-repository';
import type { Room } from '../domain/room';
class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
const makeRoom = (): Room => ({
  id: 'abc123',
  name: 'Produto',
  ownerId: 'ana',
  deck: 'fibonacci',
  participants: [{ id: 'ana', name: 'Ana', vote: null, voted: false, spectator: false }],
  revealed: false,
  round: 1,
  issues: [],
  activeIssueId: null,
  history: [],
  createdAt: '2026-01-01T00:00:00Z',
  timerEndsAt: null,
  revealEndsAt: null,
});
beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('navigator', {});
});
afterEach(() => vi.unstubAllGlobals());
describe('adaptador local', () => {
  it('persiste e recupera a sala usando o contrato do domínio', async () => {
    const storage = new MemoryStorage();
    const repo = new LocalRoomRepository(storage);
    await repo.create(makeRoom());
    expect(await new LocalRoomRepository(storage).find('abc123')).toEqual(makeRoom());
  });
  it('retorna null para sala desconhecida', async () =>
    expect(await new LocalRoomRepository(new MemoryStorage()).find('missing')).toBeNull());
  it('detecta dados corrompidos e mantém registros válidos na listagem', async () => {
    const storage = new MemoryStorage();
    const repo = new LocalRoomRepository(storage);
    await repo.create(makeRoom());
    storage.setItem('tradeuppoker:room:v1:broken', '{invalid json');
    await expect(repo.find('broken')).rejects.toThrow('ler a sala');
    expect(await repo.list()).toHaveLength(1);
  });
  it('não grava sobre sala existente', async () => {
    const repo = new LocalRoomRepository(new MemoryStorage());
    await repo.create(makeRoom());
    await expect(repo.create(makeRoom())).rejects.toThrow('já existe');
  });
  it('apresenta erro de armazenamento sem fingir que salvou', async () => {
    const storage = new MemoryStorage();
    const repo = new LocalRoomRepository(storage);
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    await expect(repo.create(makeRoom())).rejects.toThrow('Não foi possível salvar');
  });
  it('notifica mudanças locais e limpa assinaturas', async () => {
    const repo = new LocalRoomRepository(new MemoryStorage());
    await repo.create(makeRoom());
    const notify = vi.fn();
    const unsubscribe = repo.subscribe('abc123', notify);
    await repo.update('abc123', (room) => ({ ...room, name: 'Sprint' }));
    expect(notify).toHaveBeenCalledTimes(1);
    unsubscribe();
    await repo.update('abc123', (room) => ({ ...room, name: 'Planejamento' }));
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
