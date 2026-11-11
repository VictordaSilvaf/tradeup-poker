import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import type { Room } from '../../../domain/room';
import { Button, ErrorMessage, Field, InfoNote, LargeIcon, Modal } from '../ui';

export function InviteModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const link = `${location.origin}${location.pathname}#/sala/${room.id}`;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setError('');
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie o link abaixo.');
    }
  }

  return (
    <Modal title="Puxe uma cadeira para a equipe" onClose={onClose}>
      <LargeIcon>
        <Link2 size={27} />
      </LargeIcon>
      <p className="mt-4 text-sm text-muted">
        Copie o convite de <strong className="text-text">{room.name}</strong>. Cada pessoa informa
        seu nome antes de entrar.
      </p>
      <Field
        className="my-5"
        label="Link da sala"
        value={link}
        readOnly
        onFocus={(event) => event.target.select()}
      />
      <Button className="w-full" onClick={() => void copy()}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? 'Link copiado!' : 'Copiar convite'}
      </Button>
      <p className="mt-[18px] flex justify-center gap-3 text-xs text-muted">
        Código da sala <code className="tracking-wider text-text">{room.id}</code>
      </p>
      <ErrorMessage message={error} />
      <InfoNote title="Funciona em qualquer dispositivo">
        Quem abrir o link entra na mesma sala em tempo real — celular, outro computador ou outra
        aba. Peça para cada pessoa informar o próprio nome ao entrar.
      </InfoNote>
    </Modal>
  );
}
