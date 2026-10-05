# 5-mods — cinco mods para o Claude Code

Cinco **mods** prontos para o Claude Code: economizar em chats grandes, esconder dados sensíveis enquanto você grava, acompanhar o progresso de um `/goal`, evitar que dois chats editem o mesmo arquivo e receber sugestões de próximo passo ao fim de cada resposta.

| Mod | Comandos | Para que serve |
|---|---|---|
| **Cache Keeper** | `/cache`, `/keepwarm`, `/board`, `/handoff` | Mostra se o cache do chat está quente ou frio e quanto custaria recomeçar frio; mantém chats grandes aquecidos; pergunta antes de um envio caro; quadro com todos os chats; passa o chat para um novo |
| **Recording Mode** | `/rec`, `/rec strict`, `/rec off`, `/rec config` | Esconde chaves, dados pessoais e números de negócio na tela e fecha arquivos privados enquanto você grava |
| **Goal Meter** | `/goals` | Barra de progresso para o `/goal`, feita a partir do plano de tarefas do próprio Claude, com previsão de término |
| **Collision Guard** | `/guard` | Pergunta antes de editar um arquivo que outro chat aberto mudou nos últimos 30 minutos |
| **Next Steps** | `/next`, `/next on`, `/next off` | Ao fim de cada resposta, até 3 sugestões de próximo prompt como botões acima do prompt |

---

## 1. O que são mods

A ideia é simples: **se você queria que o Claude Code fizesse algo diferente, pede para ele, e ele muda.** Um mod pode:

- **desenhar na tela** — uma linha acima do prompt, um rótulo no rodapé, um painel lateral;
- **criar comandos** de barra (`/rec`, `/guard`, `/next`…);
- **entrar antes de uma ferramenta rodar** (ex.: antes de um `Edit`) e perguntar algo na interface, em vez de só bloquear como um hook comum faria.

Tecnicamente, **mods vivem dentro de plugins**: um arquivo JavaScript (`hooks/register.mjs`) que o Claude Code carrega quando o chat começa. Instala com `/plugin` (ou `claude plugin install`) no terminal ou na aba *Code* do app Desktop. E dá para criar um novo em linguagem natural: “quero um mod que faça X”.

Outras ideias de mod que circulam: medidor de contexto (*token weather*), prévia do que seria apagado antes de apagar (*blast radius*), replay das edições passo a passo (*replay theater*). Uma boa forma de achar os seus: peça ao Claude para ler seus logs de sessão e sugerir os 5 mods que mais ajudariam seu jeito de trabalhar.

## 2. Os mods em detalhe

### Cache Keeper

Cada mensagem relê o chat inteiro. Lido do cache, isso custa 1/10 do preço normal de entrada. Quando o cache expira (5 min ou 1 h parado, conforme a conta), a próxima mensagem regrava tudo a até 2× o preço. Num chat de 400 mil tokens isso pode custar alguns dólares; manter aquecido custa centavos.

- **Linha acima do prompt:** `● cache warm 42m │ ctx 412k │ rewrite ≈ $3.30 │ session $5.12`. Fica amarela 5 min antes de expirar, com botão `keep warm`. Mostra também os limites de 5 h e semanal do plano (amarelo em 80 %, vermelho em 95 %).
- **`/keepwarm [horas|off]`:** mantém o cache aquecido (padrão 4 h, máx. 24) com um ping pequeno antes de expirar. Se o ping gravar em vez de ler, ele se desliga e avisa.
- **Proteção de envio frio:** chat acima de 150k tokens com cache expirado → pergunta *Enviar mesmo assim*, *Compactar antes* ou *Cancelar*.
- **`/board`:** todos os chats locais num painel — esperando você, trabalhando, e os que esfriam primeiro.
- **`/handoff`:** roda a skill `/session-handoff` embutida, salva o resumo, limpa o chat e envia o resumo como primeira mensagem do chat novo (dois cliques em vez de copiar, limpar e colar).
- **`/cache`:** status e ajustes — `ttl 5|60|auto`, `guard on|off`, `big 150k`, `alerts on|off`.

Os valores em dólar vêm da tabela de preços da API. **Na assinatura não viram cobrança**: aparecem como consumo dos seus limites.

### Recording Mode

Rode `/rec` antes de apertar o *gravar*. Vale para todos os chats abertos em até 3 s; `/rec off` desliga em todos.

- **Mascara na tela:** chaves de API e tokens, todo valor de `.env` da pasta do projeto (e das pastas-mãe), e-mails, nomes, telefones, endereços, números de cartão/conta/documento, valores em dinheiro e números perto de palavras de negócio. `/rec strict` mascara também todo número grande e porcentagem.
- **Esconde resultados inteiros** de ferramentas de e-mail, chat, tarefas, agenda, arquivos, CRM e finanças. O Claude recebe o resultado real; só a tela muda.
- **Fecha arquivos:** `.env`, credenciais, chaves SSH/nuvem, a pasta de memória do Claude e documentos financeiros.
- **Avisa o Claude** (nota oculta em cada prompt) para não citar nomes, números e planos internos.
- **● REC vermelho** acima do prompt e no rodapé.

Ajuste com `/rec config`, que cria `~/.claude/mods-data/recording-mode/config.json`:

```json
{
  "keepNames": ["Seu Nome", "Sua Marca"],
  "names": ["Um Colega", "Um Cliente"],
  "privatePaths": ["clientes/", "financeiro/", "notas-privadas.md"],
  "businessTools": [],
  "closedTools": []
}
```

> **Atenção para uso no Brasil:** as palavras de negócio e os padrões de mascaramento estão em inglês (*revenue*, *margin*, *payroll*, `$`). Valores em `R$`, CPF/CNPJ e termos como “faturamento” podem passar. Use `/rec strict`, preencha `names`/`privatePaths` e **revise o vídeo antes de publicar**. O mod muda o que é desenhado, não o que é armazenado, e os títulos dos chats na barra lateral do app Desktop não são mascarados.

### Goal Meter

Digite `/goal <como é o "pronto">` normalmente. O Claude escreve o plano com a ferramenta de tarefas do mod (cada tarefa P, M ou G) e marca início e fim de cada uma.

- **Linha acima do prompt:** `5 of 8 tasks · 69%`, barra, tempo decorrido, previsão (“about 17m left”), quantas vezes o plano cresceu, agentes rodando, últimas tarefas e próximas. Tecla `g` abre a lista completa.
- **Rodapé:** `◎ goal 69% · ~17m`.
- **Cálculo:** P/M/G valem 1/2/3. A previsão usa o ritmo do próprio goal e aparece depois de 2 tarefas concluídas. Se surgir trabalho novo, o plano cresce e a barra pode recuar.
- **`/goals`:** lista deste chat + goals dos outros chats nas últimas 12 h. Ajustes: `/goals hide|show`, `/goals strict on` (sem editar arquivo antes do plano existir), `/goals clear`.

Não faz chamadas extras ao modelo.

### Collision Guard

Com vários chats no mesmo projeto, dois podem mexer no mesmo arquivo sem saber. Antes de `Edit`/`Write`/`NotebookEdit`, o mod confere se outro chat aberto alterou aquele arquivo nos últimos 30 min. Se sim, pergunta:

- **Proceed** — edita assim mesmo;
- **Move to a worktree** — move o trabalho deste chat para um *git worktree* (quando o arquivo está no git);
- **Cancel** — não mexe e pergunta como seguir.

`/guard` mostra o que ele vê, `/guard off` desliga, `/guard window 60` muda a janela para 60 min. Nada é acrescentado ao prompt do Claude.

### Next Steps

Quando uma resposta termina, o mod pergunta ao modelo — reaproveitando o histórico do próprio chat, que já está em cache — quais são os próximos passos mais úteis (corrigir um bug antes, rodar os testes, fazer o commit, a próxima funcionalidade óbvia). Aparecem até 3 botões acima do prompt:

```
→ next steps
  [j] Rode os testes do módulo de login
  [k] Faça o commit das mudanças
  [l] Atualize o README com o novo comando
  [d] dismiss
```

- Apertar um botão envia aquele texto como seu próximo prompt; `d` descarta.
- Digitar seu próprio prompt também limpa as sugestões.
- As sugestões saem no idioma em que você escreve.
- **Fica em silêncio enquanto o Recording Mode estiver ligado** (para não mostrar nada sensível na tela).
- `/next off` desliga (vale para os chats seguintes), `/next on` religa, `/next` mostra o estado.

**Custo:** uma consulta pequena por resposta. Como reaproveita o cache do chat, é quase toda leitura de cache; na assinatura conta no seu limite de uso. Se não quiser esse consumo, `/next off`.

## 3. Requisitos

- **Claude Code 2.1.287 ou mais novo** (`claude --version`). Funciona no terminal e na aba *Code* do Desktop (os botões acima do prompt aparecem no terminal).
- **Mods liberados na sua conta** (a liberação está sendo gradual). Numa pasta vazia, rode `claude plugin test`: “no hooks module to load” = pode carregar; “served off” = ainda não. Dá para instalar antes; passa a funcionar quando liberar.

## 4. Instalar

### Opção A — pedir ao Claude

Abra o Claude Code e cole, com o caminho real desta pasta:

```text
Instale os cinco mods do Claude Code desta pasta: <caminho>/5-mods. Siga o INSTALL-FOR-CLAUDE.md que está nela.
```

Ele confere a versão, copia para `~/.claude/5-mods`, registra o marketplace, instala os cinco e deixa uma nota no seu `CLAUDE.md` global. Depois **abra um chat novo** e digite `/guard` — se responder, está funcionando.

### Opção B — comandos manuais

```bash
cp -a . ~/.claude/5-mods
claude plugin marketplace add "$HOME/.claude/5-mods"
```

Depois, um por vez (não em paralelo — todos escrevem no mesmo arquivo de configuração):

```bash
claude plugin install cache-keeper@5-mods
claude plugin install recording-mode@5-mods
claude plugin install goal-meter@5-mods
claude plugin install collision-guard@5-mods
claude plugin install next-steps@5-mods
```

Abra um chat novo: o mod carrega quando o chat começa (`/reload-plugins` não recarrega).

- **Atualizar:** `claude plugin marketplace update 5-mods` → `claude plugin update <mod>@5-mods` → chat novo.
- **Remover:** `claude plugin uninstall <mod>@5-mods`.

## 5. Personalizar

Peça em português, em qualquer chat:

- “No modo gravação, nunca esconda meu nome nem o nome da empresa.”
- “Faça o modo gravação fechar também a pasta `clientes/`.”
- “O collision guard deve olhar 60 minutos para trás, não 30.”
- “O cache keeper deve avisar antes de envio frio a partir de 100k tokens.”
- “O next steps deve sugerir só 2 passos e sempre incluir rodar os testes.”

O Claude segue o [CUSTOMIZE.md](CUSTOMIZE.md): primeiro tenta um comando do próprio mod, depois o arquivo de configuração, e só por último muda o código (subindo a versão e reinstalando). Cada mudança fica registrada em `CHANGES.md`.

## 6. Onde ficam os dados

Tudo local, em `~/.claude/mods-data/`: batimentos de sessão e handoffs do Cache Keeper, a flag e a configuração da gravação, o plano de cada goal, as listas de arquivos do Collision Guard e a configuração do Next Steps. **Os mods não fazem chamadas de rede próprias** (sem `fetch`, sem `child_process`). Os únicos pedidos ao modelo são os pings do `/keepwarm` (só enquanto ligado) e a consulta de sugestões do Next Steps (só enquanto ligado).

## 7. Estrutura

```
.claude-plugin/marketplace.json   marketplace "5-mods" com os 5 plugins
cache-keeper/                     hooks/register.mjs + pricing.mjs + skills/session-handoff
recording-mode/                   hooks/register.mjs + privacy.mjs
goal-meter/                       hooks/register.mjs + plan.mjs
collision-guard/                  hooks/register.mjs + coach.mjs
next-steps/                       hooks/register.mjs + tests/parse.test.ts
INSTALL-FOR-CLAUDE.md             passo a passo que o Claude segue para instalar
CUSTOMIZE.md                      como o Claude altera um mod depois
```

Verificado em 05/10/2026 com Claude Code 2.1.289: `claude plugin validate --strict` passa nos cinco mods e `claude plugin test next-steps` passa (2/2).

## Licença

MIT — ver [LICENSE](LICENSE).
