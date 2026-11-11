import { beforeEach, describe, expect, it } from 'vitest';
import type { Room } from '../domain/room';
import { DomainError } from '../domain/room';
import type { RoomRepository } from './ports';
import { PlanningService } from './planning-service';
class MemoryRepository implements RoomRepository {
  rooms = new Map<string, Room>();
  async find(id: string) {
    return this.rooms.get(id) ?? null;
  }
  async list() {
    return [...this.rooms.values()];
  }
  async create(room: Room) {
    this.rooms.set(room.id, room);
  }
  async update(id: string, transform: (room: Room) => Room) {
    const room = await this.find(id);
    if (!room) throw new DomainError('Sala não encontrada');
    const result = transform(room);
    this.rooms.set(id, result);
    return result;
  }
  subscribe() {
    return () => {};
  }
}
let service: PlanningService;
beforeEach(() => {
  let id = 0;
  service = new PlanningService(
    new MemoryRepository(),
    { newId: () => `identity${++id}` },
    { now: () => new Date('2026-01-01T00:00:00Z') },
  );
});
describe('casos de uso', () => {
  it('exige os nomes da sala e participante', async () => {
    await expect(service.createRoom('', 'Ana', 'fibonacci')).rejects.toThrow('nome da sala');
    await expect(service.createRoom('Produto', ' ', 'fibonacci')).rejects.toThrow('seu nome');
  });
  it('cria sala e adiciona participantes com nome obrigatório', async () => {
    const { room } = await service.createRoom(' Produto ', 'Ana', 'fibonacci');
    await expect(service.joinRoom(room.id, ' ')).rejects.toThrow('seu nome');
    const joined = await service.joinRoom(room.id, 'Rui');
    expect(joined.room.name).toBe('Produto');
    expect(joined.room.participants).toHaveLength(2);
  });
  it('não cria silenciosamente uma sala desconhecida', async () =>
    await expect(service.joinRoom('ausente', 'Ana')).rejects.toThrow('não encontrada'));
  it('restringe configurações ao facilitador', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    const joined = await service.joinRoom(room.id, 'Rui');
    await expect(
      service.configure(room.id, joined.participant.id, 'Outro', 'tshirt'),
    ).rejects.toThrow('facilitador');
    await service.vote(room.id, participant.id, '8');
    const updated = await service.configure(room.id, participant.id, 'Sprint', 'tshirt');
    expect(updated.name).toBe('Sprint');
    expect(updated.participants[0].vote).toBeNull();
  });
  it('transfere facilitação quando o dono sai', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    const joined = await service.joinRoom(room.id, 'Rui');
    const updated = await service.leave(room.id, participant.id);
    expect(updated.ownerId).toBe(joined.participant.id);
    expect(updated.participants).toHaveLength(1);
  });
  it('remove o voto ao mudar para observador', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    await service.vote(room.id, participant.id, '5');
    const updated = await service.updateProfile(room.id, participant.id, 'Ana Maria', true);
    expect(updated.participants[0]).toMatchObject({
      name: 'Ana Maria',
      spectator: true,
      vote: null,
    });
  });
  it('conclui uma história somente após revelação e mantém resultado no histórico', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    const withIssue = await service.addIssue(room.id, participant.id, 'Salvar favoritos');
    await service.selectIssue(room.id, participant.id, withIssue.issues[0].id);
    await service.vote(room.id, participant.id, '8');
    await expect(service.finishIssue(room.id, participant.id)).rejects.toThrow('revele');
    await service.reveal(room.id, participant.id);
    await service.completeReveal(room.id, participant.id);
    const result = await service.finishIssue(room.id, participant.id);
    expect(result.issues[0]).toMatchObject({ done: true, estimate: 8 });
    expect(result.activeIssueId).toBeNull();
    expect(result.history[0].title).toBe('Salvar favoritos');
  });
  it('inicia e cancela o cronômetro compartilhado', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    expect((await service.toggleTimer(room.id, participant.id)).timerEndsAt).toBe(
      new Date('2026-01-01T00:03:00Z').getTime(),
    );
    expect((await service.toggleTimer(room.id, participant.id)).timerEndsAt).toBeNull();
  });
  it('envia mensagens no chat da sala', async () => {
    const { room, participant } = await service.createRoom('Produto', 'Ana', 'fibonacci');
    const updated = await service.sendMessage(room.id, participant.id, '  Vamos alinhar  ');
    expect(updated.messages).toHaveLength(1);
    expect(updated.messages[0]).toMatchObject({
      authorId: participant.id,
      authorName: 'Ana',
      text: 'Vamos alinhar',
    });
  });
});
