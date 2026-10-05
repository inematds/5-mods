# 5-mods — five mods for Claude Code

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

[![5-mods](guia/assets/banner-en.jpg)](https://inematds.github.io/5-mods/guia/en/)

## 📖 User guide

Full guide (landing page + step by step): **https://inematds.github.io/5-mods/guia/en/**

Five ready-made **mods** for Claude Code: save money on big chats, hide sensitive data while you record, track the progress of a `/goal`, stop two chats from editing the same file and get next-step suggestions at the end of each reply.

| Mod | Commands | What it is for |
|---|---|---|
| **Cache Keeper** | `/cache`, `/keepwarm`, `/board`, `/handoff` | Shows whether the chat cache is warm or cold and how much a cold restart would cost; keeps big chats warm; asks before an expensive send; board with all chats; moves the chat into a new one |
| **Recording Mode** | `/rec`, `/rec strict`, `/rec off`, `/rec config` | Hides keys, personal data and business numbers on screen and closes private files while you record |
| **Goal Meter** | `/goals` | Progress bar for `/goal`, built from Claude's own task plan, with a finish-time estimate |
| **Collision Guard** | `/guard` | Asks before editing a file that another open chat changed in the last 30 minutes |
| **Next Steps** | `/next`, `/next on`, `/next off` | At the end of each reply, up to 3 next-prompt suggestions as buttons above the prompt |

---

## 1. What mods are

The idea is simple: **if you wanted Claude Code to do something different, ask it, and it changes.** A mod can:

- **draw on screen** — a line above the prompt, a footer label, a side panel;
- **create slash commands** (`/rec`, `/guard`, `/next`…);
- **step in before a tool runs** (e.g. before an `Edit`) and ask something in the interface, instead of just blocking like a regular hook would.

Technically, **mods live inside plugins**: a JavaScript file (`hooks/register.mjs`) that Claude Code loads when the chat starts. You install it with `/plugin` (or `claude plugin install`) in the terminal or in the *Code* tab of the Desktop app. And you can create a new one in plain language: “I want a mod that does X”.

Other mod ideas going around: a context meter (*token weather*), a preview of what would be deleted before deleting it (*blast radius*), a step-by-step replay of edits (*replay theater*). A good way to find yours: ask Claude to read your session logs and suggest the 5 mods that would help your way of working the most.

### Mod × hook × skill: what is the difference?

| | What it is | Where it shows up | Example |
|---|---|---|---|
| **Skill** | Markdown instructions that Claude reads when the task calls for it | Only in what Claude writes | “how to do a session handoff” |
| **Classic hook** | A shell command that runs on an event (before a tool, when a prompt is sent) | Blocks, allows or injects text; draws nothing | “deny `rm -rf`” |
| **Mod** | A JavaScript module that runs **inside** Claude Code | Draws on the interface, creates commands, asks with buttons, keeps state | “show a `/goal` progress bar” |

A mod does everything a hook does, but with an interface and memory. That is why Collision Guard can **ask** “edit anyway?” with buttons, instead of just blocking.

## 2. Concepts in 2 minutes

Before looking at each mod, it helps to understand four ideas they use:

- **Context:** everything in the chat (your messages, replies, files read, command outputs). With every new message, the model rereads that whole context. A long chat can have 100k, 400k tokens or more.
- **Prompt cache:** so you aren't charged the full price on every reread, the context is kept in a cache. Reading from the cache costs ~10% of the normal price. But the cache **expires** if the chat sits idle: 5 minutes or 1 hour, depending on the account. When you come back, the first message has to **rewrite** everything into the cache, at up to 2× the price. That is the “cold restart” Cache Keeper avoids.
- **`/goal`:** a Claude Code command for long, autonomous jobs: you describe what “done” looks like and Claude works until it gets there, checking at the end of each round whether the goal was met. Goal Meter turns that into a progress bar.
- **Git worktree:** a second working folder of the same repository, on another branch. Two chats in different worktrees don't step on each other's files. It is the way out that Collision Guard offers.

## 3. The mods in detail

### Cache Keeper

Every message rereads the whole chat. Read from the cache, that costs 1/10 of the normal input price. When the cache expires (5 min or 1 h idle, depending on the account), the next message rewrites everything at up to 2× the price. In a 400k-token chat that can cost a few dollars; keeping it warm costs cents.

- **Line above the prompt:** `● cache warm 42m │ ctx 412k │ rewrite ≈ $3.30 │ session $5.12`. It turns yellow 5 min before expiring, with a `keep warm` button. It also shows the plan's 5 h and weekly limits (yellow at 80%, red at 95%).
- **`/keepwarm [hours|off]`:** keeps the cache warm (default 4 h, max 24) with a small ping before it expires. If the ping writes instead of reading, it turns itself off and tells you.
- **Cold-send protection:** chat above 150k tokens with an expired cache → asks *Send anyway*, *Compact first* or *Cancel*.
- **`/board`:** all local chats in one panel — waiting for you, working, and the ones that cool first.
- **`/handoff`:** runs the built-in `/session-handoff` skill, saves the summary, clears the chat and sends the summary as the first message of the new chat (two clicks instead of copy, clear and paste).
- **`/cache`:** status and settings — `ttl 5|60|auto`, `guard on|off`, `big 150k`, `alerts on|off`.

Dollar values come from the API price table. **On a subscription they don't become a charge**: they show up as usage of your limits.

### Recording Mode

Run `/rec` before you hit *record*. It applies to all open chats within 3 s; `/rec off` turns it off in all of them.

- **Masks on screen:** API keys and tokens, every `.env` value in the project folder (and parent folders), e-mails, names, phone numbers, addresses, card/account/ID numbers, money amounts and numbers near business words. `/rec strict` also masks every large number and percentage.
- **Hides entire results** from e-mail, chat, task, calendar, file, CRM and finance tools. Claude receives the real result; only the screen changes.
- **Closes files:** `.env`, credentials, SSH/cloud keys, Claude's memory folder and financial documents.
- **Warns Claude** (hidden note in each prompt) not to quote internal names, numbers and plans.
- **Red ● REC** above the prompt and in the footer.

Tune it with `/rec config`, which creates `~/.claude/mods-data/recording-mode/config.json`:

```json
{
  "keepNames": ["Your Name", "Your Brand"],
  "names": ["A Colleague", "A Client"],
  "privatePaths": ["clients/", "finance/", "private-notes.md"],
  "businessTools": [],
  "closedTools": []
}
```

> **Note for non-English users:** the business words and masking patterns are English-centric (*revenue*, *margin*, *payroll*, `$`). Local currency, national ID numbers and non-English business words may slip through. Use `/rec strict`, fill in `names`/`privatePaths` and **review the footage before publishing**. The mod changes what is drawn, not what is stored, and chat titles in the Desktop app's sidebar are not masked.

### Goal Meter

Type `/goal <what "done" looks like>` as usual. Claude writes the plan with the mod's task tool (each task S, M or L) and marks the start and end of each one.

- **Line above the prompt:** `5 of 8 tasks · 69%`, bar, elapsed time, estimate (“about 17m left”), how many times the plan grew, running agents, latest tasks and upcoming ones. Key `g` opens the full list.
- **Footer:** `◎ goal 69% · ~17m`.
- **Calculation:** S/M/L are worth 1/2/3. The estimate uses the goal's own pace and appears after 2 completed tasks. If new work appears, the plan grows and the bar may step back.
- **`/goals`:** lists this chat + goals from other chats in the last 12 h. Settings: `/goals hide|show`, `/goals strict on` (no file edits before the plan exists), `/goals clear`.

It makes no extra model calls.

### Collision Guard

With several chats on the same project, two can touch the same file without knowing. Before `Edit`/`Write`/`NotebookEdit`, the mod checks whether another open chat changed that file in the last 30 min. If so, it asks:

- **Proceed** — edit anyway;
- **Move to a worktree** — moves this chat's work into a *git worktree* (when the file is in git);
- **Cancel** — doesn't touch it and asks how to proceed.

`/guard` shows what it sees, `/guard off` turns it off, `/guard window 60` changes the window to 60 min. Nothing is added to Claude's prompt.

### Next Steps

When a reply ends, the mod asks the model — reusing the chat's own history, which is already cached — what the most useful next steps are (fix a bug first, run the tests, commit, the next obvious feature). Up to 3 buttons appear above the prompt:

```
→ next steps
  [j] Run the tests for the login module
  [k] Commit the changes
  [l] Update the README with the new command
  [d] dismiss
```

- Pressing a button sends that text as your next prompt; `d` dismisses.
- Typing your own prompt also clears the suggestions.
- Suggestions come out in the language you write in.
- **It stays silent while Recording Mode is on** (so nothing sensitive is shown on screen).
- `/next off` turns it off (applies to following chats), `/next on` turns it back on, `/next` shows the state.

**Cost:** one small query per reply. Since it reuses the chat cache, it is almost all cache reads; on a subscription it counts toward your usage limit. If you don't want that usage, `/next off`.

## 4. A day of use, in practice

An example of how the five work together:

1. **9 am — you open two chats on the same project.** In one, you ask “fix the login bug”; in the other, “add the *most popular* badge to the Pro plan on the pricing page”.
2. **9:10 — both want to touch `pricing.html`.** The first one already edited the file. When the second one is about to edit, **Collision Guard** asks: *Proceed*, *Move to a worktree* or *Cancel*. You choose and neither chat overwrites the other without knowing.
3. **9:30 — you kick off a long task:** `/goal migrate the tests to Vitest and get them all passing`. **Goal Meter** shows `3 of 7 tasks · 41%` and the finish-time estimate. With `/goals` you see the goals of all chats.
4. **10 am — end of each reply.** **Next Steps** suggests “Run the full suite”, “Commit the migration”, “Update the CHANGELOG”. One key and the prompt is sent.
5. **11 am — you go to lunch** with a 300k-token chat open. Before the cache cools, the **Cache Keeper** line turns yellow. You press `keep warm` (or `/keepwarm 2`) and when you return the chat is still cheap. If you prefer a clean start, `/handoff` summarizes everything and opens a new chat with the summary.
6. **3 pm — you're going to record a tutorial.** You type `/rec`. Keys, e-mails, amounts and `.env` files disappear from the screen in every chat; a red **● REC** reminds you that you're recording. Next Steps goes quiet. At the end, `/rec off`.

## 5. Requirements

- **Claude Code 2.1.287 or newer** (`claude --version`). Works in the terminal and in the *Code* tab of Desktop (the buttons above the prompt appear in the terminal).
- **Mods enabled on your account** (the rollout is gradual). In an empty folder, run `claude plugin test`: “no hooks module to load” = it can load; “served off” = not yet. You can install beforehand; it starts working when access arrives.

## 6. Install

### Option A — ask Claude

Open Claude Code and paste this, with the real path of this folder:

```text
Install the five Claude Code mods from this folder: <path>/5-mods. Follow the INSTALL-FOR-CLAUDE.md that is in it.
```

It checks the version, copies to `~/.claude/5-mods`, registers the marketplace, installs all five and leaves a note in your global `CLAUDE.md`. Then **open a new chat** and type `/guard` — if it answers, it's working.

### Option B — manual commands

```bash
cp -a . ~/.claude/5-mods
claude plugin marketplace add "$HOME/.claude/5-mods"
```

Then, one at a time (not in parallel — they all write to the same settings file):

```bash
claude plugin install cache-keeper@5-mods
claude plugin install recording-mode@5-mods
claude plugin install goal-meter@5-mods
claude plugin install collision-guard@5-mods
claude plugin install next-steps@5-mods
```

Open a new chat: the mod loads when the chat starts (`/reload-plugins` doesn't reload).

- **Update:** `claude plugin marketplace update 5-mods` → `claude plugin update <mod>@5-mods` → new chat.
- **Remove:** `claude plugin uninstall <mod>@5-mods`.

## 7. Customize

Ask in plain language, in any chat:

- “In recording mode, never hide my name or my company name.”
- “Make recording mode also close the `clients/` folder.”
- “The collision guard should look back 60 minutes, not 30.”
- “The cache keeper should warn before a cold send from 100k tokens.”
- “The next steps mod should suggest only 2 steps and always include running the tests.”

Claude follows [CUSTOMIZE.md](CUSTOMIZE.md): it first tries a command from the mod itself, then the config file, and only last changes the code (bumping the version and reinstalling). Every change is recorded in `CHANGES.md`.

## 8. Where the data lives

All local, in `~/.claude/mods-data/`: Cache Keeper's session heartbeats and handoffs, the recording flag and settings, each goal's plan, Collision Guard's file lists and Next Steps' settings. **The mods make no network calls of their own** (no `fetch`, no `child_process`). The only requests to the model are the `/keepwarm` pings (only while on) and Next Steps' suggestion query (only while on).

## 9. How to build your own mod

You don't need to know JavaScript. Open Claude Code (2.1.287+) and describe what you want to see and when:

```text
I want a mod that, when I type /pomodoro, shows a 25-minute counter above the prompt
and alerts me with a toast when it ends.
```

Claude writes the three files of a mod and loads it right away (it asks whether you want to enable the session's *hot reload*):

```
my-mod/
  .claude-plugin/plugin.json   name, version and description
  hooks/hooks.json             { "modules": ["./register.mjs"] }
  hooks/register.mjs           the code: export const register = (on) => { ... }
```

Then ask: “how do I turn it on and off?”, “how do I install it on another computer?”. The five mods in this repository are good models to copy: `next-steps/hooks/register.mjs` is the smallest (~180 lines) and shows a command, an end-of-reply event, a model query and buttons above the prompt.

To check a mod before using it:

```bash
claude plugin validate --strict ./my-mod   # reads the code the way Claude Code will read it
claude plugin test ./my-mod                # runs the mod's *.test.ts tests
```

## 10. Structure

```
.claude-plugin/marketplace.json   "5-mods" marketplace with the 5 plugins
cache-keeper/                     hooks/register.mjs + pricing.mjs + skills/session-handoff
recording-mode/                   hooks/register.mjs + privacy.mjs
goal-meter/                       hooks/register.mjs + plan.mjs
collision-guard/                  hooks/register.mjs + coach.mjs
next-steps/                       hooks/register.mjs + tests/parse.test.ts
INSTALL-FOR-CLAUDE.md             step by step that Claude follows to install
CUSTOMIZE.md                      how Claude changes a mod later
```

Verified on 05/10/2026 with Claude Code 2.1.289: `claude plugin validate --strict` passes on all five mods and `claude plugin test next-steps` passes (2/2).

## 11. Frequently asked questions

**I installed it and nothing shows up.** Mods load when the chat **starts**. Close and reopen Claude Code (in the terminal, quit and run `claude` again; `/clear` doesn't count). Then type `/guard`: if it answers, the mods are running.

**`claude plugin test` says “served off”.** Your account hasn't received the mods yet. The installation stays ready and starts working on its own when access arrives.

**A command doesn't exist (`/next`, `/cache`…).** Another plugin already used the name. The mod registers an alternative name: `/next-steps`, `/ck-cache`, `/ck-keepwarm`, `/ck-board`, `/ck-handoff`, `/recording`, `/goal-meter` or `/collision-guard`.

**Are the dollar values charged?** Not on a subscription: there they become usage of your 5 h and weekly limits. The values are an estimate based on API pricing, useful for comparing what costs more.

**Can I use just some of them?** Yes. Install only the ones you want (`claude plugin install <mod>@5-mods`) or turn each one off with its own command (`/guard off`, `/next off`…).

**Does it work in the Desktop app?** Yes, in the *Code* tab. The line above the prompt with buttons is drawn in the terminal; on Desktop, Cache Keeper, Recording Mode and Goal Meter show a footer label, and everyone's commands work normally.

**Does Recording Mode guarantee nothing leaks?** No. It masks by patterns (e-mails, keys, amounts, English business words) and closes sensitive files, but free text can slip through. Review the footage before publishing.

**I changed a mod's code and nothing changed.** Claude Code runs a **copy** made at install time. Bump the version in `plugin.json`, run `claude plugin marketplace update 5-mods` and `claude plugin update <mod>@5-mods`, and open a new chat. [CUSTOMIZE.md](CUSTOMIZE.md) has the step by step.

## License

MIT — see [LICENSE](LICENSE).
