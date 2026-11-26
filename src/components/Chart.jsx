/** Small inline SVG line chart. `points` is an array of numbers. */
export default function Chart({ points, label, height = 120 }) {
  if (points.length < 2) return <p className="text-sm text-muted">Not enough data for a chart yet.</p>
  const w = 600
  const max = Math.max(10, ...points) * 1.1
  const x = (i) => 10 + (i / (points.length - 1)) * (w - 20)
  const y = (v) => height - 10 - (v / max) * (height - 20)
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${height - 10} L${x(0).toFixed(1)} ${height - 10} Z`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={label} className="w-full">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="10" x2={w - 10} y1={height - 10 - f * (height - 20)} y2={height - 10 - f * (height - 20)} stroke="var(--color-line)" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="var(--color-amber)" opacity="0.12" />
      <path d={line} fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) => (points.length <= 30 ? <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--color-amber)"><title>{v} wpm</title></circle> : null))}
    </svg>
  )
}
