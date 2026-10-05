# Install instructions (for Claude)

The user handed you this folder (or the zip it came in) and asked you to install the mods. Follow these steps in order. Run the commands yourself; only stop to ask the user when a step says so.

This bundle holds Claude Code mods by INEMA.CLUB, as one plugin marketplace named `5-mods`:

| Mod | Plugin id |
|---|---|
| Cache Keeper | `cache-keeper@5-mods` |
| Recording Mode | `recording-mode@5-mods` |
| Goal Meter | `goal-meter@5-mods` |
| Collision Guard | `collision-guard@5-mods` |
| Next Steps | `next-steps@5-mods` |

If the user asked for only some of them, install only those.

## 1. Check Claude Code

1. Run `claude --version`. It needs to be **2.1.287 or later**. If it's older, run `claude update`, then check again.
2. If `claude` isn't found, the user probably runs only the Desktop app. The install needs the `claude` command line tool. Ask the user before installing it, then use the official installer:
   - macOS or Linux: `curl -fsSL https://claude.ai/install.sh | bash`
   - Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`
3. Make an empty temporary folder, run `claude plugin test` inside it, and read the message. The exit code is 1 either way, so ignore it.
   - "no hooks module to load" means mods can load on this account. Carry on.
   - "served off" means Anthropic hasn't turned mods on for this account yet. Install anyway (nothing needs reinstalling later), and tell the user the mods will start working once mods are on for their account.

## 2. Put the bundle in its permanent home

The marketplace points at a folder on disk, and later changes happen there, so the folder has to stay put. Don't install from Downloads or a temp folder.

1. The home is `~/.claude/5-mods` (on Windows, `C:\Users\<user>\.claude\5-mods`). Use the real home folder, even if `CLAUDE_CONFIG_DIR` is set.
2. If you were given the zip, extract it to a temporary folder with `unzip`, or on Windows with PowerShell `Expand-Archive`. (Git Bash's `tar` can't read zip files.) It contains one folder, `5-mods`.
3. Copy the **contents** of that folder into `~/.claude/5-mods`, so `~/.claude/5-mods/.claude-plugin/marketplace.json` exists. Keep the dot folders (`.claude-plugin`).
4. If `~/.claude/5-mods` already exists, this is a reinstall or an update. Read its `CHANGES.md` first if there is one: it lists the user's own changes. Keep a copy of the old folder (rename it to `5-mods.old-<date>`), copy the new files in, and tell the user which of their changes need to be redone.

## 3. Add the marketplace

Run, with the absolute path:

```bash
claude plugin marketplace add "<home>/.claude/5-mods"
```

If it says `5-mods` already exists, run `claude plugin marketplace list`.

- If it already points at `~/.claude/5-mods`, run `claude plugin marketplace update 5-mods` and carry on.
- If it points somewhere else (for example a GitHub repo), run `claude plugin marketplace remove 5-mods`, then add the folder as above. Local is better here: it's the copy the user can change.

## 4. Install the mods

Run these one at a time, not in parallel. Each one writes the same settings file.

```bash
claude plugin install cache-keeper@5-mods
```

```bash
claude plugin install recording-mode@5-mods
```

```bash
claude plugin install goal-meter@5-mods
```

```bash
claude plugin install collision-guard@5-mods
```

```bash
claude plugin install next-steps@5-mods
```

If one says it's already installed, run `claude plugin update <id>` instead.

## 5. Check the install

Run `claude plugin list`. All five should show as installed and enabled, version 1.0.0 (or higher). If one is missing or shows an error, run `claude plugin validate --strict "<home>/.claude/5-mods/<mod>"` and fix what it reports before you go on.

## 6. Leave a note for future chats

Add this to the end of the user's global `CLAUDE.md`: `$CLAUDE_CONFIG_DIR/CLAUDE.md` if that variable is set, otherwise `~/.claude/CLAUDE.md`. Make the file if it doesn't exist, and don't touch anything already in it. Put the real absolute path of the home folder, with forward slashes, in place of `<home>`.

```markdown
## Claude Code mods (5-mods)
Cache Keeper, Recording Mode, Goal Meter, Collision Guard, and Next Steps are installed from <home>/.claude/5-mods (marketplace `5-mods`). When I ask to change how one of them works, read <home>/.claude/5-mods/CUSTOMIZE.md first.
```

This is how a chat next week knows where the mods live when the user says "make recording mode hide my clients folder".

## 7. Tell the user

Start with two or three lines: what you installed, the note you added to their `CLAUDE.md`, and, if step 1 said "served off", that the mods will start working once Anthropic turns mods on for their account. Then give them the message below as written, leaving out any mod you didn't install. The temporary extracted copy of the zip can go; `~/.claude/5-mods` stays.

---

All five mods are installed. **Open a new chat to turn them on.** In the Desktop app, start a new chat. In the terminal, quit and run `claude` again (`/clear` doesn't count). Mods load when a chat starts, so this chat won't show them.

To check they're running, type `/guard` in the new chat. If it answers, you're set.

**Cache Keeper:** the line above your prompt shows whether this chat's cache is warm or cold, how big the chat is, and what a cold restart would cost. `/keepwarm` keeps a big chat's cache warm for up to 4 hours, `/board` shows all your chats in one pane, and `/handoff` moves a long chat into a fresh one. It also asks before you send a message into a big chat whose cache has gone cold.

**Recording Mode:** type `/rec` before you hit record. Every open chat hides API keys, personal details, and money on screen and keeps private files closed. Type `/rec off` when you're done, or `/rec strict` to hide every large number too.

**Goal Meter:** start a task with `/goal <what done looks like>` and you get a progress bar with an ETA, built from my own task plan. `/goals` shows every chat's goal.

**Next Steps:** when a turn ends, up to three suggested next prompts show above the prompt. Press one (`j`, `k`, `l`) to send it, `d` to dismiss. `/next off` turns it off.

**Collision Guard:** if another open chat changed a file in the last 30 minutes and I'm about to edit it here, it asks first: Proceed, Move to a worktree, or Cancel. `/guard` shows what it sees.

**Want one to work differently? Just tell me in plain English.** For example:

- "Never hide my name or my company's name in recording mode."
- "Make recording mode keep my clients folder closed too."
- "Have the collision guard look back 60 minutes instead of 30."
- "Make the cache keeper warn me before a cold send at 100k tokens instead of 150k."
- "Add a new line to the goal bar that shows ..."

I'll either make the change myself or tell you the one command to type. If I change a mod's code, you'll open a new chat afterwards to load it.

---
