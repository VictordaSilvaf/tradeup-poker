export type SeatSide = 'bottom' | 'top' | 'left' | 'right';

export type Seat = {
  x: number;
  y: number;
  side: SeatSide;
};

/** Places seats on an ellipse, with the current player (index 0) at the bottom. */
export function seatingLayout(count: number): { seats: Seat[]; ratio: number } {
  const safeCount = Math.max(1, count);
  const ratio =
    safeCount <= 4 ? 1.45 : safeCount <= 6 ? 1.28 : safeCount <= 8 ? 1.12 : safeCount <= 10 ? 1 : 0.9;

  if (count <= 0) return { seats: [], ratio };

  const seats: Seat[] = [];
  for (let index = 0; index < count; index++) {
    const angle = (index / count) * Math.PI * 2;
    const x = 50 + Math.sin(angle) * 44;
    const y = 50 + Math.cos(angle) * 40;
    seats.push({ x, y, side: sideFromAngle(angle) });
  }
  return { seats, ratio };
}

function sideFromAngle(angle: number): SeatSide {
  const turn = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const deg = (turn * 180) / Math.PI;
  if (deg < 45 || deg >= 315) return 'bottom';
  if (deg < 135) return 'right';
  if (deg < 225) return 'top';
  return 'left';
}
