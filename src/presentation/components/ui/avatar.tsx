import { cn } from '../../lib/cn';

const tones = [
  'bg-avatar-0 text-avatar-0-fg',
  'bg-avatar-1 text-avatar-1-fg',
  'bg-avatar-2 text-avatar-2-fg',
  'bg-avatar-3 text-avatar-3-fg',
  'bg-avatar-4 text-avatar-4-fg',
] as const;

export function Avatar({
  name,
  index = 0,
  small = false,
}: {
  name: string;
  index?: number;
  small?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        tones[index % tones.length],
        small ? 'h-[25px] w-[25px] text-[9px]' : 'h-[34px] w-[34px] text-[11px]',
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
