import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Avatar } from './avatar';

export type ToastTone = 'poke' | 'info' | 'success';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  avatarName?: string;
  durationMs?: number;
};

type ToastContextValue = {
  items: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'> & { id?: string }) => {
      const id = toast.id ?? crypto.randomUUID();
      const durationMs = toast.durationMs ?? 3200;
      setItems((current) => [{ ...toast, id, tone: toast.tone ?? 'info' }, ...current].slice(0, 2));
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ items, pushToast, dismiss }), [dismiss, items, pushToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function ToastViewport({ className }: { className?: string }) {
  const { items, dismiss } = useToast();
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-3 left-1/2 z-40 flex w-[min(340px,calc(100%-24px))] -translate-x-1/2 flex-col items-center gap-2',
        className,
      )}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const poke = item.tone === 'poke';
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full items-center gap-2.5 rounded-full border px-3 py-2 animate-toast-in',
        poke
          ? 'border-[oklch(0.55_0.08_55/0.45)] bg-[oklch(0.22_0.03_55)] text-[oklch(0.92_0.04_75)]'
          : 'border-border bg-surface/95 text-text backdrop-blur-sm',
      )}
    >
      {item.avatarName ? (
        <Avatar name={item.avatarName} small />
      ) : (
        <span className="grid h-[25px] w-[25px] place-items-center rounded-full bg-surface-raised text-[10px] text-muted">
          i
        </span>
      )}
      <p className="m-0 min-w-0 flex-1 truncate text-[12px] font-medium">{item.title}</p>
      <button
        type="button"
        aria-label="Fechar aviso"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-0 bg-transparent text-current/55 hover:bg-black/10 hover:text-current"
        onClick={onDismiss}
      >
        <X size={13} />
      </button>
    </div>
  );
}
