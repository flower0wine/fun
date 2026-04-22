import {
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import './App.css'
import { MorphTransition } from './components/MorphTransition'

type Page = {
  slug: string
  eyebrow: string
  title: string
  description: string
  note: string
  accent: string
  surface: string
}

const PAGES: Page[] = [
  {
    slug: 'index',
    eyebrow: 'Entry frame',
    title: 'Editorial landing with a rising SVG veil.',
    description:
      'This demo recreates the Codrops-style SVG morph transition in React. Navigation does not hard-refresh; the overlay covers, the view swaps, then the path releases upward.',
    note: 'Use the top navigation to switch pages and observe the curve fill the viewport before the next scene appears.',
    accent: 'var(--theme-ink)',
    surface: 'var(--theme-paper)',
  },
  {
    slug: 'works',
    eyebrow: 'Works',
    title: 'The transition is the layout system, not a one-off animation.',
    description:
      'The overlay path is kept outside page content, so the same motion layer can front multiple views without coupling animation code to individual sections.',
    note: 'The path shape is generated from the same command structure and interpolated over time, which avoids relying on MorphSVGPlugin.',
    accent: 'var(--theme-rust)',
    surface: 'var(--theme-sand)',
  },
  {
    slug: 'archive',
    eyebrow: 'Archive',
    title: 'Cover first, switch route state second, reveal last.',
    description:
      'That sequencing is the reusable part. The SVG effect is only the visible surface over a stable transition protocol: lock input, animate cover, swap content, animate reveal, reset.',
    note: 'The implementation can later be wired into React Router or another client-side router with the same state machine.',
    accent: 'var(--theme-forest)',
    surface: 'var(--theme-fog)',
  },
]

type Phase = 'idle' | 'leaving' | 'entering'

const LEAVE_DURATION_MS = 900
const ENTER_DURATION_MS = 760

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}

function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const activePage = PAGES[activeIndex]
  const destinationPage = pendingIndex === null ? null : PAGES[pendingIndex]

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches)

    syncPreference()
    mediaQuery.addEventListener('change', syncPreference)

    return () => mediaQuery.removeEventListener('change', syncPreference)
  }, [])

  const completePhase = useEffectEvent(() => {
    if (phase === 'leaving' && pendingIndex !== null) {
      setActiveIndex(pendingIndex)
      setPhase('entering')
      setProgress(0)
      return
    }

    setPhase('idle')
    setProgress(0)
    setPendingIndex(null)
  })

  useEffect(() => {
    if (phase === 'idle') {
      return
    }

    const duration = phase === 'leaving' ? LEAVE_DURATION_MS : ENTER_DURATION_MS
    let animationFrame = 0
    let start = 0

    const tick = (timestamp: number) => {
      if (!start) {
        start = timestamp
      }

      const elapsed = timestamp - start
      const raw = Math.min(elapsed / duration, 1)
      setProgress(easeOutCubic(raw))

      if (raw < 1) {
        animationFrame = window.requestAnimationFrame(tick)
        return
      }

      completePhase()
    }

    animationFrame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(animationFrame)
  }, [phase])

  const handleNavigate = (nextIndex: number) => {
    if (nextIndex === activeIndex || phase !== 'idle') {
      return
    }

    if (prefersReducedMotion) {
      setActiveIndex(nextIndex)
      setPendingIndex(null)
      setPhase('idle')
      setProgress(0)
      return
    }

    setPendingIndex(nextIndex)
    setPhase('leaving')
    setProgress(0)
  }

  const pageClassName = useMemo(() => {
    if (phase === 'leaving') {
      return 'app-shell page-is-leaving'
    }

    if (phase === 'entering') {
      return 'app-shell page-is-entering'
    }

    return 'app-shell'
  }, [phase])

  return (
    <div className={pageClassName} data-phase={phase}>
      <MorphTransition
        phase={phase}
        progress={progress}
        label={destinationPage?.slug ?? activePage.slug}
      />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" />
          <div>
            <p className="brand-title">SVG Morph Transition Lab</p>
            <p className="brand-subtitle">React + TypeScript implementation</p>
          </div>
        </div>

        <nav className="nav" aria-label="Page switcher">
          {PAGES.map((page, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={page.slug}
                className={isActive ? 'nav-link is-active' : 'nav-link'}
                onClick={() => handleNavigate(index)}
                type="button"
              >
                {page.slug}
              </button>
            )
          })}
        </nav>
      </header>

      <main
        className="scene"
        style={
          {
            '--page-accent': activePage.accent,
            '--page-surface': activePage.surface,
          } as CSSProperties
        }
      >
        <section className="hero-panel">
          <p className="eyebrow">{activePage.eyebrow}</p>
          <h1>{activePage.title}</h1>
          <p className="lede">{activePage.description}</p>
          <p className="note">{activePage.note}</p>
        </section>

        <section className="detail-grid" aria-label="Transition notes">
          <article className="detail-card">
            <span className="detail-index">01</span>
            <h2>SVG structure</h2>
            <p>
              One fullscreen SVG sits above the page. The path starts flat at the
              bottom, curves upward, expands to cover the viewport, then reverses
              from the top edge.
            </p>
          </article>

          <article className="detail-card">
            <span className="detail-index">02</span>
            <h2>State protocol</h2>
            <p>
              The view changes only after the overlay has covered the scene. That
              keeps the transition deterministic and prevents content popping
              through mid-animation.
            </p>
          </article>

          <article className="detail-card">
            <span className="detail-index">03</span>
            <h2>Extensibility</h2>
            <p>
              The morph logic is isolated from the page content. Replacing the
              local state navigation with a router is a straightforward next step.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
