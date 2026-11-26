import test from 'node:test'
import assert from 'node:assert/strict'
import { accuracy, consistency, correctChars, randomWords, summarize, wpm } from '../src/lib/stats.js'

test('wpm uses five characters per word', () => {
  assert.equal(wpm(300, 60000), 60)
  assert.equal(wpm(150, 30000), 60)
  assert.equal(wpm(100, 0), 0)
})

test('accuracy is a percentage of correct words, 100 when empty', () => {
  assert.equal(accuracy([]), 100)
  assert.equal(accuracy([{ ok: true }, { ok: false }, { ok: true }, { ok: true }]), 75)
})

test('correctChars counts only correct words plus their space', () => {
  const graded = [{ word: 'cat', ok: true }, { word: 'dog', ok: false }, { word: 'bird', ok: true }]
  assert.equal(correctChars(graded), 4 + 5)
})

test('consistency is 100 for a steady speed and lower for a shaky one', () => {
  assert.equal(consistency([50, 50, 50, 50]), 100)
  assert.ok(consistency([10, 90, 20, 80]) < 60)
  assert.equal(consistency([40]), 100)
})

test('summarize averages and finds the best', () => {
  assert.deepEqual(summarize([]), { tests: 0, avgWpm: 0, avgAcc: 0, bestWpm: 0 })
  const s = summarize([{ wpm: 40, acc: 90 }, { wpm: 60, acc: 100 }])
  assert.deepEqual(s, { tests: 2, avgWpm: 50, avgAcc: 95, bestWpm: 60 })
})

test('randomWords returns the requested length with no immediate repeats', () => {
  const out = randomWords(['a', 'b', 'c'], 200)
  assert.equal(out.length, 200)
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1])
})
