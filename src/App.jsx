import { useEffect, useRef, useState } from 'react'
import Results from './components/Results'
import StatsPanel from './components/StatsPanel'
import { useTypingTest } from './hooks/useTypingTest'
import { load, remove, save } from './lib/storage'

const MODES = [['time', 'Timed'], ['words', 'Words'], ['passage', 'Passage'], ['custom', 'Custom']]
const LIMITS = { time: [30, 60, 90, 120], words: [25, 50, 100] }
const SIZES = ['text-lg sm:text-xl', 'text-xl sm:text-2xl', 'text-2xl sm:text-3xl']
const AR_SIZES = ['text-xl sm:text-2xl', 'text-2xl sm:text-3xl', 'text-3xl sm:text-4xl']
const DEFAULT_SETTINGS = { lang: 'en', mode: 'time', limits: { time: 60, words: 50 }, size: 1, focus: false, custom: '' }

export default function App() {
  const [settings, setSettings] = useState(() => {
    const s = { ...DEFAULT_SETTINGS, ...load('tm-settings', {}) }
    const oldLang = localStorage.getItem('tm-lang') // from the first version
    if (oldLang && !localStorage.getItem('tm-settings')) s.lang = oldLang
    return s
  })
  const { lang, mode, limits, size, focus, custom } = settings
  const limit = limits[mode] || 0
  const isAr = lang === 'ar'
  const patch = (p) => setSettings((s) => ({ ...s, ...p }))
  useEffect(() => { save('tm-settings', settings) }, [settings])

  const [history, setHistory] = useState(() => load('tm-history', []))
  const [result, setResult] = useState(null)
  const [isNewBest, setNewBest] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(custom)
  const inputRef = useRef(null)
  const focusInput = () => setTimeout(() => inputRef.current?.focus(), 0)

  const onFinish = (res) => {
    setResult(res)
    const prev = load('tm-best-' + res.lang, null)
    const best = res.mode !== 'custom' && res.total >= 10 && (!prev || res.wpm > prev.wpm)
    if (best) save('tm-best-' + res.lang, { lang: res.lang, wpm: res.wpm, acc: res.acc, when: res.when })
    setNewBest(best && Boolean(prev))
    if (res.total >= 5 && res.seconds >= 3) {
      const next = [res, ...load('tm-history', [])].slice(0, 50)
      save('tm-history', next)
      setHistory(next)
    }
  }

  const test = useTypingTest({ lang, mode, limit, custom, onFinish })
  const { reset } = test

  const restart = () => { setResult(null); setNewBest(false); reset(); focusInput() }
  // Changing any setting resets the test; clear the old result with it.
  useEffect(() => { setResult(null); setNewBest(false); focusInput() }, [lang, mode, limit, custom])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab' && !editing) { e.preventDefault(); restart() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stop = (fn) => (e) => { e.stopPropagation(); fn() }
  const best = load('tm-best-' + lang, null)
  const word = test.words[test.wordIdx]
  const prefixOk = word ? word.startsWith(test.current) : true

  // Show a window of words so long and endless texts stay readable.
  const BLOCK = 12
  const start = Math.max(0, Math.floor(test.wordIdx / BLOCK) * BLOCK - BLOCK)
  const visible = test.words.slice(start, start + BLOCK * 4)
  const third =
    mode === 'time'
      ? ['Time', `${Math.ceil(test.remainingMs / 1000)}s`]
      : ['Words', `${test.graded.length}/${test.words.length}`]

  const pill = (active) => `rounded-full px-3 py-1 font-medium transition ${active ? 'bg-amber text-night' : 'text-muted hover:text-ink'}`
  const small = (active) => `rounded-full px-3 py-1 font-mono transition ${active ? 'bg-panel2 text-amber' : 'text-muted hover:text-ink'}`

  const saveCustom = () => {
    const clean = draft.trim().replace(/\s+/g, ' ')
    if (clean.split(' ').length < 3) return
    patch({ custom: clean, mode: 'custom' })
    setEditing(false)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6" onClick={() => !editing && inputRef.current?.focus()}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Typing <span className="text-amber">Masry</span></h1>
          <p className="text-xs text-muted">Arabic & English typing speed test</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line bg-panel p-1 text-sm" role="group" aria-label="Language">
            {[['en', 'English'], ['ar', 'العربية']].map(([l, label]) => (
              <button key={l} aria-pressed={lang === l} onClick={stop(() => patch({ lang: l }))} className={`${pill(lang === l)} px-4`}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="flex rounded-full border border-line bg-panel p-1" role="group" aria-label="Mode">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              aria-pressed={mode === id}
              onClick={stop(() => { if (id === 'custom' && !custom) { setDraft(''); setEditing(true) } else patch({ mode: id }) })}
              className={pill(mode === id)}
            >{label}</button>
          ))}
        </div>
        {LIMITS[mode] && (
          <div className="flex rounded-full border border-line bg-panel p-1" role="group" aria-label={mode === 'time' ? 'Seconds' : 'Word count'}>
            {LIMITS[mode].map((n) => (
              <button key={n} aria-pressed={limit === n} onClick={stop(() => patch({ limits: { ...limits, [mode]: n } }))} className={small(limit === n)}>{mode === 'time' ? `${n}s` : n}</button>
            ))}
          </div>
        )}
        {mode === 'custom' && <button onClick={stop(() => { setDraft(custom); setEditing(true) })} className="rounded-full border border-line px-3 py-1.5 text-amber hover:border-amber">Edit text</button>}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-panel p-1" role="group" aria-label="Text size">
          <button aria-label="Smaller text" disabled={size === 0} onClick={stop(() => patch({ size: size - 1 }))} className="rounded-full px-3 py-1 text-muted hover:text-ink disabled:opacity-30">A-</button>
          <button aria-label="Larger text" disabled={size === 2} onClick={stop(() => patch({ size: size + 1 }))} className="rounded-full px-3 py-1 text-muted hover:text-ink disabled:opacity-30">A+</button>
          <button aria-pressed={focus} onClick={stop(() => patch({ focus: !focus }))} title="Hide the numbers while you type" className={small(focus)}>Focus</button>
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-3 gap-3 transition-opacity ${focus && test.started && !test.done ? 'opacity-0' : ''}`} aria-hidden={focus && test.started && !test.done}>
        {[['WPM', test.wpm], ['Accuracy', `${test.acc}%`], third].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-line bg-panel px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
            <p className="font-en mt-1 text-2xl font-semibold text-ink">{val}</p>
          </div>
        ))}
      </div>

      <main className="anim-rise relative mt-4 flex-1 rounded-3xl border border-line bg-panel p-6 sm:p-10">
        <input
          ref={inputRef}
          value={test.current}
          onChange={(e) => test.onInput(e.target.value)}
          className="absolute h-0 w-0 opacity-0"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          dir={isAr ? 'rtl' : 'ltr'}
          disabled={test.done}
          aria-label="Typing input. Type the words shown."
        />

        {!test.done ? (
          <p dir={isAr ? 'rtl' : 'ltr'} className={`${isAr ? `font-ar ${AR_SIZES[size]}` : `font-en ${SIZES[size]}`}`} style={{ lineHeight: isAr ? 2.1 : 2 }}>
            {visible.map((w, k) => {
              const i = start + k
              let cls = 'text-muted'
              if (i < test.wordIdx) cls = test.graded[i]?.ok ? 'text-correct' : 'text-wrong underline decoration-wrong/60 underline-offset-4'
              if (i === test.wordIdx) cls = prefixOk ? 'text-ink' : 'text-wrong'
              const cur = i === test.wordIdx
              return (
                <span key={i} className={cur ? 'relative rounded-md bg-panel2 px-1' : 'px-1'}>
                  {cur && <span className={`caret absolute top-1 bottom-1 w-[3px] rounded bg-amber ${isAr ? '-right-0.5' : '-left-0.5'}`} />}
                  <span className={cls}>{w}</span>{' '}
                </span>
              )
            })}
          </p>
        ) : result ? (
          <Results
            result={result}
            graded={test.graded}
            samples={test.samples}
            best={best}
            isNewBest={isNewBest}
            isAr={isAr}
            onRestart={restart}
            onNewText={mode === 'time' || mode === 'custom' ? null : restart}
          />
        ) : null}

        {!test.done && !test.started && (
          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'time' ? 'Start typing. The clock begins on your first character.' : 'Start typing. Press Space after each word.'}
          </p>
        )}
      </main>

      <StatsPanel history={history} onClear={() => { remove('tm-history'); remove('tm-best-en'); remove('tm-best-ar'); setHistory([]) }} />

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={(e) => { e.stopPropagation(); setEditing(false) }}>
          <div role="dialog" aria-modal="true" aria-label="Custom text" className="w-full max-w-lg rounded-2xl border border-line bg-panel p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Practise your own text</h2>
            <p className="mt-1 text-xs text-muted">Paste a paragraph in {isAr ? 'Arabic' : 'English'} or any language. At least 3 words.</p>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              dir="auto"
              rows={6}
              className="mt-3 w-full rounded-xl border border-line bg-night p-3 text-sm"
              aria-label="Custom text"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink">Cancel</button>
              <button onClick={saveCustom} disabled={draft.trim().split(/\s+/).filter(Boolean).length < 3} className="rounded-full bg-amber px-5 py-2 text-sm font-semibold text-night disabled:opacity-40">Use this text</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-muted">
        Arabic grading works per word, not per letter, so letter joining (الشكل المتصل) is never broken.
        Best {isAr ? 'Arabic' : 'English'} score: {best ? best.wpm + ' wpm' : '-'}
      </footer>
    </div>
  )
}
