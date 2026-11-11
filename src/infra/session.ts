import { DomainError } from '../domain/room';

const key = (roomId: string) => `tradeuppoker:session:${roomId}`;

export type RoomSession = {
  participantId: string;
  name: string;
  spectator: boolean;
};

function parseStored(raw: string): RoomSession | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'participantId' in parsed &&
      typeof (parsed as RoomSession).participantId === 'string'
    ) {
      const value = parsed as Partial<RoomSession>;
      return {
        participantId: value.participantId!,
        name: typeof value.name === 'string' ? value.name : '',
        spectator: Boolean(value.spectator),
      };
    }
  } catch {
    /* legado: só o id do participante */
  }
  if (raw.trim()) {
    return { participantId: raw, name: '', spectator: false };
  }
  return null;
}

export const session = {
  read(roomId: string): RoomSession | null {
    try {
      const raw = sessionStorage.getItem(key(roomId));
      return raw ? parseStored(raw) : null;
    } catch {
      return null;
    }
  },
  participantId(roomId: string): string | null {
    return session.read(roomId)?.participantId ?? null;
  },
  save(
    roomId: string,
    participant: { id: string; name: string; spectator?: boolean },
  ) {
    try {
      const payload: RoomSession = {
        participantId: participant.id,
        name: participant.name,
        spectator: Boolean(participant.spectator),
      };
      sessionStorage.setItem(key(roomId), JSON.stringify(payload));
    } catch {
      throw new DomainError('Permita o armazenamento de sessão no navegador para entrar.');
    }
  },
  clear(roomId: string) {
    try {
      sessionStorage.removeItem(key(roomId));
    } catch {
      /* ignore */
    }
  },
};

export function parseRoomCode(input: string): string {
  const text = input.trim();
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(text)) return text;
  try {
    const url = new URL(text);
    const route = url.hash.replace(/^#/, '') || url.pathname;
    const match = route.match(/^\/sala\/([a-zA-Z0-9_-]{4,64})\/?$/);
    if (match) return match[1];
  } catch {
    /* The field also accepts a plain code. */
  }
  throw new DomainError('Informe um código válido ou o link completo de uma sala TradeUpPoker.');
}
