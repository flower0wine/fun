import { useEffect, useRef, useState } from "react";
import { createHtmlCanvasTextureSource, type HtmlCanvasStatus, type LiveMetrics } from "./htmlCanvasTexture";
import { createScene } from "./threeScene";

const initialMetrics: LiveMetrics = {
  fps: 60,
  energy: 74,
  load: 31,
  latency: 12,
  phase: 0,
};

function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const htmlPanelRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [status, setStatus] = useState<HtmlCanvasStatus>("fallback");

  useEffect(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const htmlPanel = htmlPanelRef.current;
    const viewport = viewportRef.current;

    if (!sourceCanvas || !htmlPanel || !viewport) {
      return;
    }

    sourceCanvas.setAttribute("layoutsubtree", "true");

    const textureSource = createHtmlCanvasTextureSource(htmlPanel);
    setStatus(textureSource.status);

    const scene = createScene(viewport, textureSource.textureCanvas);
    let animationFrame = 0;
    let last = performance.now();
    let frameCounter = 0;
    let lastFpsTime = last;
    let measuredFps = 60;

    const animate = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      frameCounter += 1;

      if (now - lastFpsTime > 450) {
        measuredFps = (frameCounter * 1000) / (now - lastFpsTime);
        frameCounter = 0;
        lastFpsTime = now;
      }

      const phase = now * 0.001;
      const nextMetrics = {
        fps: measuredFps,
        energy: 65 + Math.sin(phase * 1.6) * 23,
        load: 34 + Math.cos(phase * 1.1) * 18,
        latency: 9 + Math.sin(phase * 2.4) * 4,
        phase,
      };

      setMetrics(nextMetrics);
      textureSource.render(nextMetrics);
      scene.update(delta, phase);
      scene.texture.needsUpdate = true;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      scene.dispose();
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-copy" aria-label="Demo information">
        <p className="eyebrow">WICG HTML-in-Canvas experiment</p>
        <h1>Live HTML as a texture inside a Three.js scene.</h1>
        <p>
          The control deck below is real DOM. When Chromium's experimental
          <code> drawElementImage()</code> API is enabled, it is rendered into a
          canvas texture and mapped onto the floating 3D display.
        </p>
        <div className="status-row">
          <span className={`status-pill ${status}`}>
            {status === "native" ? "native HTML-in-Canvas active" : "canvas fallback active"}
          </span>
          <span>Chrome flag: chrome://flags/#canvas-draw-element</span>
        </div>
      </section>

      <section ref={viewportRef} className="three-viewport" aria-label="Three.js scene" />

      <canvas ref={sourceCanvasRef} className="html-source-canvas" width={1024} height={640}>
        <HtmlControlDeck ref={htmlPanelRef} metrics={metrics} status={status} />
      </canvas>
    </main>
  );
}

type HtmlControlDeckProps = {
  metrics: LiveMetrics;
  status: HtmlCanvasStatus;
  ref: React.Ref<HTMLDivElement>;
};

function HtmlControlDeck({ metrics, status, ref }: HtmlControlDeckProps) {
  return (
    <div ref={ref} className="control-deck">
      <div className="deck-glow" />
      <div className="deck-header">
        <div>
          <p>orbital telemetry</p>
          <h2>Control Deck</h2>
        </div>
        <span className={`native-badge ${status}`}>
          {status === "native" ? "DOM raster" : "fallback"}
        </span>
      </div>

      <div className="metric-grid">
        <MetricCard label="FPS" value={metrics.fps} unit="hz" tone="lime" />
        <MetricCard label="Energy" value={metrics.energy} unit="%" tone="cyan" />
        <MetricCard label="GPU Load" value={metrics.load} unit="%" tone="amber" />
      </div>

      <div className="wave-card">
        <div className="wave-bars" aria-hidden="true">
          {Array.from({ length: 22 }, (_, index) => (
            <i
              key={index}
              style={{
                height: `${34 + Math.sin(metrics.phase * 2 + index * 0.52) * 30}px`,
                opacity: 0.32 + ((index % 5) * 0.11),
              }}
            />
          ))}
        </div>
        <div>
          <span>signal latency</span>
          <strong>{metrics.latency.toFixed(1)}ms</strong>
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  unit: string;
  tone: "lime" | "cyan" | "amber";
};

function MetricCard({ label, value, unit, tone }: MetricCardProps) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{Math.round(value).toString().padStart(2, "0")}</strong>
      <small>{unit}</small>
    </article>
  );
}

export default App;
