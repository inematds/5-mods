import { test, expect } from 'claude-code/testing'
import { parseSuggestions } from '../hooks/register.mjs'

test('parses up to three suggestions, stripping bullets and quotes', () => {
  const out = parseSuggestions('- Rode os testes\n2) "Faça o commit"\n• Corrija o bug do login\n- Quarta sugestão')
  expect(out).toEqual(['Rode os testes', 'Faça o commit', 'Corrija o bug do login'])
})

test('NONE or empty gives no suggestions', () => {
  expect(parseSuggestions('NONE')).toEqual([])
  expect(parseSuggestions('')).toEqual([])
})
