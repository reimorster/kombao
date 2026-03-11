# Contrato

Status: draft de produto e integracao. Nao estavel.

Este documento descreve o comportamento alvo do sistema, separado do estado atual implementado. A intencao aqui e organizar o escopo antes de mexer em banco, API e interface.

## 1. Estado atual implementado

Hoje o sistema entrega:

- autenticacao simples com um unico usuario definido em `.env`
- sessao por bearer token em memoria
- namespaces privados
- atividades com tres estados operacionais no quadro: `do`, `doing` e `done`
- edicao de titulo, descricao e estado na sidebar

Limitacoes relevantes neste momento:

- nao existe cadastro persistente de usuarios
- nao existe historico de eventos
- nao existe compartilhamento de namespaces
- nao existe controle de permissao por leitura/escrita
- o contrato atual da API ainda esta acoplado ao quadro de tres colunas

## 2. Objetivo do draft

Evoluir o sistema de um kanban simples para um espaco colaborativo com:

- usuarios persistentes
- primeiro acesso controlado
- administracao de usuarios
- compartilhamento de namespaces
- historico de eventos por atividade
- estados de atividade mais ricos que o quadro visual

## 3. Decisoes de contrato

### 3.1 Identidade e acesso

- As credenciais do `.env` servem apenas para bootstrap do primeiro acesso.
- No primeiro login valido, o usuario bootstrap passa a existir como administrador persistente.
- Esse administrador deve ser obrigado a trocar a senha no primeiro acesso.
- A area autenticada deve permitir alterar nome de usuario, email e senha.
- A administracao deve permitir criar outros usuarios com acesso ao sistema.

Observacao de implementacao:

- O `.env` deixa de ser fonte permanente de autenticacao e passa a ser apenas mecanismo de inicializacao.

### 3.2 Usuarios e papeis

Perfis iniciais previstos:

- `admin`: administra usuarios e acessos ao sistema
- `user`: usa namespaces aos quais recebeu acesso

Escopo deste draft:

- nao ha necessidade de RBAC generico agora
- o contrato pode comecar com os dois perfis acima

### 3.3 Namespace

- Namespace representa um espaco de trabalho compartilhavel.
- Um namespace possui nome editavel.
- Um namespace pode ser compartilhado com usuarios do sistema.
- O compartilhamento deve suportar pelo menos leitura e escrita.

Permissoes previstas:

- `read`: visualiza namespaces e atividades
- `write_limited`: pode editar conteudo, mas nao criar, apagar ou arquivar atividades
- `write`: acesso total ao namespace

Observacao:

- Como primeira iteracao, `read` e `write` ja resolvem boa parte do fluxo.
- `write_limited` pode entrar na fase seguinte se simplificar a entrega inicial.

### 3.4 Atividade

Uma atividade deve suportar:

- titulo
- descricao
- estado
- namespace
- ordenacao dentro do quadro
- historico de eventos

Eventos minimos esperados no historico:

- criacao
- edicao de campos
- mudanca de estado
- comentarios ou registros manuais de usuario

O historico deve ser exibido na sidebar em ordem decrescente de ocorrencia.

### 3.5 Estados de atividade

O contrato alvo de dominio passa a ser:

- `created`
- `ongoing`
- `done`
- `archived`
- `postponed`
- `abandoned`

Regra importante:

- esses estados pertencem ao dominio da atividade, nao necessariamente ao layout do quadro

Consequencia para a interface:

- o quadro principal continua podendo exibir um subconjunto operacional de estados
- `created`, `ongoing` e `done` formam o fluxo principal do board
- `archived`, `postponed` e `abandoned` podem aparecer primeiro na sidebar, filtros e acoes de detalhe antes de virarem colunas

Mapeamento temporario para compatibilidade com a implementacao atual:

- `do` -> `created`
- `doing` -> `ongoing`
- `done` -> `done`

### 3.6 Layout e UX

#### Tela inicial

- `Kombao` deve aparecer com mais destaque do que a descricao do produto.

#### Layout autenticado

- area superior: nome do namespace atual e acao de renomear com icone de lapis
- area central: quadro do projeto
- sidebar: detalhes da atividade selecionada e historico
- area inferior em desktop: abas com namespaces ativos
- navegacao em telas pequenas: substituir a barra inferior fixa por menu apropriado

#### Comportamentos desejados

- a rolagem principal deve afetar apenas a area central
- ao focar a area central, a area superior pode perder destaque visual
- deve existir um modo de foco para ocultar temporariamente area superior e inferior
- a criacao de atividade deve usar botao `+`
- menus de contexto proximos ao topo devem abrir para cima quando necessario para nao quebrar o layout

Observacao:

- "otimizar espaco da tela" passa a ser tratado como principio de interface, nao como requisito isolado

## 4. Fora de escopo desta iteracao

- alterar destrutivamente o schema atual sem plano de migracao
- expandir imediatamente o board para seis colunas
- construir um sistema generico de permissoes complexo antes de validar o fluxo principal

## 5. Plano de implementacao incremental

### Fase 1. Contrato draft no ponto de uso

Objetivo:

- introduzir o contrato alvo primeiro no frontend, no ponto de uso, sem depender de mudanca imediata de banco

Escopo sugerido:

- criar tipos de dominio do draft no frontend para usuario, permissao, atividade e estados alvo
- introduzir um adaptador entre contrato atual da API e contrato draft de UI
- mapear `do/doing/done` para `created/ongoing/done`
- expor o novo estado de dominio na sidebar de detalhes da atividade
- manter o board ainda com tres colunas operacionais para preservar compatibilidade

Ponto de uso recomendado para a primeira iteracao:

- [frontend/src/components/CardDetails.tsx](/Users/reimor/kanban/frontend/src/components/CardDetails.tsx)

Razao:

- e o lugar onde o contrato de atividade aparece de forma mais rica
- permite validar nomes de estados, acoes futuras e estrutura de historico sem quebrar drag and drop nem API

Entregaveis da Fase 1:

- modulo de contrato draft no frontend
- adaptadores de compatibilidade entre API atual e contrato draft
- sidebar exibindo os estados alvo de dominio
- campos ou placeholders preparados para historico e permissoes, mesmo que ainda alimentados por mock/adaptador

### Fase 2. Persistencia de usuarios e bootstrap real

Objetivo:

- substituir autenticacao efemera por usuarios persistentes

Passos:

- introduzir tabelas de usuarios e sessoes ou equivalente
- transformar credenciais do `.env` em bootstrap de administrador
- implementar forca de troca de senha no primeiro acesso

### Fase 3. Compartilhamento de namespaces

Objetivo:

- permitir acesso multiusuario por namespace

Passos:

- adicionar relacionamento de membros por namespace
- introduzir permissoes iniciais `read` e `write`
- validar se `write_limited` entra agora ou em fase seguinte

### Fase 4. Historico e estados completos

Objetivo:

- persistir trilha de eventos e completar o contrato de dominio da atividade

Passos:

- criar tabela de eventos da atividade
- registrar criacao, edicao e mudancas de estado
- permitir `archived`, `postponed` e `abandoned` no backend
- decidir se esses estados entram apenas em filtros/detalhes ou tambem em colunas

## 6. Riscos e decisoes pendentes

- Confirmar se `write_limited` precisa existir ja na primeira entrega multiusuario.
- Confirmar se `archived`, `postponed` e `abandoned` ficam fora do board principal de forma permanente.
- Definir se historico tera comentarios livres desde a primeira versao ou apenas eventos automáticos.
- Definir se a administracao de usuarios fica no frontend principal ou em area separada.
