import { useState } from 'react'
import Chart from './Chart'
import { summarize } from '../lib/stats'

const MODE_LABEL = { time: 'Timed', words: 'Words', passage: 'Passage', custom: 'Custom' }
const lim = (h) => (h.mode === 'time' ? `${h.limit}s` : h.mode === 'words' ? `${h.limit}w` : '')

export default function StatsPanel({ history, onClear }) {
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(false)
  const rows = history.filter((h) => filter === 'all' || h.lang === filter)
  const s = summarize(rows)
  return (
    <section className="mt-6" aria-labelledby="stats-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="stats-h" className="text-sm font-semibold uppercase tracking-widest text-muted">Your progress</h2>
        <div className="flex rounded-full border border-line bg-panel p-1 text-xs">
          {[['all', 'All'], ['en', 'English'], ['ar', 'العربية']].map(([id, label]) => (
            <button key={id} aria-pressed={filter === id} onClick={(e) => { e.stopPropagation(); setFilter(id) }} className={`rounded-full px-3 py-1 font-medium ${filter === id ? 'bg-panel2 text-amber' : 'text-muted hover:text-ink'}`}>{label}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No tests yet. Your results and progress show up here.</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Tests', s.tests], ['Avg WPM', s.avgWpm], ['Best WPM', s.bestWpm], ['Avg accuracy', `${s.avgAcc}%`]].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line bg-panel px-4 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{l}</p>
                <p className="font-en mt-1 text-xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-panel p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{rows.length === 1 ? "Your first test" : `WPM across your last ${Math.min(rows.length, 30)} tests`}</p>
            <Chart points={rows.slice(0, 30).map((h) => h.wpm).reverse()} label="Words per minute across recent tests, oldest to newest" />
          </div>
          <ul className="mt-3 space-y-2">
            {rows.slice(0, 8).map((h) => (
              <li key={h.when} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel px-4 py-2 text-sm">
                <span className={h.lang === 'ar' ? 'font-ar' : 'font-en'}>{h.lang === 'ar' ? 'العربية' : 'English'}</span>
                <span className="hidden text-xs text-muted sm:inline">{MODE_LABEL[h.mode] || 'Timed'} {lim(h)}</span>
                <span className="font-en"><span className="font-semibold text-amber">{h.wpm}</span> wpm</span>
                <span className="font-en text-muted">{h.acc}%</span>
                <span className="text-xs text-muted">{new Date(h.when).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {history.length > 0 && (
        <div className="mt-3 text-right">
          {confirm ? (
            <span className="text-sm">
              Delete all results?{' '}
              <button onClick={(e) => { e.stopPropagation(); onClear(); setConfirm(false) }} className="font-semibold text-wrong">Yes, delete</button>{' '}
              <button onClick={(e) => { e.stopPropagation(); setConfirm(false) }} className="text-muted">Cancel</button>
            </span>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setConfirm(true) }} className="text-xs text-muted underline hover:text-ink">Clear history</button>
          )}
        </div>
      )}
    </section>
  )
}
