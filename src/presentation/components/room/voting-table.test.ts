import { describe, expect, it } from 'vitest';
import { seatingLayout } from './seating-layout';

describe('seatingLayout', () => {
  it('coloca o assento 0 na base da mesa', () => {
    const { seats } = seatingLayout(5);
    expect(seats[0].side).toBe('bottom');
    expect(seats[0].x).toBeCloseTo(50, 5);
    expect(seats[0].y).toBeGreaterThan(80);
  });

  it('distribui duas pessoas em lados opostos', () => {
    const { seats } = seatingLayout(2);
    expect(seats[0].side).toBe('bottom');
    expect(seats[1].side).toBe('top');
  });

  it('preenche os quatro lados com quatro pessoas', () => {
    const sides = seatingLayout(4).seats.map((seat) => seat.side);
    expect(sides).toEqual(['bottom', 'right', 'top', 'left']);
  });

  it('espalha assentos sem colisão de coordenadas idênticas', () => {
    const { seats } = seatingLayout(9);
    const keys = new Set(seats.map((seat) => `${seat.x.toFixed(2)}:${seat.y.toFixed(2)}`));
    expect(keys.size).toBe(9);
  });

  it('encurta a mesa conforme o grupo cresce', () => {
    expect(seatingLayout(3).ratio).toBeGreaterThan(seatingLayout(8).ratio);
    expect(seatingLayout(8).ratio).toBeGreaterThan(seatingLayout(12).ratio);
  });
});
