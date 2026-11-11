export const DECKS = {
  fibonacci: {
    name: 'Fibonacci',
    cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '🃏', '☕'],
  },
  simplified: { name: 'Simplificado', cards: ['1', '2', '3', '5', '8', '🃏', '☕'] },
  tshirt: { name: 'Tamanhos de camiseta', cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '🃏', '☕'] },
} as const;
export type DeckId = keyof typeof DECKS;
export type Participant = {
  id: string;
  name: string;
  /** Visible vote value — only for self or after reveal. */
  vote: string | null;
  /** Whether the participant has cast a vote (always visible). */
  voted: boolean;
  spectator: boolean;
  /** Epoch ms of last presence heartbeat. */
  lastSeenAt?: number;
};
export const PRESENCE_ONLINE_MS = 25_000;
export const PRESENCE_PRUNE_MS = 50_000;
export type Issue = { id: string; title: string; done: boolean; estimate: number | null };
export type Round = {
  id: string;
  number: number;
  title: string;
  votes: string[];
  finishedAt: string;
};
export type ChatAttachment = {
  id: string;
  kind: 'file' | 'link';
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
};
export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  attachments?: ChatAttachment[];
};
export const MAX_CHAT_MESSAGES = 100;
export const MAX_CHAT_MESSAGE_LENGTH = 280;
export const MAX_CHAT_ATTACHMENTS = 3;
export const MAX_CHAT_FILE_BYTES = 5 * 1024 * 1024;
export type Room = {
  id: string;
  name: string;
  ownerId: string;
  deck: DeckId;
  participants: Participant[];
  revealed: boolean;
  round: number;
  issues: Issue[];
  activeIssueId: string | null;
  history: Round[];
  messages: ChatMessage[];
  createdAt: string;
  timerEndsAt: number | null;
  /** Timestamp when the reveal countdown finishes and cards flip. */
  revealEndsAt: number | null;
};
export class DomainError extends Error {}

export function isParticipantOnline(participant: Participant, now = Date.now()): boolean {
  if (participant.lastSeenAt == null) return false;
  return now - participant.lastSeenAt <= PRESENCE_ONLINE_MS;
}

export function presentParticipants(
  participants: Participant[],
  selfId?: string | null,
  now = Date.now(),
): Participant[] {
  return participants.filter(
    (participant) => participant.id === selfId || isParticipantOnline(participant, now),
  );
}

export function touchPresence(room: Room, actorId: string, now: number): Room {
  requireParticipant(room, actorId);
  const participants = room.participants
    .filter(
      (participant) =>
        participant.id === actorId ||
        (participant.lastSeenAt != null && now - participant.lastSeenAt <= PRESENCE_PRUNE_MS),
    )
    .map((participant) =>
      participant.id === actorId ? { ...participant, lastSeenAt: now } : participant,
    );
  const ownerStillPresent = participants.some((participant) => participant.id === room.ownerId);
  return {
    ...room,
    participants,
    ownerId: ownerStillPresent ? room.ownerId : (participants[0]?.id ?? ''),
  };
}

export function requiredName(value: string, label: string, max = 60): string {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) throw new DomainError(`Informe ${label}.`);
  if (name.length > max) throw new DomainError(`Use até ${max} caracteres para ${label}.`);
  return name;
}
export function requireParticipant(room: Room, id: string): Participant {
  const participant = room.participants.find((p) => p.id === id);
  if (!participant) throw new DomainError('Entre na sala para continuar.');
  return participant;
}
export const REVEAL_COUNTDOWN_MS = 3000;
export function castVote(room: Room, participantId: string, value: string): Room {
  const participant = requireParticipant(room, participantId);
  if (participant.spectator) throw new DomainError('Observadores não participam da votação.');
  if (room.revealed) throw new DomainError('Inicie uma nova rodada para votar novamente.');
  if (room.revealEndsAt) throw new DomainError('A revelação já começou.');
  if (!(DECKS[room.deck].cards as readonly string[]).includes(value))
    throw new DomainError('Carta inválida para este baralho.');
  const nextVote = participant.vote === value ? null : value;
  return {
    ...room,
    participants: room.participants.map((p) =>
      p.id === participantId ? { ...p, vote: nextVote, voted: nextVote !== null } : p,
    ),
  };
}
export function beginReveal(room: Room, endsAt: number): Room {
  if (room.revealed) throw new DomainError('Os votos já foram revelados.');
  if (room.revealEndsAt) return room;
  if (!room.participants.some((p) => !p.spectator && p.voted))
    throw new DomainError('Espere pelo menos um voto antes de revelar.');
  return { ...room, revealEndsAt: endsAt, timerEndsAt: null };
}
export function revealVotes(room: Room): Room {
  if (room.revealed) return { ...room, revealEndsAt: null };
  if (!room.revealEndsAt && !room.participants.some((p) => !p.spectator && p.voted))
    throw new DomainError('Espere pelo menos um voto antes de revelar.');
  return { ...room, revealed: true, revealEndsAt: null, timerEndsAt: null };
}
export function summarizeVotes(votes: string[]) {
  const numeric = votes.filter((v) => v.trim() !== '' && Number.isFinite(Number(v))).map(Number);
  const distribution = votes.reduce<Record<string, number>>(
    (counts, vote) => ({ ...counts, [vote]: (counts[vote] ?? 0) + 1 }),
    {},
  );
  return {
    average: numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null,
    agreement: votes.length
      ? Math.round((Math.max(...Object.values(distribution)) / votes.length) * 100)
      : 0,
    distribution,
    total: votes.length,
  };
}
export function nextRound(room: Room, roundId: string, finishedAt: string): Room {
  const votes = room.participants
    .filter((p) => !p.spectator && p.voted && p.vote !== null)
    .map((p) => p.vote!);
  const title = room.issues.find((i) => i.id === room.activeIssueId)?.title ?? 'Votação livre';
  const history =
    room.revealed && votes.length
      ? [{ id: roundId, number: room.round, title, votes, finishedAt }, ...room.history].slice(
          0,
          50,
        )
      : room.history;
  return {
    ...room,
    round: room.round + 1,
    revealed: false,
    participants: room.participants.map((p) => ({ ...p, vote: null, voted: false })),
    history,
    timerEndsAt: null,
    revealEndsAt: null,
  };
}

/** Hides other players' vote values until the round is revealed. */
export function maskRoomVotes(room: Room, viewerId?: string | null): Room {
  if (room.revealed) return room;
  return {
    ...room,
    participants: room.participants.map((participant) =>
      participant.id === viewerId
        ? participant
        : { ...participant, vote: null, voted: participant.voted },
    ),
  };
}

export function requiredChatText(value: string, allowEmpty = false): string {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text && !allowEmpty) throw new DomainError('Escreva uma mensagem antes de enviar.');
  if (text.length > MAX_CHAT_MESSAGE_LENGTH)
    throw new DomainError(`Use até ${MAX_CHAT_MESSAGE_LENGTH} caracteres na mensagem.`);
  return text;
}

export function normalizeChatAttachments(attachments: ChatAttachment[] = []): ChatAttachment[] {
  if (attachments.length > MAX_CHAT_ATTACHMENTS) {
    throw new DomainError(`Envie no máximo ${MAX_CHAT_ATTACHMENTS} anexos por mensagem.`);
  }
  return attachments.map((attachment) => {
    const name = attachment.name.trim();
    const url = attachment.url.trim();
    if (!name || !url) throw new DomainError('Anexo inválido.');
    if (attachment.kind === 'link') {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('bad protocol');
        }
      } catch {
        throw new DomainError('Informe um link válido (http ou https).');
      }
    }
    if (attachment.size != null && attachment.size > MAX_CHAT_FILE_BYTES) {
      throw new DomainError('Cada arquivo pode ter no máximo 5 MB.');
    }
    return {
      ...attachment,
      name: name.slice(0, 120),
      url,
    };
  });
}

export function postChatMessage(
  room: Room,
  authorId: string,
  messageId: string,
  text: string,
  createdAt: string,
  attachments: ChatAttachment[] = [],
): Room {
  const author = requireParticipant(room, authorId);
  const cleanAttachments = normalizeChatAttachments(attachments);
  const clean = requiredChatText(text, cleanAttachments.length > 0);
  if (!clean && !cleanAttachments.length) {
    throw new DomainError('Escreva uma mensagem ou anexe um arquivo/link.');
  }
  const message: ChatMessage = {
    id: messageId,
    authorId: author.id,
    authorName: author.name,
    text: clean,
    createdAt,
    ...(cleanAttachments.length ? { attachments: cleanAttachments } : {}),
  };
  return {
    ...room,
    messages: [...room.messages, message].slice(-MAX_CHAT_MESSAGES),
  };
}
