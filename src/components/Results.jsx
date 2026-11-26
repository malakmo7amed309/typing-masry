import Chart from './Chart'

const Box = ({ label, value }) => (
  <div className="rounded-2xl border border-line bg-panel2 px-3 py-3">
    <p className="text-[11px] uppercase tracking-widest text-muted">{label}</p>
    <p className="font-en mt-1 text-xl text-ink">{value}</p>
  </div>
)

export default function Results({ result, graded, samples, best, isNewBest, isAr, onRestart, onNewText }) {
  const missed = graded.filter((g) => !g.ok).slice(0, 12)
  return (
    <div className="anim-rise py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{result.mode === 'time' ? 'Time is up' : 'Finished'}</p>
      <p className="font-en mt-3 text-6xl font-semibold text-amber sm:text-7xl">{result.wpm}</p>
      <p className="mt-1 text-sm text-muted">words per minute</p>
      {isNewBest && <p role="status" className="mt-2 inline-block rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber">New personal best</p>}

      <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Box label="Accuracy" value={`${result.acc}%`} />
        <Box label="Words" value={`${result.words}/${result.total}`} />
        <Box label="Consistency" value={`${result.consistency}%`} />
        <Box label={`Best ${isAr ? 'AR' : 'EN'}`} value={best ? best.wpm : '-'} />
      </div>

      <div className="mx-auto mt-8 max-w-xl text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Speed over time</p>
        <Chart points={samples} label="Words per minute for each second of the test" />
      </div>

      {missed.length > 0 && (
        <div className="mx-auto mt-6 max-w-xl text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Words to practise</p>
          <ul className="flex flex-wrap gap-2">
            {missed.map((g, i) => (
              <li key={i} className="rounded-lg border border-line bg-panel2 px-3 py-1 text-sm" dir={isAr ? 'rtl' : 'ltr'}>
                <span className={isAr ? 'font-ar' : 'font-en'}>{g.word}</span>
                <span className="mx-2 text-muted">→</span>
                <span className={`${isAr ? 'font-ar' : 'font-en'} text-wrong`}>{g.typed}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={(e) => { e.stopPropagation(); onRestart() }} className="rounded-full bg-amber px-8 py-3 font-semibold text-night transition hover:brightness-110">Go again</button>
        {onNewText && <button onClick={(e) => { e.stopPropagation(); onNewText() }} className="rounded-full border border-line px-6 py-3 font-semibold text-ink transition hover:border-amber">New text</button>}
      </div>
      <p className="mt-4 text-xs text-muted">Tip: press Tab to restart at any time.</p>
    </div>
  )
}
