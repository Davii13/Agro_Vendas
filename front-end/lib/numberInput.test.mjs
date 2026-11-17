import test from 'node:test'
import assert from 'node:assert/strict'
import { teclaBloqueada, removerSinalNegativo, aceitaNegativo } from './numberInput.ts'

test('as teclas de sinal e de expoente são bloqueadas; números e vírgula, não', () => {
  for (const k of ['-', '+', 'e', 'E']) assert.equal(teclaBloqueada(k), true, k)
  for (const k of ['0', '5', '9', '.', ',', 'Backspace', 'Tab', 'ArrowLeft']) assert.equal(teclaBloqueada(k), false, k)
})

test('o sinal de menos é removido do que foi colado, em qualquer forma', () => {
  assert.equal(removerSinalNegativo('-5'), '5')
  assert.equal(removerSinalNegativo('-12.50'), '12.50')
  assert.equal(removerSinalNegativo('--3'), '3')
  assert.equal(removerSinalNegativo('−5'), '5') // minus sign U+2212
  assert.equal(removerSinalNegativo('–7'), '7') // en dash
  assert.equal(removerSinalNegativo('42'), '42')
  assert.equal(removerSinalNegativo(''), '')
})

test('só um campo que peça mínimo negativo aceita negativo', () => {
  assert.equal(aceitaNegativo(undefined), false)
  assert.equal(aceitaNegativo(''), false)
  assert.equal(aceitaNegativo('0'), false)
  assert.equal(aceitaNegativo(1), false)
  assert.equal(aceitaNegativo('-10'), true)
  assert.equal(aceitaNegativo(-1), true)
})
