import { ChevronDown, History, ListTodo, UserPlus } from 'lucide-react';
import { isRealtimeEnabled } from '../../../app/dependencies';
import type { Participant, Room } from '../../../domain/room';
import { Avatar, Brand, Button, IconButton, StatusDot } from '../ui';
import { Timer } from './timer';

export function RoomHeader({
  room,
  participant,
  panelOpen,
  busy,
  onLeave,
  onToggleTimer,
  onOpenModal,
  onTogglePanel,
}: {
  room: Room;
  participant: Participant;
  panelOpen: boolean;
  busy: boolean;
  onLeave: () => void;
  onToggleTimer: () => void;
  onOpenModal: (modal: 'invite' | 'settings' | 'profile' | 'history') => void;
  onTogglePanel: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[78px] items-center gap-[22px] border-b border-border-subtle bg-bg px-7 py-3.5 max-[1200px]:gap-4 max-[1200px]:px-[22px] max-[640px]:min-h-[70px] max-[640px]:flex-wrap max-[640px]:gap-2.5 max-[640px]:px-4 max-[640px]:py-3">
      <Brand
        compact
        onClick={(event) => {
          event.preventDefault();
          onLeave();
        }}
      />
      <span className="block h-7 w-px shrink-0 bg-border max-[1000px]:hidden" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <button
          className="flex min-w-0 items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-semibold"
          onClick={() => onOpenModal(room.ownerId === participant.id ? 'settings' : 'invite')}
          title={room.name}
        >
          <span className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap max-[1200px]:max-w-[220px] max-[1000px]:max-w-[185px] max-[640px]:max-w-[165px]">
            {room.name}
          </span>
          <ChevronDown size={15} />
        </button>
        <span className="flex items-center gap-1.5 text-[9px] text-muted">
          <StatusDot className="h-[5px] w-[5px]" />{' '}
          {isRealtimeEnabled ? 'Sincronizado (Supabase)' : 'Sessão local'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-[15px] max-[1200px]:gap-2.5 max-[640px]:gap-2">
        <Timer endsAt={room.timerEndsAt} onToggle={onToggleTimer} disabled={busy} />
        <IconButton
          className="max-[640px]:hidden"
          aria-label="Histórico de rodadas"
          title="Histórico"
          onClick={() => onOpenModal('history')}
        >
          <History size={20} />
        </IconButton>
        <span className="block h-7 w-px shrink-0 bg-border max-[1000px]:hidden" />
        <button
          className="flex items-center gap-2 border-0 bg-transparent px-0 py-1 text-xs"
          onClick={() => onOpenModal('profile')}
          aria-label={`Editar perfil de ${participant.name}`}
        >
          <Avatar name={participant.name} small />
          <span className="max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap max-[1000px]:hidden">
            {participant.name}
          </span>
          <ChevronDown size={14} className="max-[640px]:hidden" />
        </button>
        <Button onClick={() => onOpenModal('invite')} className="min-h-[38px] px-3.5 text-xs whitespace-nowrap max-[640px]:h-[34px] max-[640px]:min-h-[34px] max-[640px]:w-[34px] max-[640px]:p-1.5">
          <UserPlus size={17} />
          <span className="max-[640px]:hidden">Convidar pessoas</span>
        </Button>
        <IconButton
          active={panelOpen}
          aria-label={panelOpen ? 'Ocultar histórias' : 'Mostrar histórias'}
          aria-expanded={panelOpen}
          onClick={onTogglePanel}
        >
          <ListTodo size={21} />
        </IconButton>
      </div>
    </header>
  );
}
