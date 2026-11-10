import { Eye, RotateCcw } from 'lucide-react';
import { Button } from '../ui';
import { formatNumber } from '../../lib/format';

export function TableCenter({
  revealing,
  countdown,
  revealed,
  voted,
  votersCount,
  average,
  agreement,
  busy,
  onReveal,
  onRestart,
}: {
  revealing: boolean;
  countdown: number | null;
  revealed: boolean;
  voted: number;
  votersCount: number;
  average: number | null;
  agreement: number;
  busy: boolean;
  onReveal: () => void;
  onRestart: () => void;
}) {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col items-center justify-center rounded-full border border-[oklch(0.31_0.045_260)] bg-table px-4 py-[18px] text-center"
      aria-live="polite"
    >
      {revealing ? (
        <>
          <span className="text-[11px] text-muted">Revelando em</span>
          <strong
            key={countdown}
            className="animate-countdown-pop my-2 text-[clamp(48px,12cqh,72px)] font-semibold leading-none text-primary tabular-nums"
          >
            {countdown}
          </strong>
          <span className="mb-4 text-[10px] text-muted">Preparem-se para ver as cartas</span>
        </>
      ) : revealed ? (
        <>
          <span className="text-[11px] text-muted">
            {average === null ? 'Votos revelados' : 'Estimativa média'}
          </span>
          <strong className="my-1.5 text-[44px] font-semibold leading-tight">
            {average === null ? <Eye size={36} /> : formatNumber(average)}
          </strong>
          <span className="mb-4 text-[10px] text-muted">
            {agreement === 100
              ? 'Todos na mesma página!'
              : 'Hora de conversar sobre as diferenças.'}
          </span>
          <Button variant="secondary" onClick={onRestart} disabled={busy} className="min-h-[37px] px-[15px] text-xs">
            <RotateCcw size={16} /> Votar novamente
          </Button>
        </>
      ) : (
        <>
          <h2 className="mb-1.5 text-[15px] font-medium">
            {voted === 0
              ? 'As cartas estão na mesa.'
              : voted === votersCount
                ? 'Tudo pronto para revelar!'
                : 'Cada perspectiva conta.'}
          </h2>
          <p className="mb-4 text-[11px] text-muted">
            {voted === 0
              ? 'Escolha uma carta para começar.'
              : `${voted} de ${votersCount} ${votersCount === 1 ? 'pessoa votou' : 'pessoas votaram'}.`}
          </p>
          <Button onClick={onReveal} disabled={!voted || busy} className="min-h-[37px] px-[15px] text-xs">
            <Eye size={17} /> Revelar cartas
          </Button>
          <span className="mt-3 text-[9px] text-muted max-[820px]:hidden">
            Os votos ficam ocultos até a revelação
          </span>
        </>
      )}
    </div>
  );
}
