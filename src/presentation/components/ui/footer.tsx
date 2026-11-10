import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Footer() {
  return (
    <footer className="mx-auto mb-10 flex w-[min(1130px,88.6%)] items-center justify-between gap-4 text-[11px] text-subtle">
      <span>Menos incertezas. Mais conversa.</span>
      <span className="inline-flex items-center gap-1">
        Feito para construir em equipe <ArrowUpRight size={14} />
      </span>
    </footer>
  );
}

export function StatusDot({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-success', className)} />
  );
}
