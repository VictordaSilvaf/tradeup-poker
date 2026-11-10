import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover border-transparent',
  secondary:
    'bg-surface-raised border-border text-text hover:border-primary hover:bg-table',
  ghost: 'bg-transparent text-muted hover:bg-surface-raised hover:text-text border-transparent',
  danger: 'bg-transparent text-danger border-border hover:bg-[oklch(0.25_0.04_20)]',
} as const;

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={cn(
        'inline-flex min-h-[43px] items-center justify-center gap-2.5 rounded-sm border px-[17px] py-2.5 text-[13px] font-semibold leading-snug',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
