import { Check, Eye, Layers2 } from 'lucide-react';
import { Avatar, StatusDot } from '../ui';

export function LobbyPreview() {
  return (
    <div
      className="relative mt-10 grid max-w-[420px] grid-cols-[1fr_1.4fr_1fr] grid-rows-[auto_auto_auto] items-center gap-3"
      aria-label="Exemplo ilustrativo de uma mesa de planning poker"
    >
      <div className="col-span-3 mb-2 flex items-center gap-2 text-[11px] text-muted">
        <StatusDot className="bg-primary" /> Uma equipe. Diferentes perspectivas.
      </div>
      <div className="col-start-2 row-start-1 flex flex-col items-center gap-1.5 text-[11px]">
        <Avatar name="Marina" index={1} />
        <span>Marina</span>
        <span className="rounded bg-primary px-2 py-0.5 text-[12px] font-semibold text-primary-ink">
          8
        </span>
      </div>
      <div className="col-start-2 row-start-2 flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[70px] border border-[oklch(0.34_0.045_260)] bg-table px-6 py-5 text-center text-[12px] text-muted">
        <span className="text-primary">
          <Layers2 size={26} />
        </span>
        <span>
          O próximo ponto
          <br />
          começa com você.
        </span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Eye size={13} /> Votos revelados
        </div>
      </div>
      <div className="col-start-1 row-start-2 flex flex-col items-center gap-1.5 text-[11px]">
        <span className="rounded bg-primary px-2 py-0.5 text-[12px] font-semibold text-primary-ink">
          5
        </span>
        <Avatar name="Rafael" index={2} />
        <span>Rafael</span>
      </div>
      <div className="col-start-3 row-start-2 flex flex-col items-center gap-1.5 text-[11px]">
        <span className="rounded bg-primary px-2 py-0.5 text-[12px] font-semibold text-primary-ink">
          8
        </span>
        <Avatar name="Você" />
        <span className="inline-flex items-center gap-1">
          Você <Check size={12} />
        </span>
      </div>
      <span className="col-span-3 mt-2 text-center text-[10px] text-subtle">
        Uma prévia da sua próxima sessão
      </span>
    </div>
  );
}
