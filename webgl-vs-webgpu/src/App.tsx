import { useEffect, useRef, useState, type RefObject } from 'react'
import { WebGlRenderer } from './webgl-renderer'
import { WebGpuFluidGlassRenderer } from './webgpu-fluid-glass-renderer'
import { WebGpuRenderer } from './webgpu-renderer'

type PageId = 'compare' | 'fluid-glass'

function getPageFromHash(hash: string): PageId {
  return hash === '#/fluid-glass' ? 'fluid-glass' : 'compare'
}

function AppHeader({
  page,
}: {
  page: PageId
}) {
  return (
    <header className="app-header reveal">
      <a href="#/" className="brand-mark">
        <span className="brand-dot" />
        GPU Studies
      </a>
      <nav className="page-nav" aria-label="Page navigation">
        <a
          href="#/"
          className={`page-nav-link ${page === 'compare' ? 'page-nav-link-active' : ''}`}
        >
          WebGL vs WebGPU
        </a>
        <a
          href="#/fluid-glass"
          className={`page-nav-link ${page === 'fluid-glass' ? 'page-nav-link-active' : ''}`}
        >
          Fluid Glass
        </a>
      </nav>
    </header>
  )
}

function RendererPanel({
  canvasId,
  title,
  label,
  description,
  features,
  status,
  canvasRef,
  delayClass = 'reveal-delay-1',
}: {
  canvasId: string
  title: string
  label: string
  description: string
  features: string[]
  status: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  delayClass?: string
}) {
  return (
    <article className={`renderer-card reveal ${delayClass}`}>
      <div className="renderer-header">
        <div>
          <p className="renderer-label">{label}</p>
          <h3>{title}</h3>
        </div>
        <span className="status-pill">{status}</span>
      </div>
      <canvas
        id={canvasId}
        ref={canvasRef}
        width={640}
        height={420}
        aria-label={`${title} orbital field demo`}
      />
      <div className="renderer-copy">
        <p>{description}</p>
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function ComparisonPage() {
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const webgpuCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [webglStatus, setWebglStatus] = useState('Initializing')
  const [webgpuStatus, setWebgpuStatus] = useState('Checking support')

  useEffect(() => {
    if (!webglCanvasRef.current || !webgpuCanvasRef.current) {
      return
    }

    const webglRenderer = new WebGlRenderer(webglCanvasRef.current, setWebglStatus)
    const webgpuRenderer = new WebGpuRenderer(webgpuCanvasRef.current, setWebgpuStatus)

    void webglRenderer.start()
    void webgpuRenderer.start()

    return () => {
      webglRenderer.destroy()
      webgpuRenderer.destroy()
    }
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">TypeScript demo</p>
          <h1>WebGL and WebGPU look similar on screen, but not in the pipeline.</h1>
          <p className="hero-text">
            The left panel uses the classic graphics API model. The right panel uses a
            modern GPU pipeline with explicit device setup, pipeline objects, and typed
            buffers. Both scenes animate the same orbital field so the implementation
            differences are easier to compare.
          </p>
          <div className="hero-actions">
            <a href="#comparison" className="button button-primary">
              Compare the APIs
            </a>
            <a href="#renderers" className="button button-secondary">
              See the canvases
            </a>
          </div>
        </div>
        <div className="hero-card reveal reveal-delay-1">
          <div className="hero-grid">
            <article>
              <span>WebGL</span>
              <strong>State-machine API</strong>
              <p>GLSL shaders, implicit state changes, broad browser support.</p>
            </article>
            <article>
              <span>WebGPU</span>
              <strong>Explicit pipeline API</strong>
              <p>WGSL shaders, bind groups, storage buffers, compute-ready model.</p>
            </article>
            <article>
              <span>Demo</span>
              <strong>Same motion language</strong>
              <p>
                Animated orbital particles rendered through two very different
                abstractions.
              </p>
            </article>
            <article>
              <span>Why it matters</span>
              <strong>Control versus compatibility</strong>
              <p>WebGPU gives more headroom, but WebGL still wins on reach and maturity.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="comparison" className="section reveal reveal-delay-2">
        <div className="section-heading">
          <p className="eyebrow">Capability snapshot</p>
          <h2>What changes when you move from WebGL to WebGPU</h2>
        </div>
        <div className="comparison-grid">
          <article className="info-card">
            <h3>Programming model</h3>
            <p>
              WebGL revolves around mutable global state. WebGPU centers on explicit
              devices, queues, pipelines, and command encoders.
            </p>
          </article>
          <article className="info-card">
            <h3>Shader language</h3>
            <p>
              WebGL uses GLSL ES. WebGPU uses WGSL, designed specifically for
              browser-safe modern GPU access.
            </p>
          </article>
          <article className="info-card">
            <h3>Performance ceiling</h3>
            <p>
              WebGPU maps more directly to native GPU APIs, which reduces translation
              overhead and opens better scaling paths.
            </p>
          </article>
          <article className="info-card">
            <h3>Adoption tradeoff</h3>
            <p>
              WebGL runs almost everywhere today. WebGPU support is improving fast, but
              still needs capability checks and fallbacks.
            </p>
          </article>
        </div>
        <div className="table-card">
          <div className="table-row table-head">
            <span>Dimension</span>
            <span>WebGL</span>
            <span>WebGPU</span>
          </div>
          <div className="table-row">
            <span>Architecture</span>
            <span>OpenGL ES style state machine</span>
            <span>Modern explicit GPU pipeline</span>
          </div>
          <div className="table-row">
            <span>Shaders</span>
            <span>GLSL ES 1.00 / 3.00</span>
            <span>WGSL</span>
          </div>
          <div className="table-row">
            <span>Resource binding</span>
            <span>Uniforms and texture slots</span>
            <span>Bind groups and typed buffers</span>
          </div>
          <div className="table-row">
            <span>Compute work</span>
            <span>Not available directly</span>
            <span>Built in</span>
          </div>
          <div className="table-row">
            <span>Best use today</span>
            <span>Maximum compatibility</span>
            <span>High-end rendering and future-facing pipelines</span>
          </div>
        </div>
      </section>

      <section id="renderers" className="section renderer-section">
        <div className="section-heading reveal">
          <p className="eyebrow">Live rendering</p>
          <h2>Two canvases, one scene design, two graphics stacks</h2>
        </div>
        <div className="renderer-grid">
          <RendererPanel
            canvasId="webgl-canvas"
            canvasRef={webglCanvasRef}
            label="Canvas A"
            title="WebGL"
            status={webglStatus}
            description="Renders point sprites with a GLSL shader pair and a compact state-driven setup."
            features={[
              'Uniform-driven animation',
              'Point rendering with smooth falloff',
              'Excellent compatibility',
            ]}
          />
          <RendererPanel
            canvasId="webgpu-canvas"
            canvasRef={webgpuCanvasRef}
            label="Canvas B"
            title="WebGPU"
            status={webgpuStatus}
            delayClass="reveal-delay-2"
            description="Uses WGSL plus storage buffers and an explicit render pipeline that maps more directly to modern GPU hardware."
            features={[
              'Device and queue setup',
              'Instanced quads from typed buffers',
              'Ready for compute expansion',
            ]}
          />
        </div>
      </section>
    </>
  )
}

function FluidGlassPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState('Checking support')

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const renderer = new WebGpuFluidGlassRenderer(canvasRef.current, setStatus)
    void renderer.start()

    return () => {
      renderer.destroy()
    }
  }, [])

  return (
    <>
      <section className="fluid-hero">
        <div className="fluid-copy reveal">
          <p className="eyebrow">WebGPU study</p>
          <h1>Fluid glass, rendered as a refractive field instead of a flat blur.</h1>
          <p className="hero-text">
            This page uses WebGPU to fake the iOS-style liquid glass look with a
            procedural backdrop, a metaball field, distortion, edge highlights, and a
            cursor-responsive lens. Drag across the scene to push the fluid around.
          </p>
          <div className="hero-actions">
            <a href="#fluid-canvas" className="button button-primary">
              Open the demo
            </a>
            <a href="#/" className="button button-secondary">
              Back to comparison
            </a>
          </div>
        </div>
        <div className="fluid-summary reveal reveal-delay-1">
          <article className="fluid-note">
            <span>Material</span>
            <strong>Refractive liquid layer</strong>
            <p>Sampling the backdrop through a warped field creates the glass body.</p>
          </article>
          <article className="fluid-note">
            <span>Edges</span>
            <strong>Specular and frosted rims</strong>
            <p>Gradient-derived normals add a bright edge and a soft interior bloom.</p>
          </article>
          <article className="fluid-note">
            <span>Interaction</span>
            <strong>Pointer-driven disturbance</strong>
            <p>The hero droplet leans toward the cursor to keep the surface feeling alive.</p>
          </article>
        </div>
      </section>

      <section id="fluid-canvas" className="section">
        <article className="fluid-stage reveal reveal-delay-2">
          <div className="fluid-stage-top">
            <div>
              <p className="renderer-label">WebGPU showcase</p>
              <h2>iOS-inspired fluid glass</h2>
            </div>
            <span className="status-pill">{status}</span>
          </div>
          <div className="fluid-canvas-shell">
            <canvas
              ref={canvasRef}
              width={1440}
              height={900}
              className="fluid-canvas"
              aria-label="WebGPU fluid glass scene"
            />
            <div className="floating-panel floating-panel-primary">
              <p>Now Playing</p>
              <strong>Liquid UI study</strong>
              <span>WebGPU refracts the procedural wallpaper underneath.</span>
            </div>
            <div className="floating-panel floating-panel-secondary">
              <p>Material notes</p>
              <strong>Blur + refraction + edge energy</strong>
              <span>The field is built from animated metaballs instead of static rounded cards.</span>
            </div>
            <div className="floating-pill">Move pointer across the canvas</div>
          </div>
        </article>
      </section>

      <section className="section">
        <div className="comparison-grid fluid-detail-grid">
          <article className="info-card reveal">
            <h3>Why WebGPU here</h3>
            <p>
              This effect benefits from explicit pipelines and shader-heavy full-screen
              rendering. The page is mostly one fragment shader pass, which is a natural
              fit for WebGPU.
            </p>
          </article>
          <article className="info-card reveal reveal-delay-1">
            <h3>What sells the illusion</h3>
            <p>
              The material reads as glass when refraction, caustic-like color lift,
              frosted centers, and a moving highlight work together instead of relying on
              a plain CSS blur.
            </p>
          </article>
          <article className="info-card reveal reveal-delay-2">
            <h3>Fallback behavior</h3>
            <p>
              If WebGPU is unavailable, the page stays readable and reports that state,
              but the liquid material itself is intentionally tied to the GPU path.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}

export default function App() {
  const [page, setPage] = useState<PageId>(() => getPageFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setPage(getPageFromHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  return (
    <div className={`page-shell ${page === 'fluid-glass' ? 'page-shell-fluid' : ''}`}>
      <AppHeader page={page} />
      {page === 'fluid-glass' ? <FluidGlassPage /> : <ComparisonPage />}
    </div>
  )
}
