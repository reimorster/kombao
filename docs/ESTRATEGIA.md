# Estrategia de Implementacao

Este documento transforma o [CONTRATO.md](/Users/reimor/kanban/CONTRATO.md) em uma sequencia pratica de execucao para as proximas iteracoes.

## Principios

- preservar compatibilidade com o sistema atual enquanto o contrato draft amadurece
- validar o novo contrato primeiro no frontend, no ponto de uso
- evitar mudancas destrutivas de banco antes de consolidar o fluxo

## Linha de execucao

### Etapa 1. Contrato draft no frontend

Objetivo:

- introduzir o modelo alvo de atividade sem exigir mudanca imediata na API

Abordagem:

- manter a API atual como fonte de dados
- adicionar tipos de dominio draft no frontend
- criar adaptadores entre contrato atual e contrato draft
- validar o novo contrato em [frontend/src/components/CardDetails.tsx](/Users/reimor/kanban/frontend/src/components/CardDetails.tsx)

Resultado esperado:

- a UI passa a falar em estados de dominio (`created`, `ongoing`, `done`, `archived`, `postponed`, `abandoned`)
- o board continua operando com tres colunas por compatibilidade
- o painel lateral passa a antecipar historico e permissoes mesmo que ainda por placeholder

### Etapa 2. Infra de desenvolvimento em Docker

Objetivo:

- padronizar desenvolvimento e testes locais em containers com reload

Abordagem:

- usar `docker-compose.yml` como compose de desenvolvimento
- montar codigo fonte por volume
- habilitar reload no backend e no frontend

Resultado esperado:

- alteracoes no codigo refletem sem rebuild completo
- ambiente local fica alinhado com o fluxo definido no contrato

### Etapa 3. Persistencia de identidade

Objetivo:

- trocar autenticacao efemera por usuarios persistentes

Dependencias:

- definicao do modelo de usuario
- bootstrap do admin a partir do `.env`
- fluxo de troca de senha no primeiro acesso

### Etapa 4. Compartilhamento e permissoes

Objetivo:

- permitir acesso multiusuario por namespace

Abordagem inicial:

- comecar com `read` e `write`
- avaliar `write_limited` apenas depois de validar o caso simples

### Etapa 5. Historico persistente e estados completos

Objetivo:

- consolidar o dominio da atividade no backend

Abordagem:

- persistir trilha de eventos
- registrar criacao, edicao e mudanca de estado
- expandir o backend para suportar os seis estados do contrato

## Ordem recomendada dos proximos commits

1. contrato draft no frontend
2. compose de desenvolvimento com reload
3. usuarios persistentes e bootstrap admin
4. compartilhamento por namespace
5. historico persistente e estados completos

## Criterio de aceite da Fase 1

- o board continua funcional com `do`, `doing` e `done`
- a sidebar passa a exibir o estado de dominio draft
- existe adaptador explicito entre contrato atual da API e contrato draft da UI
- a documentacao deixa claro que a compatibilidade atual ainda e parcial
