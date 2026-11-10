import { summarizeVotes } from '../../../domain/room';
import type { Room } from '../../../domain/room';
import { formatNumber } from '../../lib/format';
import { Modal } from '../ui';

export function HistoryModal({ room, onClose }: { room: Room; onClose: () => void }) {
  return (
    <Modal title="Histórico de rodadas" onClose={onClose} wide>
      {room.history.length ? (
        <div>
          {room.history.map((round) => {
            const summary = summarizeVotes(round.votes);
            return (
              <article
                key={round.id}
                className="flex justify-between gap-6 border-t border-border-subtle py-[18px]"
              >
                <div className="min-w-0">
                  <small className="text-[11px] text-muted">
                    Rodada {round.number} ·{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(round.finishedAt))}
                  </small>
                  <h3 className="my-2 text-sm [overflow-wrap:anywhere]">{round.title}</h3>
                  <p className="m-0 text-[11px] text-muted">{round.votes.join(' · ')}</p>
                </div>
                <div className="w-[130px] shrink-0 text-right">
                  <strong className="mb-1 block text-[25px]">{formatNumber(summary.average)}</strong>
                  <small className="text-[11px] text-muted">
                    Média · {summary.agreement}% de concordância
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-[26px]">
          <h3 className="text-lg">As boas conversas ficam por aqui.</h3>
          <p className="text-[13px] text-muted">
            Revele os votos e inicie uma nova rodada para guardar o primeiro resultado.
          </p>
        </div>
      )}
      <p className="mt-5 text-xs text-muted">Até 50 rodadas ficam salvas neste navegador.</p>
    </Modal>
  );
}
