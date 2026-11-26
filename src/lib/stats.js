/** Words per minute. The usual rule: five characters count as one word. */
export const wpm = (chars, ms) => (ms <= 0 ? 0 : Math.round(chars / 5 / (ms / 60000)))

export const accuracy = (graded) => {
  if (graded.length === 0) return 100
  return Math.round((graded.filter((g) => g.ok).length / graded.length) * 100)
}

/** Characters from correctly typed words, counting the space after each. */
export const correctChars = (graded) => graded.reduce((n, g) => n + (g.ok ? g.word.length + 1 : 0), 0)

/** 0-100. How steady the speed was: 100 means every second was the same. */
export function consistency(samples) {
  const v = samples.filter((n) => n > 0)
  if (v.length < 3) return 100
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length)
  return Math.max(0, Math.round(100 - (sd / mean) * 100))
}

/** Aggregates for the stats panel. */
export function summarize(history) {
  if (history.length === 0) return { tests: 0, avgWpm: 0, avgAcc: 0, bestWpm: 0 }
  const sum = (k) => history.reduce((a, h) => a + h[k], 0)
  return {
    tests: history.length,
    avgWpm: Math.round(sum('wpm') / history.length),
    avgAcc: Math.round(sum('acc') / history.length),
    bestWpm: Math.max(...history.map((h) => h.wpm)),
  }
}

/** Shuffled word list of a given length, without repeating the same word twice in a row. */
export function randomWords(pool, count, rnd = Math.random) {
  const out = []
  while (out.length < count) {
    const w = pool[Math.floor(rnd() * pool.length)]
    if (w !== out[out.length - 1]) out.push(w)
  }
  return out
}
