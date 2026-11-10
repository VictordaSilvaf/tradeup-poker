import type { CSSProperties } from 'react';
import { UserPlus } from 'lucide-react';
import type { Room } from '../../../domain/room';
import { summarizeVotes } from '../../../domain/room';
import { useRevealCountdown } from '../../hooks/use-reveal-countdown';
import { cn } from '../../lib/cn';
import { TextButton } from '../ui';
import { PlayerSeat } from './player-seat';
import { seatingLayout } from './seating-layout';
import { TableCenter } from './table-center';

export function VotingTable({
  room,
  currentId,
  busy,
  onReveal,
  onCompleteReveal,
  onRestart,
  onInvite,
}: {
  room: Room;
  currentId: string;
  busy: boolean;
  onReveal: () => void;
  onCompleteReveal: () => void;
  onRestart: () => void;
  onInvite: () => void;
}) {
  const voters = room.participants.filter((participant) => !participant.spectator);
  const voted = voters.filter((participant) => participant.vote !== null).length;
  const { average, agreement } = summarizeVotes(
    voters.filter((participant) => participant.vote !== null).map((participant) => participant.vote!),
  );
  const count = room.participants.length;
  const currentIndex = Math.max(
    0,
    room.participants.findIndex((participant) => participant.id === currentId),
  );
  const layout = seatingLayout(count);
  const countdown = useRevealCountdown(room.revealEndsAt, room.revealed, onCompleteReveal);
  const revealing = countdown !== null && !room.revealed;

  return (
    <section
      className="@container relative flex min-h-0 flex-1 flex-col items-center justify-center px-0 pb-12 pt-2"
      aria-label="Mesa de votação"
    >
      {room.participants.length === 1 && !revealing && (
        <div className="mb-2 flex shrink-0 flex-col items-center text-[11px] text-muted">
          <span>A melhor estimativa é feita em equipe.</span>
          <TextButton blue className="pt-1.5 text-[11px]" onClick={onInvite}>
            <UserPlus size={15} /> Convide mais pessoas
          </TextButton>
        </div>
      )}
      <div
        className={cn('relative mx-auto max-h-full w-[min(720px,100%,calc(100cqh*var(--table-ratio)))]')}
        style={
          {
            '--seat-count': count,
            '--table-ratio': layout.ratio,
            aspectRatio: String(layout.ratio),
          } as CSSProperties
        }
      >
        <div className="absolute inset-[22%_18%] flex min-h-0 rounded-full border border-[oklch(0.34_0.045_260)] bg-surface p-[11px] @max-[560px]:inset-[26%_12%] @max-[560px]:p-1.5">
          <TableCenter
            revealing={revealing}
            countdown={countdown}
            revealed={room.revealed}
            voted={voted}
            votersCount={voters.length}
            average={average}
            agreement={agreement}
            busy={busy}
            onReveal={onReveal}
            onRestart={onRestart}
          />
        </div>
        {room.participants.map((participant, index) => {
          const seatIndex = (index - currentIndex + count) % count;
          const seat = layout.seats[seatIndex];
          return (
            <PlayerSeat
              key={participant.id}
              participant={participant}
              current={participant.id === currentId}
              owner={participant.id === room.ownerId}
              index={index}
              revealed={room.revealed}
              revealing={revealing}
              side={seat.side}
              style={
                {
                  '--seat-x': `${seat.x}%`,
                  '--seat-y': `${seat.y}%`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </section>
  );
}

export { seatingLayout } from './seating-layout';
