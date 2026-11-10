import { ChartNoAxesColumnIncreasing, Handshake } from 'lucide-react';
import type { Room } from '../../../domain/room';
import { summarizeVotes } from '../../../domain/room';
import { formatNumber } from '../../lib/format';

export function Results({ room }: { room: Room }) {
  const result = summarizeVotes(
    room.participants.filter((participant) => !participant.spectator && participant.vote !== null).map(
      (participant) => participant.vote!,
    ),
  );

  return (
    <section
      className="flex items-end justify-center gap-7 pb-3"
      aria-label="Resultado da rodada"
      aria-live="polite"
    >
      <div className="flex min-h-16 items-end gap-3">
        {Object.entries(result.distribution).map(([vote, count]) => (
          <div className="flex flex-col items-center gap-1.5" key={vote}>
            <small className="text-[10px] text-muted">{count}</small>
            <span
              className="block w-[23px] rounded-t bg-primary"
              style={{ height: `${Math.max(12, (count / result.total) * 60)}px` }}
            />
            <strong className="text-[11px] font-medium">{vote}</strong>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Handshake size={23} className="text-primary" />
        <strong className="text-[22px] font-medium">{result.agreement}%</strong>
        <span className="text-[9px] text-muted">Concordância</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <ChartNoAxesColumnIncreasing size={23} className="text-primary" />
        <strong className="text-[22px] font-medium">{formatNumber(result.average)}</strong>
        <span className="text-[9px] text-muted">Média numérica</span>
      </div>
    </section>
  );
}
