import { useCallback, useEffect, useRef, useState } from 'react'
import { PASSAGES } from '../data/passages'
import { WORDS } from '../data/words'
import { accuracy, consistency, correctChars, randomWords, wpm } from '../lib/stats'

const pick = (list) => list[Math.floor(Math.random() * list.length)]

function buildWords(lang, mode, limit, custom, lastPassage) {
  if (mode === 'custom') return custom.trim().split(/\s+/).filter(Boolean)
  if (mode === 'passage') {
    const list = PASSAGES[lang]
    let i = Math.floor(Math.random() * list.length)
    if (list.length > 1 && i === lastPassage.current) i = (i + 1) % list.length
    lastPassage.current = i
    return list[i].split(' ')
  }
  if (mode === 'words') return randomWords(WORDS[lang].split(' '), limit)
  return randomWords(WORDS[lang].split(' '), 120) // timed: more is added as you go
}

/**
 * The typing test engine. Grades per word, because Arabic letters join and
 * colouring single letters would break the shaping.
 * mode: 'time' | 'words' | 'passage' | 'custom'. limit: seconds or word count.
 */
export function useTypingTest({ lang, mode, limit, custom, onFinish }) {
  const lastPassage = useRef(-1)
  const [words, setWords] = useState(() => buildWords(lang, mode, limit, custom, lastPassage))
  const [wordIdx, setWordIdx] = useState(0)
  const [current, setCurrent] = useState('')
  const [graded, setGraded] = useState([])
  const [startAt, setStartAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [samples, setSamples] = useState([])
  const [done, setDone] = useState(false)
  const timer = useRef(null)
  const gradedRef = useRef([])
  const finished = useRef(false)
  const finishCb = useRef(onFinish)
  finishCb.current = onFinish

  const stop = () => clearInterval(timer.current)

  const reset = useCallback(() => {
    stop()
    finished.current = false
    gradedRef.current = []
    setWords(buildWords(lang, mode, limit, custom, lastPassage))
    setWordIdx(0)
    setCurrent('')
    setGraded([])
    setStartAt(null)
    setElapsed(0)
    setSamples([])
    setDone(false)
  }, [lang, mode, limit, custom])

  // Any setting change starts a fresh test.
  useEffect(() => { reset() }, [reset])
  useEffect(() => stop, [])

  const finish = useCallback((ms, list, perSecond) => {
    if (finished.current) return
    finished.current = true
    stop()
    setElapsed(ms)
    setDone(true)
    const chars = correctChars(list)
    const result = {
      lang, mode, limit,
      wpm: wpm(chars, ms),
      acc: accuracy(list),
      words: list.filter((g) => g.ok).length,
      total: list.length,
      seconds: Math.round(ms / 100) / 10,
      consistency: consistency(perSecond),
      when: Date.now(),
    }
    finishCb.current?.(result, list, perSecond)
  }, [lang, mode, limit])

  const begin = () => {
    if (startAt) return
    const t0 = Date.now()
    setStartAt(t0)
    let lastSecond = 0
    timer.current = setInterval(() => {
      const e = Date.now() - t0
      setElapsed(e)
      const sec = Math.floor(e / 1000)
      if (sec > lastSecond) {
        lastSecond = sec
        setSamples((s) => [...s, wpm(correctChars(gradedRef.current), e)])
      }
      if (mode === 'time' && e >= limit * 1000) {
        setSamples((s) => {
          finish(limit * 1000, gradedRef.current, s)
          return s
        })
      }
    }, 100)
  }

  const onInput = (value) => {
    if (done) return
    begin()
    if (!value.endsWith(' ')) {
      setCurrent(value)
      return
    }
    const typed = value.trim()
    if (!typed) {
      setCurrent('')
      return
    }
    const entry = { word: words[wordIdx], typed, ok: typed === words[wordIdx] }
    const list = [...gradedRef.current, entry]
    gradedRef.current = list
    setGraded(list)
    setCurrent('')
    const next = wordIdx + 1
    setWordIdx(next)
    if (mode === 'time' && next > words.length - 30) {
      setWords((w) => [...w, ...randomWords(WORDS[lang].split(' '), 60)])
    }
    if (mode !== 'time' && next >= words.length) {
      const ms = startAt ? Date.now() - startAt : 1
      finish(ms, list, [...samples, wpm(correctChars(list), ms)])
    }
  }

  const liveMs = startAt ? elapsed : 0
  return {
    words, wordIdx, current, graded, samples, done, started: Boolean(startAt),
    elapsed: liveMs,
    remainingMs: mode === 'time' ? Math.max(0, limit * 1000 - liveMs) : null,
    wpm: wpm(correctChars(graded), liveMs),
    acc: accuracy(graded),
    onInput, reset,
  }
}
