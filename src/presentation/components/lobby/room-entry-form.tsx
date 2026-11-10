import type { FormEvent } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, DoorOpen, Plus, ShieldCheck } from 'lucide-react';
import { DECKS } from '../../../domain/room';
import type { DeckId, Room } from '../../../domain/room';
import { Button, ErrorMessage, Field, SelectField } from '../ui';

function LayersIcon() {
  return (
    <span className="relative block h-7 w-[35px]">
      <span className="absolute top-0 left-0 h-[25px] w-[18px] rotate-[-20deg] rounded border-[1.5px] border-primary bg-bg" />
      <span className="absolute top-0 left-[7px] h-[25px] w-[18px] rounded border-[1.5px] border-primary bg-bg" />
      <span className="absolute top-0 left-3.5 h-[25px] w-[18px] rotate-[20deg] rounded border-[1.5px] border-primary bg-bg" />
    </span>
  );
}

export function RoomEntryForm({
  mode,
  roomName,
  playerName,
  roomCode,
  deck,
  recent,
  busy,
  error,
  storageError,
  onModeChange,
  onRoomNameChange,
  onPlayerNameChange,
  onRoomCodeChange,
  onDeckChange,
  onSubmit,
  onOpenRecent,
}: {
  mode: 'create' | 'join';
  roomName: string;
  playerName: string;
  roomCode: string;
  deck: DeckId;
  recent: Room[];
  busy: boolean;
  error: string;
  storageError: string;
  onModeChange: (mode: 'create' | 'join') => void;
  onRoomNameChange: (value: string) => void;
  onPlayerNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
  onDeckChange: (value: DeckId) => void;
  onSubmit: (event: FormEvent) => void;
  onOpenRecent: (roomId: string) => void;
}) {
  return (
    <section className="w-full max-w-[445px] justify-self-end" aria-labelledby="entry-heading">
      <div className="mb-[25px]">
        <span className="block h-[27px]">
          <LayersIcon />
        </span>
        <h2 id="entry-heading" className="mt-[17px] mb-2 text-2xl font-medium tracking-tight">
          Vamos alinhar os pontos?
        </h2>
        <p className="m-0 text-[13px] text-muted">Seu próximo planejamento começa aqui.</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-2">
        <div className="flex gap-0.5 rounded-sm bg-bg p-1" aria-label="Escolha como começar">
          <button
            aria-pressed={mode === 'create'}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[5px] border px-1.5 py-2.5 text-xs ${
              mode === 'create'
                ? 'border-border bg-surface-raised text-text'
                : 'border-transparent bg-transparent text-muted hover:text-text'
            }`}
            onClick={() => onModeChange('create')}
          >
            <Plus size={17} /> Criar uma sala
          </button>
          <button
            aria-pressed={mode === 'join'}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[5px] border px-1.5 py-2.5 text-xs ${
              mode === 'join'
                ? 'border-border bg-surface-raised text-text'
                : 'border-transparent bg-transparent text-muted hover:text-text'
            }`}
            onClick={() => onModeChange('join')}
          >
            <DoorOpen size={17} /> Entrar em uma sala
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-[21px] px-5 pt-[25px] pb-3.5">
          <div className="mb-1">
            <h3 className="m-0 text-[15px] font-medium">
              {mode === 'create' ? 'Um espaço para sua equipe' : 'Sua equipe está esperando'}
            </h3>
            <p className="mt-1.5 text-[12px] text-muted">
              {mode === 'create'
                ? 'Dê um nome à sala e convide as boas ideias.'
                : 'Cole o convite ou informe o código da sala.'}
            </p>
          </div>
          {mode === 'create' ? (
            <Field
              label="Nome da sala"
              placeholder="Ex.: Refinamento • Time Produto"
              required
              maxLength={60}
              value={roomName}
              onChange={(event) => onRoomNameChange(event.target.value)}
              autoComplete="off"
            />
          ) : (
            <Field
              label="Link ou código da sala"
              placeholder="Cole o link ou digite o código"
              required
              value={roomCode}
              onChange={(event) => onRoomCodeChange(event.target.value)}
              autoComplete="off"
            />
          )}
          <Field
            label="Seu nome"
            placeholder="Como a equipe chama você?"
            hint="É assim que você vai aparecer na mesa."
            required
            maxLength={30}
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            autoComplete="given-name"
          />
          {mode === 'create' && (
            <SelectField
              label="Baralho de estimativa"
              id="deck"
              value={deck}
              onChange={(event) => onDeckChange(event.target.value as DeckId)}
            >
              {Object.entries(DECKS).map(([id, option]) => (
                <option value={id} key={id}>
                  {option.name}
                  {id === 'fibonacci' ? '  ·  0, 1, 2, 3, 5, 8…' : ''}
                </option>
              ))}
            </SelectField>
          )}
          <ErrorMessage message={error || storageError} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? 'Preparando sua mesa…'
              : mode === 'create'
                ? 'Criar sala e começar'
                : 'Entrar na sala'}
            <ArrowRight size={18} />
          </Button>
          <div className="flex gap-4 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Check size={14} /> Sem cadastro
            </span>
            <span className="inline-flex items-center gap-1">
              <Check size={14} /> No seu ritmo
            </span>
          </div>
        </form>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
        <ShieldCheck size={16} />
        <span>Versão local: suas salas ficam neste navegador.</span>
      </p>
      {recent.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-[12px] font-medium">
            <Clock3 size={15} /> Suas últimas salas
          </h3>
          {recent.slice(0, 3).map((room) => (
            <button
              key={room.id}
              className="mb-2 flex w-full items-center justify-between rounded-sm border border-border bg-surface px-3.5 py-3 text-left hover:border-primary"
              onClick={() => onOpenRecent(room.id)}
            >
              <span>
                {room.name}
                <small className="mt-1 block text-[10px] text-muted">
                  {DECKS[room.deck].name} · {room.issues.length} histórias
                </small>
              </span>
              <ChevronRight size={17} className="text-muted" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
