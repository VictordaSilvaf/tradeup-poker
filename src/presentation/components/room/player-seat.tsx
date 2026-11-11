import type { CSSProperties } from 'react';
import { Check, Eye } from 'lucide-react';
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
  poked,
  side,
  style,
  onPoke,
}: {
  participant: Participant;
  current: boolean;
  owner: boolean;
  index: number;
  revealed: boolean;
  revealing: boolean;
  poked: boolean;
  side: SeatSide;
  style: CSSProperties;
  onPoke?: () => void;
}) {
  const hasVote = participant.voted;
  const canPoke = Boolean(onPoke) && !current;

  return (
    <div
      className={cn(
        'absolute left-[var(--seat-x)] top-[var(--seat-y)] z-[1] flex w-max max-w-[120px] min-w-0 flex-col items-center',
        sideTransform[side],
        current && '[&_.player-name]:text-primary',
      )}
      style={style}
    >
      <button
        type="button"
        disabled={!canPoke}
        title={canPoke ? `Cutucar ${participant.name}` : undefined}
        onClick={canPoke ? onPoke : undefined}
        className={cn(
          'flex h-[60px] w-[41px] items-center justify-center rounded-sm border border-dashed border-[oklch(0.43_0.035_260)] bg-surface text-[22px] text-muted transition-[transform,background,box-shadow] duration-200',
          hasVote && 'border border-solid border-primary bg-[oklch(0.3_0.07_257)] text-primary',
          revealed && hasVote && 'translate-y-[-3px] bg-primary font-semibold text-primary-ink',
          revealing && hasVote && !poked && 'animate-card-pulse',
          poked &&
            'animate-seat-poke border-[oklch(0.72_0.1_55)] bg-[oklch(0.32_0.05_55)] text-[oklch(0.9_0.06_75)] shadow-[0_0_0_3px_oklch(0.72_0.1_55/0.18)]',
          canPoke &&
            'cursor-pointer hover:-translate-y-0.5 hover:border-[oklch(0.68_0.09_55)] hover:shadow-[0_8px_18px_oklch(0.2_0.04_55/0.28)]',
          !canPoke && 'cursor-default disabled:opacity-100',
        )}
        aria-label={
          canPoke
            ? `Cutucar ${participant.name}`
            : participant.spectator
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
          <span className="leading-none">{participant.vote}</span>
        ) : hasVote ? (
          <Check size={23} />
        ) : (
          <span className="pb-2.5 tracking-widest">···</span>
        )}
      </button>
      <div className="player-name mt-2 flex w-full items-center justify-center gap-1.5 text-[11px]">
        <Avatar name={participant.name} index={index} small />
        <span
          className="max-w-[86px] overflow-hidden text-ellipsis whitespace-nowrap"
          title={participant.name}
        >
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
