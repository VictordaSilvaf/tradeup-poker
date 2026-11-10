import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './brand';

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={cn(
        'max-h-[calc(100dvh-48px)] overflow-y-auto rounded-lg border border-border bg-surface p-[26px] text-text backdrop:bg-[oklch(0.08_0.015_260/0.8)]',
        wide ? 'w-[min(660px,calc(100%-32px))]' : 'w-[min(460px,calc(100%-32px))]',
      )}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className="mb-[22px] flex items-center justify-between gap-4">
        <h2 id={titleId} className="m-0 text-[19px] tracking-tight">
          {title}
        </h2>
        <IconButton aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p
      className="m-0 rounded-sm border border-[oklch(0.5_0.08_20)] bg-[oklch(0.24_0.04_20)] px-3.5 py-3 text-[13px] leading-normal text-danger"
      role="alert"
    >
      {message}
    </p>
  ) : null;
}

export function LargeIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-grid h-[58px] w-[58px] place-items-center rounded-lg border border-border bg-surface-raised text-primary">
      {children}
    </span>
  );
}

export function InfoNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-md bg-surface-raised p-4 text-xs">
      <strong className="font-semibold">{title}</strong>
      <p className="mt-1.5 text-xs text-muted">{children}</p>
    </div>
  );
}
