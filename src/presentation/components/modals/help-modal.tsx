import { Eye, MousePointer2, Users } from 'lucide-react';
import { InfoNote, Modal } from '../ui';

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Uma conversa, uma estimativa" onClose={onClose}>
      <p className="text-sm text-muted">
        Planning poker ajuda a equipe a estimar o esforço de uma história sem influenciar o voto das
        outras pessoas.
      </p>
      <ol className="my-6 flex list-none flex-col gap-[22px] p-0">
        <li className="flex items-start gap-4">
          <Users className="mt-0.5 w-5 text-primary" />
          <div>
            <strong className="text-[13px]">Reúna a equipe</strong>
            <p className="mt-1 text-xs text-muted">
              Crie uma sala, adicione as histórias e escolha qual estimar.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <MousePointer2 className="mt-0.5 w-5 text-primary" />
          <div>
            <strong className="text-[13px]">Cada pessoa escolhe uma carta</strong>
            <p className="mt-1 text-xs text-muted">
              Os números representam esforço relativo. Use ? se precisar conversar e ☕ para pedir
              uma pausa.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <Eye className="mt-0.5 w-5 text-primary" />
          <div>
            <strong className="text-[13px]">Revelem e conversem</strong>
            <p className="mt-1 text-xs text-muted">
              Discutam as diferenças. Se necessário, votem novamente até chegar a um consenso.
            </p>
          </div>
        </li>
      </ol>
      <InfoNote title="Sobre esta versão">
        As salas ficam salvas neste navegador. Para testar várias pessoas, abra o link em outra aba
        do mesmo navegador. Outros dispositivos ainda não compartilham os dados.
      </InfoNote>
    </Modal>
  );
}
