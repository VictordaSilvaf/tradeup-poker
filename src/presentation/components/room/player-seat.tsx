import type { CSSProperties } from 'react';
import { Check, Coffee, Eye } from 'lucide-react';
import type { Participant } from '../../../domain/room';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui';
import type { SeatSide } from './seating-layout';

const sideTransform: Record<SeatSide, string> = {
  bottom: '-translate-x-1/2 -translate-y-[18%]',
  top: '-translate-x-1/2 -translate-y-[82%]',
  left: '-translate-x-[12%] -translate-y-1/2',
  right: '-translate-x-[88%] -translate-y-1/2',
};

export function PlayerSeat({
  participant,
  current,
  owner,
  index,
  revealed,
  revealing,
  side,
  style,
}: {
  participant: Participant;
  current: boolean;
  owner: boolean;
  index: number;
  revealed: boolean;
  revealing: boolean;
  side: SeatSide;
  style: CSSProperties;
}) {
  const hasVote = participant.voted;

  return (
    <div
      className={cn(
        'absolute left-[var(--seat-x)] top-[var(--seat-y)] z-[1] flex w-max max-w-[120px] min-w-0 flex-col items-center',
        sideTransform[side],
        current && '[&_.player-name]:text-primary',
      )}
      style={style}
    >
      <div
        className={cn(
          'flex h-[60px] w-[41px] items-center justify-center rounded-sm border border-dashed border-[oklch(0.43_0.035_260)] bg-surface text-[22px] text-muted transition-[transform,background] duration-200',
          hasVote && 'border border-solid border-primary bg-[oklch(0.3_0.07_257)] text-primary',
          revealed && hasVote && 'translate-y-[-3px] bg-primary font-semibold text-primary-ink',
          revealing && hasVote && 'animate-card-pulse',
        )}
        aria-label={
          participant.spectator
            ? 'Observador'
            : revealed && hasVote
              ? `Voto: ${participant.vote}`
              : hasVote
                ? 'Já votou'
                : 'Ainda não votou'
        }
      >
        {participant.spectator ? (
          <Eye size={20} />
        ) : revealed && hasVote ? (
          participant.vote === '☕' ? (
            <Coffee size={22} />
          ) : (
            participant.vote
          )
        ) : hasVote ? (
          <Check size={23} />
        ) : (
          <span className="pb-2.5 tracking-widest">···</span>
        )}
      </div>
      <div className="player-name mt-2 flex w-full items-center justify-center gap-1.5 text-[11px]">
        <Avatar name={participant.name} index={index} small />
        <span className="max-w-[86px] overflow-hidden text-ellipsis whitespace-nowrap" title={participant.name}>
          {participant.name}
        </span>
        {current && <small className="text-[9px] text-muted">(você)</small>}
      </div>
      <small className="mt-1 text-[9px] text-muted max-[820px]:hidden">
        {participant.spectator
          ? 'Observador'
          : owner
            ? 'Facilitador'
            : hasVote
              ? 'Votou'
              : 'Pensando…'}
      </small>
    </div>
  );
}
