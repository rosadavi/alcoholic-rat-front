---
name: sync-backend
description: Lê o projeto backend (por padrão o alcoholic-rat em /home/rosa/projects/personal/alcoholic-rat, ou o caminho passado como argumento), descobre o que mudou desde a última sincronização (novos endpoints, DTOs, regras de acesso, validações, erros) e cria ou atualiza as telas e a camada de API deste frontend para cobrir essas funcionalidades. Use quando o usuário disser que o backend tem uma funcionalidade nova, pedir para "sincronizar com o backend", "atualizar o front com a API" ou rodar /sync-backend.
argument-hint: "[caminho-do-backend] [--full]"
---

# Sincronizar o frontend com o backend

Objetivo: o frontend deve conseguir fazer **tudo o que a API faz hoje**, e nada que ela ainda não faz. Cada vez que a skill roda, ela descobre o que é novo no backend e implementa só isso, seguindo os padrões que já existem aqui.

## Argumentos

- `$ARGUMENTS` pode trazer um caminho para o backend. Sem caminho, use o `backendPath` de [sync-state.json](sync-state.json) (padrão: `/home/rosa/projects/personal/alcoholic-rat`).
- `--full` ignora o commit salvo e reanalisa o backend inteiro, comparando com o que o front já cobre.

## Passo 1: descobrir o que mudou

1. Leia [sync-state.json](sync-state.json) para ter o `lastSyncedCommit` e a lista `covered` (endpoints que o front já cobre).
2. No backend, rode `git -C <backend> log --oneline <lastSyncedCommit>..HEAD` e `git -C <backend> diff --stat <lastSyncedCommit>..HEAD`. Veja também `git -C <backend> status --short`, porque mudanças ainda não commitadas também contam. Se o commit salvo não existir (histórico reescrito, outro backend) ou se for `--full`, faça a análise completa.
3. Leia os arquivos alterados que importam para o front. Num backend Spring como o alcoholic-rat:
   - `controller/*` → rotas, métodos, status de resposta, headers (`Location`), parâmetros (`@PathVariable`, `@RequestParam`, paginação, multipart).
   - `DTO/**` → formato de entrada e saída. As anotações de validação (`@NotBlank`, `@Size`, `@Email`, `@DecimalMin`...) viram validação no formulário.
   - `domain/**` → campos da entidade, quando o controller devolve a entidade direto.
   - `auth/security/SecurityConfiguration.java` → o que é público, o que exige login e o que exige um papel (`hasRole`).
   - `exception/GlobalExceptionHandler.java` e as exceções → status e mensagens de erro.
   - `README.md` → as tabelas de endpoints e respostas e o roadmap. Use para confirmar o que você leu no código, mas **o código manda**: se o README discordar do código, siga o código e avise o usuário.
4. Se o backend for de outra stack, faça o mesmo mapeamento com o equivalente dela (rotas, schemas de entrada e saída, regras de acesso, erros).

Monte uma lista de mudanças: endpoints novos, alterados e removidos, mudanças no contrato (campos, validações, status) e mudanças de permissão.

## Passo 2: planejar e confirmar

Antes de escrever código, mostre ao usuário um plano curto:

- O que mudou no backend (uma linha por endpoint ou regra).
- O que vai ser criado ou alterado no front (telas, itens de menu, funções em `api.ts`, tipos).
- O que **não** dá para fazer só no front e precisa de mudança no backend (ex.: CORS em produção, falta de um endpoint para descobrir o papel do usuário). Sugira a mudança, mas **não altere o backend**: esta skill só lê o backend.

Se não houver nada novo, diga isso e pare. Se o plano for pequeno e sem ambiguidade, siga direto. Se houver decisões de produto em aberto (onde a tela entra, quem vê), pergunte.

## Passo 3: implementar seguindo os padrões do projeto

Leia os arquivos abaixo antes de editar. Eles são a referência de estilo:

| Onde | O que fazer |
|---|---|
| [src/lib/api.ts](../../../src/lib/api.ts) | Tipos (`type X = {...}`) espelhando os DTOs, e uma função por endpoint no objeto `api`, passando `token` nas rotas protegidas. Mensagens de erro novas da API vão para `ERROR_MESSAGES` ou para `translate()` em pt-BR. Para upload multipart, estenda `request` para aceitar `FormData`, sem `Content-Type` manual. |
| [src/lib/auth.tsx](../../../src/lib/auth.tsx) | Sessão, login e logout. O papel do usuário hoje vem de `api.probeRole` (o JWT não traz a `role`). Se o backend passar a expor o papel (claim no token ou `GET /auth/me`), troque o probe por isso. |
| [src/lib/router.ts](../../../src/lib/router.ts) | Rotas por hash. Rota nova: adicione em `Route` e `ROUTES`. |
| [src/App.tsx](../../../src/App.tsx) | Escolhe a página pela rota. |
| [src/components/app-sidebar.tsx](../../../src/components/app-sidebar.tsx) | `NAV_ITEMS`. Quando uma feature marcada `soon: true` passar a existir na API, tire o `soon` e implemente a página (ex.: o Feed). |
| [src/pages/](../../../src/pages/) | Uma página por área (`bars-page.tsx` é o modelo de lista com busca, skeleton, estado vazio, erro com "tentar de novo" e botão de admin). |
| [src/components/bar-form.tsx](../../../src/components/bar-form.tsx) | Modelo de formulário: `validate()` espelhando as regras do DTO, erros por campo vindos de `ApiError.fieldErrors`, 409 no campo certo, form dentro de um `Sheet`. |
| [src/components/ui/](../../../src/components/ui/) | Componentes shadcn (base-ui). Reaproveite os existentes. Se faltar um, crie no mesmo estilo dos que já estão lá (`cn` de `"cn"`, `data-slot`). |

Regras:

- Textos da interface em **português do Brasil**.
- O que a API restringe a um papel só aparece para esse papel (`role === "ADMIN"`), mas trate o 403 mesmo assim.
- Cada chamada tem estado de carregamento, de erro e, nas listas, de vazio.
- A validação do front repete a do backend, sem ser mais rígida que ela.
- Não invente campos nem endpoints que não estão no código do backend. Se algo estiver só no roadmap do README, deixe como "em breve" no menu, sem tela funcional.
- Endpoints removidos no backend: remova a função, a tela e o item de menu correspondentes.
- Não mexa em arquivos de `src/components/ui/` e `src/hooks/` que você não precisou alterar.

## Passo 4: verificar

Rode com `export PATH=$HOME/.bun/bin:$PATH`:

1. `bun run typecheck` e `bun run build`: os dois precisam passar.
2. `bunx eslint src`: o erro já conhecido em `src/hooks/use-mobile.ts` não é seu. Os outros, corrija.
3. `bunx prettier --write` **só nos arquivos que você criou ou editou**.
4. Se o backend estiver rodando (`curl -s localhost:8080/`), suba o dev server (`bunx vite --port 5179` em background) e chame os endpoints novos pelo proxy (`localhost:5179/api/...`) para conferir o formato da resposta. Não crie dados no banco do usuário nem use credenciais reais sem pedir. Encerre o servidor no fim.

## Passo 5: registrar a sincronização

Atualize [sync-state.json](sync-state.json):

- `backendPath`: o caminho usado.
- `lastSyncedCommit`: `git -C <backend> rev-parse HEAD`. Se havia mudanças não commitadas no backend, diga isso ao usuário, porque elas não ficam registradas no commit salvo.
- `lastSyncedAt`: data de hoje.
- `covered`: a lista atualizada de `"MÉTODO /rota"` que o front cobre.

## Resposta final

Em pt-BR e curta: o que mudou no backend, o que foi feito no front (com links para os arquivos), o resultado da verificação e o que ficou pendente ou depende do backend. Não faça commit, a não ser que o usuário peça.
