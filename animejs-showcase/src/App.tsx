import { useCallback, useEffect, useRef } from 'react'
import {
  animate,
  createDrawable,
  createTimeline,
  splitText,
  stagger,
} from 'animejs'
import './App.css'

const stats = [
  { label: 'Layers', value: 12, suffix: '' },
  { label: 'Loops', value: 6, suffix: '' },
  { label: 'Wow factor', value: 96, suffix: '%' },
]

const features = [
  'Split-text reveal with staggered timing',
  'Looping particle field and rotating rings',
  'SVG path draw and pulsing signal nodes',
]

function App() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const counterRefs = useRef<Array<HTMLSpanElement | null>>([])
  const cleanupRef = useRef<Array<() => void>>([])

  const resetExperience = () => {
    cleanupRef.current.forEach((cleanup) => cleanup())
    cleanupRef.current = []
  }

  const runShowcase = useCallback(() => {
    resetExperience()

    const root = rootRef.current
    const title = titleRef.current

    if (!root || !title) {
      return
    }

    counterRefs.current.forEach((counter, index) => {
      if (counter) {
        counter.textContent = `0${stats[index].suffix}`
      }
    })

    const split = splitText(title, { chars: true, accessible: true })
    cleanupRef.current.push(() => split.revert())

    const introTimeline = createTimeline({
      defaults: {
        duration: 900,
        ease: 'outExpo',
      },
    })

    introTimeline
      .add(split.chars, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        delay: stagger(26),
      })
      .add(
        root.querySelectorAll('.animate-copy'),
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          delay: stagger(120),
        },
        '-=620',
      )
      .add(
        root.querySelectorAll('.animate-stage'),
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          delay: stagger(150),
        },
        '-=700',
      )
      .add(
        root.querySelectorAll('.animate-card'),
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          delay: stagger(130),
        },
        '-=560',
      )

    cleanupRef.current.push(() => introTimeline.revert())

    const loops = [
      animate(root.querySelectorAll('.bar'), {
        scaleY: stagger([0.4, 1], { from: 'center', ease: 'inOut(3)' }),
        opacity: stagger([0.35, 1], { from: 'center' }),
        delay: stagger(70),
        duration: 1600,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      }),
      animate(root.querySelectorAll('.particle'), {
        y: stagger([-18, 18], { from: 'center' }),
        x: stagger([-12, 12], { from: 'last' }),
        scale: stagger([0.85, 1.35], { from: 'center' }),
        opacity: stagger([0.35, 0.95], { from: 'center' }),
        duration: 2400,
        delay: stagger(110),
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      }),
      animate(root.querySelectorAll('.ring'), {
        rotate: 360,
        duration: stagger([14000, 22000]),
        ease: 'linear',
        loop: true,
      }),
      animate(root.querySelectorAll('.pulse-node'), {
        scale: 1.35,
        opacity: 1,
        delay: stagger(240),
        duration: 900,
        ease: 'out(4)',
        alternate: true,
        loop: true,
      }),
      animate(root.querySelectorAll('.core-glow, .hero-grid'), {
        scale: 1.08,
        opacity: 1,
        duration: 2200,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      }),
    ]

    const drawable = createDrawable(root.querySelectorAll('.signal-path'))
    const drawAnimation = animate(drawable, {
      draw: '0 1',
      duration: 2600,
      ease: 'inOutSine',
      delay: stagger(220),
      alternate: true,
      loop: true,
    })

    loops.push(drawAnimation)
    loops.forEach((animation) => cleanupRef.current.push(() => animation.revert()))

    stats.forEach((item, index) => {
      const counter = { value: 0 }
      const animation = animate(counter, {
        value: item.value,
        duration: 1500,
        delay: 950 + index * 180,
        ease: 'outExpo',
        onUpdate: () => {
          const element = counterRefs.current[index]
          if (element) {
            element.textContent = `${Math.round(counter.value)}${item.suffix}`
          }
        },
      })

      cleanupRef.current.push(() => animation.revert())
    })
  }, [])

  useEffect(() => {
    runShowcase()
    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup())
      cleanupRef.current = []
    }
  }, [runShowcase])

  return (
    <div className="app-shell" ref={rootRef}>
      <div className="hero-grid" aria-hidden="true" />

      <header className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow animate-copy">React + TypeScript + animejs</p>
          <h1 ref={titleRef}>Build motion that feels impossible to ignore.</h1>
          <p className="lede animate-copy">
            This small lab layers split-text reveals, staggered bars, SVG line
            drawing, counters, and ambient loops into one polished landing page.
          </p>

          <div className="hero-actions animate-copy">
            <button className="replay-button" type="button" onClick={runShowcase}>
              Replay sequence
            </button>
            <span className="hint">Stagger. Timeline. Draw. Loop.</span>
          </div>

          <div className="metric-strip animate-copy">
            {stats.map((item, index) => (
              <article className="metric-card" key={item.label}>
                <span
                  className="metric-value"
                  ref={(element) => {
                    counterRefs.current[index] = element
                  }}
                >
                  0{item.suffix}
                </span>
                <span className="metric-label">{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="visual-column">
          <section className="stage-card animate-stage">
            <div className="orbital-scene">
              <div className="ring ring-one" />
              <div className="ring ring-two" />
              <div className="core-glow" />
              <div className="core-shell">
                <div className="core-dot" />
              </div>
              <div className="particle-cloud" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => (
                  <span className="particle" key={index} />
                ))}
              </div>
            </div>
          </section>

          <section className="bars-card animate-stage">
            <div className="bars-header">
              <p>Signal energy</p>
              <span>staggered scaleY loop</span>
            </div>
            <div className="bars-panel" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => (
                <span className="bar" key={index} />
              ))}
            </div>
          </section>
        </div>
      </header>

      <main className="demo-grid">
        <article className="demo-card animate-card">
          <div className="card-label">SVG draw</div>
          <h2>Animate paths like a live signal trace.</h2>
          <p>
            `animejs` can progressively reveal SVG strokes, which makes graphs,
            diagrams, scribbles, and icon outlines feel much more alive.
          </p>

          <svg
            className="signal-svg"
            viewBox="0 0 320 160"
            role="img"
            aria-label="Animated signal lines"
          >
            <path
              className="signal-path path-back"
              d="M10 96 C55 28, 90 28, 132 96 S210 150, 250 84 S292 30, 310 64"
            />
            <path
              className="signal-path path-front"
              d="M10 112 C48 146, 90 146, 128 112 S214 44, 254 88 S292 136, 310 104"
            />
            <circle className="pulse-node" cx="84" cy="44" r="6" />
            <circle className="pulse-node" cx="164" cy="116" r="6" />
            <circle className="pulse-node" cx="246" cy="86" r="6" />
          </svg>
        </article>

        <article className="demo-card animate-card">
          <div className="card-label">What it shows</div>
          <h2>One library, several animation styles.</h2>
          <ul className="feature-list">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>

        <article className="demo-card animate-card">
          <div className="card-label">Why React fits</div>
          <h2>Component structure, direct DOM choreography.</h2>
          <p>
            React keeps the layout declarative while `animejs` handles the
            precise timing, easing, loops, and per-element orchestration.
          </p>

          <div className="mini-timeline" aria-label="Animation sequence overview">
            <span>Intro</span>
            <span>Stage</span>
            <span>Cards</span>
            <span>Ambient loops</span>
          </div>
        </article>
      </main>
    </div>
  )
}

export default App
