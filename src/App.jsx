import { useEffect, useMemo, useRef, useState } from 'react'

const PASSAGES = {
  ar: [
    'القاهرة مدينة لا تنام، تمشي في شوارعها في أي ساعة وتجد الناس والقهوة والضحك. من خان الخليلي إلى كورنيش النيل، كل زقاق له حكاية وكل قهوة لها زبائنها الذين يعرفون مقاعدهم بالاسم.',
    'الأكل المصري له طعم مختلف، من الفول والطعمية في الصباح إلى الكشري في نص اليوم. أبسط الأكلات عندنا تجمع العيلة كلها حوالين سفرة واحدة، والأكل بيد الناس اللي بتحبك له بركة.',
    'النيل يجري في مصر منذ آلاف السنين، شاهد على الفراعنة والملوك والثورات. المراكب الشراعية لسه بتمشي في مياهه بهدوء، كأن الزمن واقف عند ضفتيه، والغروب فوقه منظر لا يتكرر في بلد آخر.',
    'الميكروباص عندنا مش مجرد مواصلات، ده مدرسة في الصبر والسرعة في نفس الوقت. السائق يعرف كل شارع وكل مختصر، والركاب يعدلوا الأجرة من إيد لإيد في ثواني من غير كلمة واحدة.',
  ],
  en: [
    'The best typists do not look at their hands. They read a few words ahead, keep a steady rhythm, and let their fingers find the keys on their own. Speed comes from calm repetition, not from rushing.',
    'Cairo is a city that rewards the curious. Behind every noisy street there is a quiet alley, behind every old door a courtyard, and behind every cup of tea a conversation that lasts three hours.',
    'Learning to code is mostly learning to be patient with yourself. The error message is not an insult, it is a hint. Read it slowly, change one thing, run it again, and the bug will show itself.',
    'A good portfolio does not list everything you have ever built. It shows three or four projects you care about, explains the choices you made, and proves you can finish what you start.',
  ],
}

const fmtWpm = (correctChars, ms) => (ms <= 0 ? 0 : Math.round(correctChars / 5 / (ms / 60000)))

function loadBest(lang) {
  try { return JSON.parse(localStorage.getItem('tm-best-' + lang)) || null } catch { return null }
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tm-history')) || [] } catch { return [] }
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('tm-lang') || 'en')
  const [duration, setDuration] = useState(60)
  const [passageIdx, setPassageIdx] = useState(() => Math.floor(Math.random() * PASSAGES.en.length))
  const words = useMemo(() => PASSAGES[lang][passageIdx % PASSAGES[lang].length].split(' '), [lang, passageIdx])

  const [wordIdx, setWordIdx] = useState(0)
  const [current, setCurrent] = useState('')
  const [grades, setGrades] = useState([]) // true/false per finished word
  const [startAt, setStartAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const inputRef = useRef(null)
  const tickRef = useRef(null)

  const isAr = lang === 'ar'
  const best = loadBest(lang)

  const reset = (newPassage) => {
    clearInterval(tickRef.current)
    setWordIdx(0)
    setCurrent('')
    setGrades([])
    setStartAt(null)
    setElapsed(0)
    setDone(false)
    if (newPassage) setPassageIdx((i) => i + 1)
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0)
  }

  useEffect(() => {
    localStorage.setItem('tm-lang', lang)
    setPassageIdx(Math.floor(Math.random() * PASSAGES[lang].length))
    reset(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, duration])

  useEffect(() => () => clearInterval(tickRef.current), [])

  const startTimerIfNeeded = () => {
    if (startAt) return
    const t0 = Date.now()
    setStartAt(t0)
    tickRef.current = setInterval(() => {
      const e = Date.now() - t0
      setElapsed(e)
      if (e >= duration * 1000) {
        clearInterval(tickRef.current)
        setElapsed(duration * 1000)
        setDone(true)
        setGrades((g) => {
          const ms = duration * 1000
          const correctChars = g.reduce((n, ok, i) => n + (ok ? words[i].length + 1 : 0), 0)
          const wpm = fmtWpm(correctChars, ms)
          const acc = g.length ? Math.round((g.filter(Boolean).length / g.length) * 100) : 0
          const entry = { lang, wpm, acc, when: Date.now() }
          const prevBest = loadBest(lang)
          if (!prevBest || wpm > prevBest.wpm) localStorage.setItem('tm-best-' + lang, JSON.stringify(entry))
          const h = [entry, ...loadHistory()].slice(0, 8)
          localStorage.setItem('tm-history', JSON.stringify(h))
          setHistory(h)
          return g
        })
      }
    }, 200)
  }

  const onChange = (e) => {
    if (done) return
    let v = e.target.value
    startTimerIfNeeded()
    if (v.endsWith(' ')) {
      const typed = v.trim()
      if (typed.length === 0) { setCurrent(''); return }
      const ok = typed === words[wordIdx]
      const newGrades = [...grades, ok]
      setGrades(newGrades)
      setCurrent('')
      const next = wordIdx + 1
      if (next >= words.length) {
        setWordIdx(next)
        const ms = startAt ? Date.now() - startAt : 1
        clearInterval(tickRef.current)
        setElapsed(ms)
        setDone(true)
        const correctChars = newGrades.reduce((n, o, i) => n + (o ? words[i].length + 1 : 0), 0)
        const wpm = fmtWpm(correctChars, ms)
        const acc = newGrades.length ? Math.round((newGrades.filter(Boolean).length / newGrades.length) * 100) : 0
        const entry = { lang, wpm, acc, when: Date.now() }
        const prevBest = loadBest(lang)
        if (!prevBest || wpm > prevBest.wpm) localStorage.setItem('tm-best-' + lang, JSON.stringify(entry))
        const h = [entry, ...loadHistory()].slice(0, 8)
        localStorage.setItem('tm-history', JSON.stringify(h))
        setHistory(h)
        return
      }
      setWordIdx(next)
    } else {
      setCurrent(v)
    }
  }

  const liveMs = startAt ? elapsed : 0
  const correctChars = grades.reduce((n, ok, i) => n + (ok ? words[i].length + 1 : 0), 0)
  const liveWpm = fmtWpm(correctChars, liveMs)
  const liveAcc = grades.length ? Math.round((grades.filter(Boolean).length / grades.length) * 100) : 100
  const remaining = Math.max(0, duration * 1000 - liveMs)

  const currentPrefixMatch = words[wordIdx] ? words[wordIdx].startsWith(current) : true

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6" onClick={() => inputRef.current && inputRef.current.focus()}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Typing <span className="text-amber">Masry</span>
          </h1>
          <p className="text-xs text-muted">Arabic & English typing speed test</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line bg-panel p-1 text-sm">
            {[['en', 'English'], ['ar', 'العربية']].map(([l, label]) => (
              <button
                key={l}
                onClick={(e) => { e.stopPropagation(); setLang(l) }}
                className={`rounded-full px-4 py-1 font-medium transition ${lang === l ? 'bg-amber text-night' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-line bg-panel p-1 text-sm">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={(e) => { e.stopPropagation(); setDuration(d) }}
                className={`rounded-full px-3 py-1 font-mono transition ${duration === d ? 'bg-panel2 text-amber' : 'text-muted hover:text-ink'}`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          ['WPM', liveWpm],
          ['Accuracy', liveAcc + '%'],
          ['Time', Math.ceil(remaining / 1000) + 's'],
        ].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-line bg-panel px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
            <p className="font-en mt-1 text-2xl font-semibold text-ink">{val}</p>
          </div>
        ))}
      </div>

      <main className="anim-rise relative mt-6 flex-1 rounded-3xl border border-line bg-panel p-6 sm:p-10">
        <input
          ref={inputRef}
          value={current}
          onChange={onChange}
          className="absolute h-0 w-0 opacity-0"
          autoFocus
          dir={isAr ? 'rtl' : 'ltr'}
          disabled={done}
          aria-label="typing input"
        />

        {!done ? (
          <p
            dir={isAr ? 'rtl' : 'ltr'}
            className={`${isAr ? 'font-ar text-2xl sm:text-3xl' : 'font-en text-xl sm:text-2xl'} leading-loose`}
            style={{ lineHeight: isAr ? 2.1 : 2 }}
          >
            {words.map((w, i) => {
              let cls = 'text-muted'
              if (i < wordIdx) cls = grades[i] ? 'text-correct' : 'text-wrong underline decoration-wrong/60 underline-offset-4'
              if (i === wordIdx) cls = currentPrefixMatch ? 'text-ink' : 'text-wrong'
              const isCurrent = i === wordIdx
              return (
                <span key={i} className={isCurrent ? 'relative rounded-md bg-panel2 px-1' : 'px-1'}>
                  {isCurrent && (
                    <span className={`caret absolute top-1 bottom-1 w-[3px] rounded bg-amber ${isAr ? '-right-0.5' : '-left-0.5'}`} />
                  )}
                  <span className={cls}>{w}</span>
                  {' '}
                </span>
              )
            })}
          </p>
        ) : (
          <Results
            wpm={liveWpm}
            acc={liveAcc}
            correctWords={grades.filter(Boolean).length}
            totalWords={grades.length}
            best={loadBest(lang)}
            isAr={isAr}
            onRestart={() => reset(true)}
          />
        )}

        {!done && !startAt && (
          <p className="mt-6 text-center text-sm text-muted">Start typing - the clock begins on your first character.</p>
        )}
      </main>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Recent tests</h2>
          <button onClick={(e) => { e.stopPropagation(); reset(true) }} className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm font-medium text-amber transition hover:border-amber">
            New passage
          </button>
        </div>
        {history.length ? (
          <ul className="mt-3 space-y-2">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-2 text-sm">
                <span className={h.lang === 'ar' ? 'font-ar' : 'font-en'}>{h.lang === 'ar' ? 'العربية' : 'English'}</span>
                <span className="font-en"><span className="text-amber font-semibold">{h.wpm}</span> wpm</span>
                <span className="font-en text-muted">{h.acc}%</span>
                <span className="text-xs text-muted">{new Date(h.when).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No tests yet. Your last eight results land here.</p>
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-muted">
        Arabic grading works per word, not per letter - so letter joining (الشكل المتصل) is never broken.
        Best {lang === 'ar' ? 'Arabic' : 'English'} score: {best ? best.wpm + ' wpm' : '-'}
      </footer>
    </div>
  )
}

function Results({ wpm, acc, correctWords, totalWords, best, isAr, onRestart }) {
  return (
    <div className="anim-rise py-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Time is up</p>
      <p className="font-en mt-3 text-6xl font-semibold text-amber sm:text-7xl">{wpm}</p>
      <p className="mt-1 text-sm text-muted">words per minute</p>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-panel2 px-3 py-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Accuracy</p>
          <p className="font-en mt-1 text-xl text-ink">{acc}%</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel2 px-3 py-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Words</p>
          <p className="font-en mt-1 text-xl text-ink">{correctWords}/{totalWords}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel2 px-3 py-3">
          <p className="text-[11px] uppercase tracking-widest text-muted">Best {isAr ? 'AR' : 'EN'}</p>
          <p className="font-en mt-1 text-xl text-ink">{best ? best.wpm : '-'}</p>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRestart() }}
        className="mt-8 rounded-full bg-amber px-8 py-3 font-semibold text-night transition hover:brightness-110"
      >
        Go again
      </button>
    </div>
  )
}
