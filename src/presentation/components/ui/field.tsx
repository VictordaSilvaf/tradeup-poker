import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

export function Field({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && (
        <small id={`${id}-hint`} className="text-[11px] leading-normal text-muted">
          {hint}
        </small>
      )}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  id,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      <label htmlFor={selectId} className="text-xs font-semibold">
        {label}
      </label>
      <select id={selectId} {...props}>
        {children}
      </select>
      {hint && <small className="text-[11px] leading-normal text-muted">{hint}</small>}
    </div>
  );
}

export function CheckLabel({
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed',
        className,
      )}
    >
      <input type="checkbox" className="mt-0.5" {...props} />
      <span>{children}</span>
    </label>
  );
}
