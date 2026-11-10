import { describe, expect, it } from 'vitest';
import {
  beginReveal,
  castVote,
  maskRoomVotes,
  nextRound,
  requiredName,
  revealVotes,
  summarizeVotes,
} from './room';
import type { Room } from './room';
const room = (): Room => ({
  id: 'test',
  name: 'Produto',
  ownerId: 'ana',
  deck: 'fibonacci',
  participants: [
    { id: 'ana', name: 'Ana', vote: null, voted: false, spectator: false },
    { id: 'rui', name: 'Rui', vote: null, voted: false, spectator: false },
  ],
  revealed: false,
  round: 1,
  issues: [],
  activeIssueId: null,
  history: [],
  createdAt: '2026-01-01T00:00:00Z',
  timerEndsAt: null,
  revealEndsAt: null,
});
describe('nomes obrigatórios', () => {
  it('rejeita nomes compostos apenas de espaços', () =>
    expect(() => requiredName('   ', 'seu nome')).toThrow('Informe seu nome'));
  it('normaliza espaços sem perder acentos', () =>
    expect(requiredName('  João   Silva  ', 'seu nome')).toBe('João Silva'));
  it('limita o tamanho do nome', () =>
    expect(() => requiredName('a'.repeat(31), 'seu nome', 30)).toThrow('30'));
});
describe('votação', () => {
  it('seleciona, substitui e retira o voto sem alterar a sala original', () => {
    const original = room();
    const first = castVote(original, 'ana', '5');
    expect(original.participants[0].vote).toBeNull();
    expect(first.participants[0].vote).toBe('5');
    expect(first.participants[0].voted).toBe(true);
    const second = castVote(first, 'ana', '8');
    expect(second.participants[0].vote).toBe('8');
    expect(castVote(second, 'ana', '8').participants[0]).toMatchObject({
      vote: null,
      voted: false,
    });
  });
  it('impede votos de observadores e desconhecidos', () => {
    const current = room();
    current.participants[0].spectator = true;
    expect(() => castVote(current, 'ana', '5')).toThrow('Observadores');
    expect(() => castVote(current, 'estranho', '5')).toThrow('Entre na sala');
  });
  it('impede cartas fora do baralho', () =>
    expect(() => castVote(room(), 'ana', '999')).toThrow('Carta inválida'));
  it('exige pelo menos um voto antes da revelação', () =>
    expect(() => beginReveal(room(), Date.now() + 3000)).toThrow('pelo menos um voto'));
  it('inicia a contagem e só então revela as cartas', () => {
    const counting = beginReveal(castVote(room(), 'ana', '5'), 1_700_000_000_000);
    expect(counting.revealEndsAt).toBe(1_700_000_000_000);
    expect(counting.revealed).toBe(false);
    expect(revealVotes(counting)).toMatchObject({ revealed: true, revealEndsAt: null });
  });
  it('bloqueia novos votos durante a contagem regressiva', () => {
    const counting = beginReveal(castVote(room(), 'ana', '5'), Date.now() + 3000);
    expect(() => castVote(counting, 'rui', '8')).toThrow('revelação já começou');
  });
  it('trava os votos após revelar', () =>
    expect(() => castVote(revealVotes(castVote(room(), 'ana', '5')), 'ana', '8')).toThrow(
      'nova rodada',
    ));
  it('registra os votos revelados e limpa a nova rodada', () => {
    const result = nextRound(
      revealVotes(castVote(room(), 'ana', '5')),
      'history-1',
      '2026-01-01T01:00:00Z',
    );
    expect(result.round).toBe(2);
    expect(result.revealed).toBe(false);
    expect(result.revealEndsAt).toBeNull();
    expect(result.participants.every((p) => p.vote === null && p.voted === false)).toBe(true);
    expect(result.history[0]).toMatchObject({ votes: ['5'], title: 'Votação livre', number: 1 });
  });
  it('não registra votos ainda ocultos no histórico', () =>
    expect(nextRound(castVote(room(), 'ana', '5'), 'h', '2026-01-01').history).toHaveLength(0));
});
describe('máscara de votos', () => {
  it('oculta votos de outros antes da revelação e mantém o indicador voted', () => {
    const voted = castVote(castVote(room(), 'ana', '5'), 'rui', '8');
    const masked = maskRoomVotes(voted, 'ana');
    expect(masked.participants[0]).toMatchObject({ vote: '5', voted: true });
    expect(masked.participants[1]).toMatchObject({ vote: null, voted: true });
  });
});
describe('estatísticas', () => {
  it('calcula média incluindo zero e excluindo cartas especiais', () =>
    expect(summarizeVotes(['0', '5', '8', '?', '☕']).average).toBeCloseTo(13 / 3));
  it('calcula concordância pela carta mais votada', () =>
    expect(summarizeVotes(['5', '5', '8']).agreement).toBe(67));
  it('não inventa média numérica para camisetas', () =>
    expect(summarizeVotes(['S', 'S', 'L'])).toMatchObject({ average: null, agreement: 67 }));
  it('trata rodada sem votos', () =>
    expect(summarizeVotes([])).toMatchObject({ average: null, agreement: 0, total: 0 }));
});
