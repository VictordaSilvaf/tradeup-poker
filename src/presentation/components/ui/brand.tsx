import type { ButtonHTMLAttributes, MouseEventHandler } from 'react';
import { Layers2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function Brand({
  compact = false,
  onClick,
}: {
  compact?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="inline-flex w-fit shrink-0 items-center gap-2.5"
      aria-label="TradeUpPoker — início"
    >
      <span className="grid h-[38px] w-9 place-items-center text-primary">
        <Layers2 size={24} strokeWidth={2.1} />
      </span>
      <span className="text-2xl font-extrabold leading-none tracking-tight">
        TradeUp<span className="text-primary">Poker</span>
      </span>
      {!compact && (
        <span className="ml-2 border-l border-border pl-[18px] text-xs tracking-wide text-muted">
          planning poker
        </span>
      )}
    </Link>
  );
}

export function TextButton({
  className,
  blue,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { blue?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 border-0 bg-transparent py-2 text-[13px]',
        blue ? 'text-primary hover:text-primary-hover' : 'text-muted hover:text-text',
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-sm border border-transparent bg-transparent text-muted hover:bg-surface-raised hover:text-primary',
        active && 'bg-surface-raised text-primary',
        className,
      )}
      {...props}
    />
  );
}
