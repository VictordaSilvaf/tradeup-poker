# TradeUpPoker

Front-end completo de planning poker em **React + TypeScript + Vite**, inspirado no fluxo e no tema escuro do Planning Poker Online. Não utiliza banco, servidor, cadastro ou serviços externos.

## Executar

Use Node.js 22.12+ (preferencialmente uma versão LTS suportada) e npm.

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar e conferir a versão de produção:

```bash
npm run build
npm run preview
```

A pasta `dist/` pode ser servida em uma hospedagem estática. A aplicação usa rotas com `#`, portanto o servidor não precisa reescrever rotas de salas. Para hospedagem em subdiretório, configure `base` no `vite.config.ts` antes do build.

## Funcionalidades

- Página inicial com opções de criar uma sala ou entrar por código/link.
- Nome de sala obrigatório, limitado a 60 caracteres.
- Nome de participante obrigatório, limitado a 30 caracteres, também ao abrir um convite em uma nova aba.
- Sessão por aba: recarregar mantém a identidade; sair remove o participante da sala.
- Mesa com participantes, indicação de votos e papel de facilitador/observador.
- Baralhos Fibonacci, simplificado e tamanhos de camiseta.
- Seleção, troca e retirada do voto; cartas `?` e pausa `☕`.
- Revelação coletiva, distribuição, média numérica e percentual de concordância.
- Nova rodada e histórico dos últimos 50 resultados revelados.
- Histórias com título obrigatório, seleção para votação, conclusão e filtros.
- Cronômetro compartilhado de 3 minutos.
- Configurações de sala restritas ao facilitador; facilitação transferida ao sair.
- Edição de perfil e alternância entre participante e observador.
- Convite copiável com fallback manual e tratamento de sala não encontrada.
- Layout responsivo, rótulos acessíveis, foco visível, diálogos com controle de foco e movimento reduzido.

## Como testar duas pessoas sem backend

1. Crie uma sala e informe seu nome.
2. Abra **Convidar pessoas** e copie o link.
3. Cole em **uma nova aba** do mesmo navegador/perfil e informe outro nome.
4. Vote em cada aba e revele as cartas.
5. Recarregue uma aba para verificar a persistência.

As duas abas precisam usar exatamente a mesma origem: protocolo, domínio e porta. `localhost` e `127.0.0.1` têm armazenamentos diferentes. Prefira abrir uma nova aba e colar o link; alguns navegadores clonam o `sessionStorage` ao usar “Duplicar aba”.

**Limite intencional:** outras máquinas, navegadores, perfis ou portas não compartilham a sala. O link é uma referência para dados locais, não um convite remoto funcional. A interface informa essa limitação. Fechar uma aba não equivale a sair: o participante permanece salvo até usar **Perfil → Sair da sala**. A aplicação não afirma presença online real.

Os votos ficam ocultos na interface antes da revelação, mas estão no armazenamento local e não são secretos contra inspeção pelo DevTools. As permissões locais servem ao fluxo de interface; não são uma barreira de segurança de servidor.

## Clean Architecture

```text
src/
├── domain/          Entidades e regras puras, independentes de React e navegador
├── application/     Casos de uso e contratos de repositório, identidade e relógio
├── infra/           Adaptador localStorage, validação de dados e sessão por aba
├── presentation/    Páginas, components (ui/room/lobby/modals), hooks e Tailwind
├── app/             Composição das dependências, rotas e Error Boundary
└── main.tsx         Inicialização do React
```

O domínio não importa as outras camadas. `PlanningService` depende apenas do domínio e de portas; recebe `RoomRepository`, `IdentityProvider` e `Clock` pelo construtor. `LocalRoomRepository` implementa a porta e valida dados persistidos com Zod. O ponto de composição fica em `src/app/dependencies.ts`.

A apresentação chama os casos de uso pela instância composta, sem implementar regras de negócio. Os componentes da mesa e do baralho recebem estado e callbacks. Hooks tratam assinatura de mudanças, erros e bloqueio de submissões simultâneas. Formulários validam no HTML e os casos de uso repetem a validação necessária no domínio.

`localStorage` guarda salas com prefixo `tradeuppoker:room:v1:`. `sessionStorage` guarda a identidade por sala e aba. Eventos `storage` e eventos locais atualizam a interface. Web Locks serializa alterações entre abas quando disponível; sem essa API, o fallback não garante exclusão mútua entre gravações simultâneas. Os dados permanecem no navegador até o usuário limpar o armazenamento.

## Regras das estatísticas

- Média: apenas votos numéricos, incluindo zero. `?`, `☕` e camisetas não entram no cálculo.
- Concordância: quantidade da carta mais votada dividida pelo total de cartas, incluindo especiais.
- Concluir história salva sua média numérica; se não há valores numéricos, salva `null` e exibe `—`.
- Os resultados revelados são arquivados quando a rodada é reiniciada, a história é concluída, uma história diferente é selecionada ou o baralho é alterado.
- Trocar de história com votos pendentes limpa a votação; votos não revelados não são arquivados.

## Verificação

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

Os testes cobrem validações, invariantes da votação, estatísticas, convites, configuração, observadores, facilitação e histórias. Consulte `VALIDATION.md` para os cenários conferidos no navegador.

## Integração futura com backend

1. Implemente `RoomRepository` com API e assinatura de eventos por WebSocket/SSE.
2. Substitua o adaptador em `src/app/dependencies.ts`.
3. Mova a identidade para um mecanismo de sessão/autenticação de servidor.
4. Execute no servidor as regras de voto, revelação, facilitador e operações atômicas. A assinatura local `update(id, transform)` deve virar comandos explícitos na API; funções não devem ser enviadas pela rede.
5. Antes da revelação, o servidor deve enviar somente o estado “votou”, sem expor o valor das cartas dos outros participantes.
6. Acrescente presença real, reconexão, controle de concorrência e testes de contrato.

O domínio já pode ser reutilizado e os casos de uso têm testes sem navegador. O contrato atual descreve um adaptador local; não existe backend ou colaboração remota implementada.

## Referências técnicas

- [React: criar uma aplicação do zero](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite: guia de início](https://vite.dev/guide/)
- Referência visual fornecida pelo solicitante: [Planning Poker Online](https://planningpokeronline.com/DT8F05NpU0fCtcZAKO04/).

A identidade TradeUpPoker, o código e a composição visual foram criados para este projeto. Nenhum código ou ativo proprietário do site de referência foi copiado.
