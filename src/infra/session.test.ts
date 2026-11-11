import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRoomCode, session } from './session';

describe('código de convite', () => {
  it('aceita um código simples', () => expect(parseRoomCode(' abc123 ')).toBe('abc123'));
  it('aceita o link da aplicação estática', () =>
    expect(parseRoomCode('https://example.com/poker/#/sala/abc123')).toBe('abc123'));
  it('aceita uma rota convencional', () =>
    expect(parseRoomCode('https://example.com/sala/abc123/')).toBe('abc123'));
  it.each(['', 'https://example.com/', '<script>', 'sala com espaços'])(
    'rejeita entrada inválida %s',
    (value) => expect(() => parseRoomCode(value)).toThrow('código válido'),
  );
});

describe('sessão da sala', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    });
  });

  afterEach(() => {
    session.clear('room-1');
    vi.unstubAllGlobals();
  });

  it('guarda nome e spectator para reentrada', () => {
    session.save('room-1', { id: 'p1', name: 'Ana', spectator: true });
    expect(session.read('room-1')).toEqual({
      participantId: 'p1',
      name: 'Ana',
      spectator: true,
    });
    expect(session.participantId('room-1')).toBe('p1');
  });

  it('lê formato legado só com id', () => {
    sessionStorage.setItem('tradeuppoker:session:room-1', 'legacy-id');
    expect(session.read('room-1')).toEqual({
      participantId: 'legacy-id',
      name: '',
      spectator: false,
    });
  });
});
