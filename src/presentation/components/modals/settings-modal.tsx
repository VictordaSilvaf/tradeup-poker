import { useState, type FormEvent } from 'react';
import { DECKS } from '../../../domain/room';
import type { DeckId, Room } from '../../../domain/room';
import { planning } from '../../../app/dependencies';
import { useAction } from '../../hooks/use-action';
import { Button, ErrorMessage, Field, Modal, SelectField } from '../ui';

export function SettingsModal({
  room,
  actor,
  onClose,
}: {
  room: Room;
  actor: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [deck, setDeck] = useState<DeckId>(room.deck);
  const { run, busy, error } = useAction();

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await planning.configure(room.id, actor, name, deck);
      onClose();
    });
  }

  return (
    <Modal title="Configurações da sala" onClose={onClose}>
      <form className="flex flex-col gap-[21px]" onSubmit={submit}>
        <Field
          label="Nome da sala"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <SelectField
          label="Baralho"
          id="settings-deck"
          value={deck}
          hint="Trocar o baralho inicia uma nova rodada."
          onChange={(event) => setDeck(event.target.value as DeckId)}
        >
          {Object.entries(DECKS).map(([id, option]) => (
            <option key={id} value={id}>
              {option.name}
            </option>
          ))}
        </SelectField>
        <ErrorMessage message={error} />
        <Button type="submit" disabled={busy}>
          Salvar alterações
        </Button>
      </form>
    </Modal>
  );
}
