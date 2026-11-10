import { DomainError } from '../domain/room';
const key = (roomId: string) => `tradeuppoker:session:${roomId}`;
export const session = {
  read(roomId: string): string | null {
    try {
      return sessionStorage.getItem(key(roomId));
    } catch {
      return null;
    }
  },
  save(roomId: string, participantId: string) {
    try {
      sessionStorage.setItem(key(roomId), participantId);
    } catch {
      throw new DomainError('Permita o armazenamento de sessão no navegador para entrar.');
    }
  },
  clear(roomId: string) {
    sessionStorage.removeItem(key(roomId));
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
