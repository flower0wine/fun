import { useEffect, useState } from 'react'
import './App.css'

const signalSeries = [128, 136, 142, 151, 147, 159]
const responseSeries = [3.8, 3.2, 2.9, 2.6, 2.4, 2.1]

const featureCards = [
  {
    eyebrow: 'Micro cadence',
    title: 'Staggered sections instead of one heavy reveal.',
    body:
      'The page enters in semantic layers so each block feels intentional instead of sliding in as a single slab.',
  },
  {
    eyebrow: 'Surface math',
    title: 'Nested cards use concentric radii.',
    body:
      'The outer shell and inner panels are offset by padding so the curves stay visually aligned rather than collapsing together.',
  },
  {
    eyebrow: 'Tactile feedback',
    title: 'Interactive controls press to 0.96.',
    body:
      'Buttons scale just enough to feel responsive without turning into a cartoon tap effect.',
  },
]

const sessions = [
  {
    time: '08:40',
    title: 'Material audit',
    detail: 'Shadow stacks replaced hard strokes on the control rail.',
  },
  {
    time: '11:10',
    title: 'Contrast sweep',
    detail: 'Text rhythm tightened and paragraph wrapping cleaned up.',
  },
  {
    time: '14:25',
    title: 'Interaction pass',
    detail: 'Icons cross-fade with blur and scale instead of popping.',
  },
]

function App() {
  const [frame, setFrame] = useState(0)
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % signalSeries.length)
    }, 1800)

    return () => window.clearInterval(timer)
  }, [])

  const signals = signalSeries[frame]
  const responseTime = responseSeries[frame]
  const readiness = 72 + frame * 4

  return (
    <main className="page-shell">
      <section className="hero stagger-sequence">
        <div className="hero-copy stagger-item">
          <p className="eyebrow">make-interfaces-feel-better / skill lab</p>
          <h1>Signal room for testing polish details that users actually feel.</h1>
          <p className="hero-text">
            This React + TypeScript page is intentionally built to exercise the
            skill: typographic balance, concentric radii, shadow depth, tactile
            controls, stable numerals, and subtle motion sequencing.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button">
              Open review lane
              <span className="button-arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>
            <button
              className={`mode-toggle ${focusMode ? 'is-active' : ''}`}
              type="button"
              onClick={() => setFocusMode((current) => !current)}
              aria-pressed={focusMode}
            >
              <span className="mode-toggle-copy">
                {focusMode ? 'Focus mode enabled' : 'Switch to focus mode'}
              </span>
              <span className="mode-toggle-icon" aria-hidden="true">
                <span className="icon-stack">
                  <span className="icon-layer icon-rest">
                    <GridIcon />
                  </span>
                  <span className="icon-layer icon-active">
                    <SparkIcon />
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <article className="hero-panel stagger-item">
          <div className="hero-panel-inner">
            <div className="panel-topline">
              <p>Live calibration</p>
              <span className="status-pill">
                <span className="status-dot" />
                smooth
              </span>
            </div>

            <div className="metrics-grid">
              <MetricCard
                label="Signals cleared"
                value={`${signals}%`}
                note="Tabular numerals stop jitter across updates."
              />
              <MetricCard
                label="Response drift"
                value={`${responseTime.toFixed(1)} ms`}
                note="Transitions stay specific to transform, opacity and shadow."
              />
              <MetricCard
                label="Readiness"
                value={`${readiness}%`}
                note="Numbers hold alignment while the content updates."
              />
            </div>

            <div className="wave-card">
              <div className="wave-header">
                <div>
                  <p className="wave-label">Refinement pulse</p>
                  <h2>Quiet motion, stronger hierarchy.</h2>
                </div>
                <span className="wave-tag">phase {frame + 1}</span>
              </div>
              <div className="wave-bars" aria-hidden="true">
                {signalSeries.map((value, index) => (
                  <span
                    key={value}
                    className={`wave-bar ${index === frame ? 'is-current' : ''}`}
                    style={{ height: `${42 + value / 2}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="feature-strip stagger-sequence">
        {featureCards.map((card) => (
          <article className="feature-card stagger-item" key={card.title}>
            <div className="feature-card-inner">
              <p className="eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="journal stagger-sequence">
        <div className="journal-heading stagger-item">
          <p className="eyebrow">Applied details</p>
          <h2>Where the skill is being exercised on this page.</h2>
        </div>

        <div className="journal-layout">
          <article className="journal-card stagger-item">
            <div className="journal-card-inner">
              <div className="section-label">
                <span className="section-dot" />
                review stream
              </div>
              <ul className="session-list">
                {sessions.map((session) => (
                  <li className="session-item" key={session.time}>
                    <span className="session-time">{session.time}</span>
                    <div>
                      <h3>{session.title}</h3>
                      <p>{session.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="journal-card stagger-item">
            <div className="journal-card-inner note-card">
              <div className="section-label">
                <span className="section-dot" />
                polish checklist
              </div>
              <ul className="check-list">
                <li>Headings use balanced wrapping; supporting copy uses pretty wrapping.</li>
                <li>Cards rely on layered shadows, not hard borders, for depth.</li>
                <li>Buttons have at least a 44px hit area and a 0.96 press state.</li>
                <li>Mode icon animation keeps both states mounted and cross-fades them.</li>
              </ul>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

type MetricCardProps = {
  label: string
  value: string
  note: string
}

function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card-inner">
        <p>{label}</p>
        <strong className="metric-value">{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M18.5 4.5v3m1.5-1.5h-3M5.5 16.5v4m2-2h-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export default App
