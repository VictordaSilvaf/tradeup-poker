# TradeUpPoker

Front-end completo de planning poker em **React + TypeScript + Vite**, inspirado no fluxo e no tema escuro do Planning Poker Online. Não utiliza banco, servidor, cadastro ou serviços externos.

## Executar

Use Node.js 22.12+ (preferencialmente uma versão LTS suportada) e npm.

### 1. Configure o Supabase (realtime + banco)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, execute o arquivo [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Project Settings → API**, copie a URL e a chave `anon` `public`.
4. Em **Realtime**, confirme que Broadcast está habilitado.
5. Copie o ambiente local:

```bash
cp .env.example .env
```

Preencha:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Nunca coloque a chave `service_role` no frontend ou no `.env` do Vite.

Sem `.env`, o app cai no modo local (`localStorage`) só para desenvolvimento.

### 2. Subir o front

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

## Como testar duas pessoas (Supabase)

1. Configure o `.env` e rode `npm run dev`.
2. Crie uma sala e informe seu nome.
3. Abra **Convidar pessoas** e copie o link.
4. Cole o link em **outro navegador/dispositivo** (ou aba anônima) e entre com outro nome.
5. Vote em cada cliente e revele as cartas — o estado sincroniza via Realtime.

A identidade do participante continua em `sessionStorage` (por aba). Fechar a aba não remove a pessoa da sala até **Perfil → Sair da sala**.

### Segurança

- Acesso às salas só via RPCs (`get_room` / `create_room` / `save_room`); sem SELECT direto na tabela.
- O ID da sala funciona como segredo do convite (UUID).
- Antes da revelação, a UI mascara o valor do voto dos outros (`voted` permanece visível).
- A chave `anon` é pública por design; a proteção está no schema/RLS/RPCs.
- Para sigilo criptográfico absoluto dos votos no servidor, o próximo passo seria mover mutações para Edge Functions.

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

Com Supabase, o estado da sala fica em Postgres (`rooms.payload` JSONB) com controle de versão otimista. `sessionStorage` guarda a identidade por sala/aba; `localStorage` guarda só a lista de salas recentes. Realtime usa broadcast no canal `room:{id}` (com polling de fallback). Sem `.env`, o adaptador local (`localStorage`) permanece disponível.

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
