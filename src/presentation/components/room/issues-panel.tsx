import { useState, type FormEvent } from 'react';
import { Check, ChevronRight, ListTodo, Plus, X } from 'lucide-react';
import type { Room } from '../../../domain/room';
import { planning } from '../../../app/dependencies';
import { useAction } from '../../hooks/use-action';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';
import { Button, ErrorMessage, IconButton } from '../ui';

export function IssuesPanel({
  room,
  actor,
  onClose,
}: {
  room: Room;
  actor: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  const { run, busy, error } = useAction();
  const completed = room.issues.filter((issue) => issue.done).length;
  const visible = room.issues.filter(
    (issue) => filter === 'all' || (filter === 'done' ? issue.done : !issue.done),
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await planning.addIssue(room.id, actor, title);
      setTitle('');
      setAdding(false);
    });
  }

  return (
    <aside
      className="flex w-[300px] shrink-0 flex-col border-l border-border-subtle bg-[oklch(0.18_0.02_266)] px-[22px] pt-[26px] pb-6 max-[1200px]:w-[270px] max-[1200px]:px-[18px] max-[1000px]:fixed max-[1000px]:top-[78px] max-[1000px]:right-0 max-[1000px]:bottom-0 max-[1000px]:z-10 max-[1000px]:w-[310px] max-[1000px]:overflow-y-auto max-[1000px]:shadow-[-12px_0_30px_oklch(0.08_0.01_260/0.5)] max-[640px]:top-[70px] max-[640px]:max-w-full"
      aria-label="Histórias da sessão"
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 flex items-center gap-2 text-[13px] font-medium">
          <ListTodo size={18} className="text-muted" /> Histórias{' '}
          <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
            {room.issues.length}
          </span>
        </h2>
        <IconButton aria-label="Recolher histórias" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <p className="mt-2 text-[11px] text-muted">Um objetivo de cada vez.</p>
      <div className="mt-4 flex gap-1 rounded-sm bg-bg p-1">
        {(['all', 'open', 'done'] as const).map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={cn(
              'flex-1 rounded-[5px] border border-transparent px-1.5 py-2 text-[11px] text-muted',
              filter === value && 'border-border bg-surface-raised text-text',
            )}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? 'Todas' : value === 'open' ? 'Pendentes' : 'Concluídas'}
          </button>
        ))}
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2">
        {visible.map((issue, index) => (
          <button
            key={issue.id}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-sm border border-transparent px-2.5 py-3 text-left',
              issue.id === room.activeIssueId && 'border-border bg-surface-raised',
            )}
            disabled={issue.done || busy}
            onClick={() => void run(() => planning.selectIssue(room.id, actor, issue.id))}
          >
            <span
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full bg-surface text-[11px] text-muted',
                issue.done && 'bg-primary text-primary-ink',
              )}
            >
              {issue.done ? <Check size={13} /> : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[12px]">
                {issue.title}
              </span>
              <small className="text-[10px] text-muted">
                {issue.done
                  ? `Concluída · média ${formatNumber(issue.estimate)}`
                  : issue.id === room.activeIssueId
                    ? 'Em votação'
                    : 'Pronta para estimar'}
              </small>
            </span>
            {!issue.done && <ChevronRight size={14} className="text-muted" />}
          </button>
        ))}
        {!visible.length && (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="text-muted">
              <ListTodo size={30} strokeWidth={1.3} />
            </span>
            <h3 className="mt-3 text-sm font-medium">
              {room.issues.length ? 'Nenhuma história por aqui' : 'O que vamos estimar?'}
            </h3>
            <p className="mt-1 text-[11px] text-muted">
              {room.issues.length
                ? 'As histórias com esse status aparecerão aqui.'
                : 'Adicione as histórias da equipe e mantenha o foco da conversa.'}
            </p>
          </div>
        )}
        {adding ? (
          <form className="flex flex-col gap-2.5 rounded-sm border border-border bg-surface p-3" onSubmit={submit}>
            <label htmlFor="issue-title" className="text-xs font-semibold">
              Título da história
            </label>
            <textarea
              id="issue-title"
              autoFocus
              required
              maxLength={160}
              rows={3}
              placeholder="Ex.: Como cliente, quero salvar meus favoritos"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                Adicionar
              </Button>
            </div>
          </form>
        ) : (
          <button
            className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-border px-3 py-3 text-xs text-muted hover:border-primary hover:text-primary"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} /> Adicionar história
          </button>
        )}
        <ErrorMessage message={error} />
      </div>
      <div className="mt-4 border-t border-border-subtle pt-4 text-[10px] text-muted">
        <span className="flex items-center justify-between">
          Progresso da sessão
          <strong className="font-medium text-text">
            {completed} / {room.issues.length}
          </strong>
        </span>
        <progress
          className="mt-3"
          value={completed}
          max={Math.max(1, room.issues.length)}
          aria-label="Histórias concluídas"
        />
        <p className="mt-3.5 text-[9px] leading-relaxed text-subtle">
          Selecione uma história para iniciar sua votação. Trocar de história inicia uma nova
          rodada.
        </p>
      </div>
    </aside>
  );
}
