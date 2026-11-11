import { cn } from '../../lib/cn';

export function VoteCard({
  card,
  selected,
  disabled,
  onClick,
}: {
  card: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'relative flex h-[70px] w-12 shrink-0 items-center justify-center rounded-sm border border-[oklch(0.44_0.065_260)] bg-surface text-[21px] font-medium text-primary',
        'hover:enabled:-translate-y-1.5 hover:enabled:border-primary hover:enabled:bg-table',
        selected && '-translate-y-2.5 border-primary bg-primary text-primary-ink',
        'max-[820px]:h-[62px] max-[820px]:w-[42px] max-[820px]:text-lg',
      )}
      aria-pressed={selected}
      aria-label={
        card === '☕' ? 'Pedir uma pausa' : card === '🃏' ? 'Votar: não sei' : `Votar ${card}`
      }
      disabled={disabled}
      onClick={onClick}
    >
      <span
        className={cn(
          'absolute top-1.5 left-1.5 text-[8px] leading-none text-muted',
          selected && 'text-primary-ink',
        )}
      >
        {card}
      </span>
      <span className="leading-none">{card}</span>
      <span
        className={cn(
          'absolute right-1.5 bottom-1.5 rotate-180 text-[8px] leading-none text-muted',
          selected && 'text-primary-ink',
        )}
      >
        {card}
      </span>
    </button>
  );
}
