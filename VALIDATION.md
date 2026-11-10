# Verificação — TradeUpPoker

## Automatizada

- TypeScript em modo estrito e build de produção com Vite.
- 35 testes com Vitest: domínio, casos de uso, leitura de convites e adaptador de armazenamento.
- Formatação consistente com Prettier.

## Navegador

Conferido no navegador integrado do ambiente de desenvolvimento:

- Página inicial, criação de sala e rejeição de campo obrigatório vazio.
- Adição e seleção de história.
- Entrada pelo link em uma segunda aba com nome independente obrigatório.
- Sincronização entre abas e indicação dos votos sem expor valores antes da revelação.
- Votos 8 e 5: resultado médio 6,5, concordância 50% e cartas bloqueadas após revelar.
- Persistência da identidade e do voto após recarregar a página.
- Diálogo de convite, cópia do link e mensagem de sucesso.
- Entrada como observador e ausência de cartas para votar.
- Revisão visual da página inicial e da mesa em desktop.
- Revisão da página inicial em janelas incorporadas com larguras de 390px e 768px; formulário ajustado para uma coluna e ausência de rolagem horizontal confirmada.
- Revisão da mesa em 390px, com observador e resultado revelado, sem rolagem horizontal.

A configuração de viewport do navegador integrado não alterou a largura da aba; por isso os breakpoints foram exercitados em iframes temporários de largura definida, carregando a aplicação real. O arquivo auxiliar não faz parte da entrega.

## Limites da verificação

Não foi feita uma auditoria formal WCAG nem uma matriz completa de navegadores/dispositivos. Não há testes de servidor porque o projeto contém somente o front-end. Não existe sincronização entre dispositivos; a validação colaborativa usou abas da mesma origem e perfil.
