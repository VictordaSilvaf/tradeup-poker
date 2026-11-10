import { Eye, LockKeyhole, MousePointer2 } from 'lucide-react';
import { DECKS } from '../../../domain/room';
import type { Participant, Room } from '../../../domain/room';
import { VoteCard } from './vote-card';

export function VotingDeck({
  room,
  participant,
  busy,
  onVote,
}: {
  room: Room;
  participant: Participant;
  busy: boolean;
  onVote: (value: string) => void;
}) {
  return (
    <section
      className="mx-auto w-[min(720px,100%)] border-t border-border-subtle px-0 pt-3 pb-1"
      aria-label="Suas cartas"
    >
      <div className="mb-3 flex items-center justify-between gap-4 max-[820px]:mb-2">
        <h2 className="m-0 flex items-center gap-1.5 text-xs font-medium">
          {participant.spectator ? (
            <>
              <Eye size={16} /> Você está observando
            </>
          ) : room.revealed ? (
            <>
              <LockKeyhole size={15} /> Rodada encerrada
            </>
          ) : participant.voted ? (
            <>
              <MousePointer2 size={15} /> Sua carta está na mesa
            </>
          ) : (
            'Qual é a sua estimativa?'
          )}
        </h2>
        <span className="text-[10px] text-muted">{DECKS[room.deck].name}</span>
      </div>
      {!participant.spectator && (
        <div className="flex justify-center gap-2.5 pt-1">
          {DECKS[room.deck].cards.map((card) => (
            <VoteCard
              key={card}
              card={card}
              selected={participant.vote === card}
              disabled={room.revealed || busy}
              onClick={() => onVote(card)}
            />
          ))}
        </div>
      )}
      <p className="mt-2.5 mb-0 text-center text-[10px] text-subtle max-[820px]:hidden">
        {participant.spectator
          ? 'Acompanhe os votos. Você pode mudar seu modo no perfil.'
          : room.revealed
            ? 'Conversem sobre o resultado ou iniciem uma nova rodada.'
            : 'Clique em uma carta para votar. Clique novamente para retirar seu voto.'}
      </p>
    </section>
  );
}
