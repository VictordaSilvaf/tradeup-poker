import { useCallback, useEffect, useRef, useState } from 'react';
import { ListTodo, MessageSquare, X } from 'lucide-react';
import type { ChatAttachment, Participant, Room } from '../../../domain/room';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui';
import { ChatPanel } from './chat-panel';
import { IssuesPanel } from './issues-panel';

export type SidePanelTab = 'issues' | 'chat';

const MIN_WIDTH = 280;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 340;
const STORAGE_KEY = 'tradeuppoker:side-panel-width';

function clampWidth(value: number) {
  const max = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.55));
  return Math.min(max, Math.max(MIN_WIDTH, value));
}

function readStoredWidth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : DEFAULT_WIDTH;
    return Number.isFinite(parsed) ? clampWidth(parsed) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function SidePanel({
  room,
  participant,
  tab,
  onTabChange,
  onClose,
  onSendMessage,
}: {
  room: Room;
  participant: Participant;
  tab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onSendMessage: (text: string, attachments: ChatAttachment[]) => Promise<void>;
}) {
  const [width, setWidth] = useState(readStoredWidth);
  const [desktop, setDesktop] = useState(() => window.innerWidth > 1000);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(width);

  useEffect(() => {
    const onResize = () => {
      setDesktop(window.innerWidth > 1000);
      setWidth((current) => clampWidth(current));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const delta = dragStartX.current - event.clientX;
    setWidth(clampWidth(dragStartWidth.current + delta));
  }, []);

  const stopDragging = useCallback(() => {
    setDragging(false);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
  }, [onPointerMove]);

  function startDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (!desktop) return;
    event.preventDefault();
    dragStartX.current = event.clientX;
    dragStartWidth.current = width;
    setDragging(true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
  }

  return (
    <aside
      className={cn(
        'relative flex shrink-0 flex-col border-l border-border-subtle bg-[oklch(0.18_0.02_266)] px-[18px] pt-[18px] pb-4 max-[1000px]:fixed max-[1000px]:top-[78px] max-[1000px]:right-0 max-[1000px]:bottom-0 max-[1000px]:z-10 max-[1000px]:w-[min(340px,100%)] max-[1000px]:shadow-[-12px_0_30px_oklch(0.08_0.01_260/0.5)] max-[640px]:top-[70px]',
        dragging && 'select-none',
      )}
      style={desktop ? { width } : undefined}
      aria-label="Painel da sessão"
    >
      {desktop && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel"
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          className="absolute top-0 bottom-0 left-0 z-20 w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-primary/35"
          onPointerDown={startDragging}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setWidth((current) => clampWidth(current + 16));
            if (event.key === 'ArrowRight') setWidth((current) => clampWidth(current - 16));
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-1 rounded-sm bg-bg p-1">
          <button
            type="button"
            aria-pressed={tab === 'issues'}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-transparent px-2 py-2 text-[11px] text-muted',
              tab === 'issues' && 'border-border bg-surface-raised text-text',
            )}
            onClick={() => onTabChange('issues')}
          >
            <ListTodo size={14} />
            Histórias
            <span className="rounded bg-bg px-1.5 py-0.5 text-[9px]">{room.issues.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={tab === 'chat'}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-transparent px-2 py-2 text-[11px] text-muted',
              tab === 'chat' && 'border-border bg-surface-raised text-text',
            )}
            onClick={() => onTabChange('chat')}
          >
            <MessageSquare size={14} />
            Chat
            <span className="rounded bg-bg px-1.5 py-0.5 text-[9px]">{room.messages.length}</span>
          </button>
        </div>
        <IconButton aria-label="Recolher painel" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === 'issues' ? (
          <IssuesPanel room={room} actor={participant.id} />
        ) : (
          <ChatPanel
            room={room}
            participant={participant}
            active={tab === 'chat'}
            onSendMessage={onSendMessage}
          />
        )}
      </div>
    </aside>
  );
}
