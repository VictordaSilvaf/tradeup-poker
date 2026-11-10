import { Users } from 'lucide-react';

export function RoundProgress({
  participants,
  voted,
  voters,
}: {
  participants: number;
  voted: number;
  voters: number;
}) {
  return (
    <div className="mx-auto mb-3 w-60">
      <div className="mb-2.5 flex items-center justify-center gap-1.5 text-[10px] text-muted">
        <Users size={15} />
        <span>
          {participants} {participants === 1 ? 'participante' : 'participantes'}
        </span>
        <span className="mx-1 text-border">·</span>
        <span>
          {voted} de {voters} votos
        </span>
      </div>
      <progress max={Math.max(1, voters)} value={voted} aria-label="Votos recebidos" />
    </div>
  );
}
