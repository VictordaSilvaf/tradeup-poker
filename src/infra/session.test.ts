import { describe, expect, it } from 'vitest';
import { parseRoomCode } from './session';
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
