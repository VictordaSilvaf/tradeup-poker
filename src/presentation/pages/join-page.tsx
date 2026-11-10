import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Room } from '../../domain/room';
import { planning } from '../../app/dependencies';
import { recentRooms } from '../../infra/recent-rooms';
import { session } from '../../infra/session';
import { Brand, Button, CheckLabel, ErrorMessage, Field, LargeIcon } from '../components/ui';
import { useAction } from '../hooks/use-action';

export function JoinPage({ room, onJoin }: { room: Room; onJoin: (id: string) => void }) {
  const [name, setName] = useState('');
  const [spectator, setSpectator] = useState(false);
  const { run, busy, error } = useAction();

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const result = await planning.joinRoom(room.id, name, spectator);
      try {
        session.save(room.id, result.participant.id);
        recentRooms.remember(room.id);
      } catch (saveError) {
        await planning.leave(room.id, result.participant.id);
        throw saveError;
      }
      onJoin(result.participant.id);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col">
      <header className="flex min-h-[100px] items-center px-[5.7%] py-[25px]">
        <Brand />
      </header>
      <main className="mx-auto mt-8 mb-16 w-[min(460px,90%)] rounded-xl border border-border bg-surface p-8 text-center">
        <LargeIcon>
          <Users size={28} />
        </LargeIcon>
        <span className="mt-5 block text-sm text-muted">Você foi convidado para</span>
        <h1 className="mt-2 text-[28px] tracking-tight">{room.name}</h1>
        <p className="text-sm text-muted">
          Antes de puxar uma cadeira, conte como podemos chamar você.
        </p>
        <form className="mt-6 flex flex-col gap-[21px] text-left" onSubmit={submit}>
          <Field
            label="Seu nome"
            required
            autoFocus
            maxLength={30}
            placeholder="Como a equipe chama você?"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <CheckLabel checked={spectator} onChange={(event) => setSpectator(event.target.checked)}>
            Entrar como observador
            <small className="mt-0.5 block text-xs text-muted">
              Acompanhe a conversa sem votar.
            </small>
          </CheckLabel>
          <ErrorMessage message={error} />
          <Button disabled={busy} type="submit" className="w-full">
            {busy ? 'Entrando…' : 'Entrar na sala'}
            <ArrowRight size={18} />
          </Button>
        </form>
        <Link
          to="/"
          className="mt-5 inline-flex items-center justify-center gap-1.5 text-[13px] text-muted hover:text-text"
        >
          <ArrowLeft size={15} /> Voltar ao início
        </Link>
      </main>
    </div>
  );
}
