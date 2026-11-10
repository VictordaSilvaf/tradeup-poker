import {
  beginReveal,
  castVote,
  DECKS,
  DomainError,
  nextRound,
  REVEAL_COUNTDOWN_MS,
  requiredName,
  requireParticipant,
  revealVotes,
  summarizeVotes,
} from '../domain/room';
import type { DeckId, Room } from '../domain/room';
import type { Clock, IdentityProvider, RoomRepository } from './ports';

export class PlanningService {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly identity: IdentityProvider,
    private readonly clock: Clock,
  ) {}
  listRooms() {
    return this.rooms.list();
  }
  findRoom(id: string) {
    return this.rooms.find(id);
  }
  subscribe(id: string, callback: () => void) {
    return this.rooms.subscribe(id, callback);
  }
  async createRoom(roomName: string, playerName: string, deck: DeckId) {
    const name = requiredName(roomName, 'o nome da sala');
    const participant = {
      id: this.identity.newId(),
      name: requiredName(playerName, 'seu nome', 30),
      vote: null,
      spectator: false,
    };
    const room: Room = {
      id: this.identity.newId().replaceAll('-', '').slice(0, 10),
      name,
      ownerId: participant.id,
      deck,
      participants: [participant],
      revealed: false,
      round: 1,
      issues: [],
      activeIssueId: null,
      history: [],
      createdAt: this.clock.now().toISOString(),
      timerEndsAt: null,
      revealEndsAt: null,
    };
    await this.rooms.create(room);
    return { room, participant };
  }
  async joinRoom(id: string, name: string, spectator = false) {
    const participant = {
      id: this.identity.newId(),
      name: requiredName(name, 'seu nome', 30),
      vote: null,
      spectator,
    };
    const room = await this.rooms.update(id, (room) => ({
      ...room,
      ownerId: room.participants.length ? room.ownerId : participant.id,
      participants: [...room.participants, participant],
    }));
    return { room, participant };
  }
  private change(id: string, actor: string, transform: (room: Room) => Room) {
    return this.rooms.update(id, (room) => {
      requireParticipant(room, actor);
      return transform(room);
    });
  }
  vote(id: string, actor: string, value: string) {
    return this.change(id, actor, (room) => castVote(room, actor, value));
  }
  reveal(id: string, actor: string) {
    return this.change(id, actor, (room) =>
      beginReveal(room, this.clock.now().getTime() + REVEAL_COUNTDOWN_MS),
    );
  }
  completeReveal(id: string, actor: string) {
    return this.change(id, actor, revealVotes);
  }
  restart(id: string, actor: string) {
    return this.change(id, actor, (room) =>
      nextRound(room, this.identity.newId(), this.clock.now().toISOString()),
    );
  }
  async leave(id: string, actor: string) {
    return this.change(id, actor, (room) => {
      const participants = room.participants.filter((p) => p.id !== actor);
      return {
        ...room,
        participants,
        ownerId: room.ownerId === actor ? (participants[0]?.id ?? '') : room.ownerId,
      };
    });
  }
  updateProfile(id: string, actor: string, name: string, spectator: boolean) {
    const clean = requiredName(name, 'seu nome', 30);
    return this.change(id, actor, (room) => ({
      ...room,
      participants: room.participants.map((p) =>
        p.id === actor
          ? { ...p, name: clean, spectator, vote: spectator !== p.spectator ? null : p.vote }
          : p,
      ),
    }));
  }
  configure(id: string, actor: string, name: string, deck: DeckId) {
    const clean = requiredName(name, 'o nome da sala');
    if (!(deck in DECKS)) throw new DomainError('Baralho inválido.');
    return this.change(id, actor, (room) => {
      if (room.ownerId !== actor)
        throw new DomainError('Somente o facilitador pode editar a sala.');
      const updated =
        room.deck === deck
          ? room
          : nextRound(room, this.identity.newId(), this.clock.now().toISOString());
      return { ...updated, name: clean, deck };
    });
  }
  addIssue(id: string, actor: string, title: string) {
    const clean = requiredName(title, 'o título da história', 160);
    return this.change(id, actor, (room) => ({
      ...room,
      issues: [
        ...room.issues,
        { id: this.identity.newId(), title: clean, done: false, estimate: null },
      ],
    }));
  }
  selectIssue(id: string, actor: string, issueId: string) {
    return this.change(id, actor, (room) => {
      const issue = room.issues.find((i) => i.id === issueId);
      if (!issue || issue.done) throw new DomainError('Escolha uma história pendente.');
      if (room.activeIssueId === issueId) return room;
      const hasActivity = room.revealed || room.participants.some((p) => p.vote !== null);
      const updated = hasActivity
        ? nextRound(room, this.identity.newId(), this.clock.now().toISOString())
        : room;
      return { ...updated, activeIssueId: issueId };
    });
  }
  finishIssue(id: string, actor: string) {
    return this.change(id, actor, (room) => {
      if (!room.revealed || !room.activeIssueId)
        throw new DomainError('Selecione uma história e revele os votos primeiro.');
      const { average } = summarizeVotes(
        room.participants.filter((p) => !p.spectator && p.vote !== null).map((p) => p.vote!),
      );
      const updated = nextRound(room, this.identity.newId(), this.clock.now().toISOString());
      return {
        ...updated,
        activeIssueId: null,
        issues: updated.issues.map((i) =>
          i.id === room.activeIssueId ? { ...i, done: true, estimate: average } : i,
        ),
      };
    });
  }
  toggleTimer(id: string, actor: string) {
    return this.change(id, actor, (room) => ({
      ...room,
      timerEndsAt:
        room.timerEndsAt && room.timerEndsAt > this.clock.now().getTime()
          ? null
          : this.clock.now().getTime() + 180_000,
    }));
  }
}
