import { useState, type FormEvent } from 'react';
import { LogOut } from 'lucide-react';
import type { Participant, Room } from '../../../domain/room';
import { planning } from '../../../app/dependencies';
import { useAction } from '../../hooks/use-action';
import { Button, CheckLabel, ErrorMessage, Field, Modal } from '../ui';

export function ProfileModal({
  room,
  participant,
  onClose,
  onLeave,
}: {
  room: Room;
  participant: Participant;
  onClose: () => void;
  onLeave: () => void;
}) {
  const [name, setName] = useState(participant.name);
  const [spectator, setSpectator] = useState(participant.spectator);
  const { run, busy, error } = useAction();

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await planning.updateProfile(room.id, participant.id, name, spectator);
      onClose();
    });
  }

  return (
    <Modal title="Seu lugar na mesa" onClose={onClose}>
      <form className="flex flex-col gap-[21px]" onSubmit={submit}>
        <Field
          label="Seu nome"
          required
          maxLength={30}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <CheckLabel checked={spectator} onChange={(event) => setSpectator(event.target.checked)}>
          Participar como observador
          <small className="mt-0.5 block text-xs text-muted">
            Você acompanha a sessão sem votar.
          </small>
        </CheckLabel>
        <ErrorMessage message={error} />
        <Button type="submit" disabled={busy}>
          Salvar perfil
        </Button>
      </form>
      <div className="mt-[23px] border-t border-border pt-[18px]">
        <Button variant="danger" onClick={onLeave}>
          <LogOut size={16} /> Sair da sala
        </Button>
      </div>
    </Modal>
  );
}
