// Next Steps: when a turn ends, it asks the model (over this chat's own cached
// transcript) for up to three things you could do next, and draws them as
// buttons above the prompt. Press one to send it as your next prompt, or
// dismiss the row and carry on with your own.
//
// Why: in a long build it's easy to lose the thread. A short list of "fix this
// first", "run the tests", "commit" keeps the work moving.
// Cost: one small fork per turn. The fork reuses the chat's prompt cache, so it
// is mostly cache reads; /next off stops it. Nothing is added to the main
// conversation's prompt, and it stays quiet while recording mode is on.

const DIR = '/.claude/mods-data/next-steps'
const MAX = 3
const HOTKEYS = ['j', 'k', 'l']

const PROMPT = [
  'next-steps mod. Look at where this conversation stands right now and suggest up to 3 short prompts the user could send next to keep making progress (fix a bug first, test, commit, the obvious next feature, a check worth doing).',
  'Rules: write them in the same language the user writes in; each one is a prompt in the user\'s voice, at most 80 characters; no numbering, no quotes, no explanations.',
  'Reply with one suggestion per line and nothing else. If there is no sensible next step, reply with only: NONE',
].join('\n')

const settings = { on: true }
const S = { items: [], loading: false, turnId: '', working: false }
let home = ''
let commandName = 'next'

function file() {
  return `${home}${DIR}/settings.json`
}

async function loadSettings($) {
  try {
    if (await $.fs.exists(file())) Object.assign(settings, JSON.parse(await $.fs.read(file())))
  } catch {
    // unreadable: keep the defaults
  }
}

async function saveSettings($) {
  try {
    await $.fs.write(file(), JSON.stringify(settings))
  } catch {
    // not saved: the setting still holds in this chat
  }
}

async function recording($) {
  try {
    const p = home + '/.claude/mods-data/recording.json'
    if (!(await $.fs.exists(p))) return false
    return !!JSON.parse(await $.fs.read(p)).on
  } catch {
    return false
  }
}

export function parseSuggestions(text) {
  const raw = String(text || '').trim()
  if (!raw || /^NONE\b/i.test(raw)) return []
  const out = []
  for (let line of raw.split(/\r?\n/)) {
    line = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^["'“]|["'”]$/g, '').trim()
    if (!line || /^NONE$/i.test(line)) continue
    if (line.length > 120) line = line.slice(0, 117) + '...'
    if (!out.includes(line)) out.push(line)
    if (out.length === MAX) break
  }
  return out
}

function clear($) {
  if (!S.items.length && !S.loading) return
  S.items = []
  S.loading = false
  $.ui.invalidate('ui.render')
}

async function suggest($, turnId) {
  if (!settings.on || (await recording($))) return
  S.loading = true
  $.ui.invalidate('ui.render')
  let reply = null
  try {
    reply = await $.model.fork({ prompt: PROMPT })
  } catch {
    reply = null
  }
  // A new prompt went in while the fork ran: these suggestions are stale
  if (S.working || S.turnId !== turnId) {
    S.loading = false
    $.ui.invalidate('ui.render')
    return
  }
  S.loading = false
  S.items = reply && reply.isAnswered ? parseSuggestions(reply.text) : []
  $.ui.invalidate('ui.render')
}

async function send($, text) {
  if (S.working) {
    $.ui.toast('Claude is still working. Pick a next step once this turn ends.', { timeoutMs: 6000 })
    return
  }
  clear($)
  try {
    await $.prompt.submit({ text, asUser: true })
  } catch {
    $.ui.toast('Could not send the suggestion. Type it yourself: ' + text, { timeoutMs: 10000 })
  }
}

export const register = (on) => {
  on('session.start', async ($, e, next) => {
    home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || ''
    await loadSettings($)
    const spec = { name: 'next', description: 'Next Steps: suggestions above the prompt after each turn (/next on|off)', argumentHint: '[on|off]', immediate: true }
    try {
      await $.command.register(spec)
    } catch {
      try {
        await $.command.register({ ...spec, name: 'next-steps' })
        commandName = 'next-steps'
      } catch {
        commandName = ''
      }
    }
    return next(e)
  })

  // Any new prompt (typed or a pressed suggestion) clears the row
  on('prompt.submit', async ($, e, next) => {
    if (!e.turnId) {
      S.working = true
      clear($)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId) return r
    S.working = false
    S.turnId = e.turnId || String(Date.now())
    const turnId = S.turnId
    // Off the hook: the fork must not hold the turn's end
    if (settings.on) $.clock.after(50, () => suggest($, turnId).catch(() => {}))
    return r
  })

  on('command.run', { command: ['next', 'next-steps'] }, async ($, e) => {
    const arg = String(e.args || '').trim().toLowerCase()
    if (arg === 'off') {
      settings.on = false
      clear($)
      await saveSettings($)
      return { text: 'Next Steps off. Type /' + (commandName || 'next') + ' on to turn it back on.' }
    }
    if (arg === 'on') {
      settings.on = true
      await saveSettings($)
      return { text: 'Next Steps on: suggestions show above the prompt when a turn ends.' }
    }
    return { text: `Next Steps is ${settings.on ? 'on' : 'off'}. ${S.items.length ? 'Current suggestions:\n- ' + S.items.join('\n- ') : 'No suggestions right now.'}` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props && e.props.hasSurvey) return below
    if (!settings.on || S.working || (!S.items.length && !S.loading)) return below
    const { Box, Text, Button } = $.ui.resolve(e)
    let mine
    if (S.loading) {
      mine = Text({ dimColor: true, children: ['→ next steps…'] })
    } else {
      const buttons = S.items.map((text, i) => Button({ key: 'ns' + i, label: text, hotkey: HOTKEYS[i], plain: true, onPress: () => send($, text) }))
      buttons.push(Button({ key: 'ns-dismiss', label: 'dismiss', hotkey: 'd', plain: true, dimColor: true, onPress: () => clear($) }))
      mine = Box({ flexDirection: 'column', children: [Text({ color: 'cyan', children: ['→ next steps'] }), ...buttons] })
    }
    return Box({ flexDirection: 'column', children: below ? [mine, below] : [mine] })
  })
}
