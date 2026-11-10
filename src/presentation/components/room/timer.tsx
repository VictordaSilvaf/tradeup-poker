import { useEffect, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Timer({
  endsAt,
  onToggle,
  disabled,
}: {
  endsAt: number | null;
  onToggle: () => void;
  disabled: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [endsAt]);
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 180;

  return (
    <button
      className={cn(
        'flex items-center gap-2 border-0 bg-transparent px-0 py-2.5 text-xs text-muted tabular-nums',
        endsAt && 'text-primary',
      )}
      disabled={disabled}
      onClick={onToggle}
      aria-label={endsAt && remaining > 0 ? 'Parar cronômetro' : 'Iniciar cronômetro de 3 minutos'}
      title="Cronômetro de 3 minutos"
    >
      <TimerIcon size={18} />
      <span>{`${Math.floor(remaining / 60)
        .toString()
        .padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`}</span>
    </button>
  );
}
