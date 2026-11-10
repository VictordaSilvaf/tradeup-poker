import { StatusDot } from '../ui';
import { LobbyPreview } from './lobby-preview';

export function HomeHero() {
  return (
    <section className="self-start pt-5">
      <div className="mb-[26px] flex items-center gap-2.5 text-xs text-muted">
        <StatusDot className="bg-primary" /> O espaço para o próximo consenso
      </div>
      <h1 className="mb-[26px] text-[60px] leading-[1.13] font-semibold tracking-tight text-balance max-[900px]:text-[42px]">
        Grandes entregas.
        <br />
        Um ponto de
        <br />
        <span className="text-primary">cada vez.</span>
      </h1>
      <p className="max-w-[380px] text-sm leading-[1.85] text-muted">
        Reúna sua equipe, coloque as cartas na mesa e transforme diferentes perspectivas em boas
        estimativas.
      </p>
      <LobbyPreview />
    </section>
  );
}
