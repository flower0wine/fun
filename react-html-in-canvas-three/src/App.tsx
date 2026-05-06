import { Activity, Gauge, Pause, Play, RefreshCw, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createHtmlCanvasSource,
  type HtmlCanvasMode,
  type Telemetry,
} from "./htmlCanvasSource";
import { createDemoScene } from "./threeScene";

const initialTelemetry: Telemetry = {
  cpu: 58,
  memory: 41,
  signal: 82,
  latency: 12,
  phase: 0,
  title: "Operations Deck",
};

function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stagingCanvasRef = useRef<HTMLCanvasElement>(null);
  const domPanelRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef(initialTelemetry);
  const pausedRef = useRef(false);

  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [mode, setMode] = useState<HtmlCanvasMode>("fallback");
  const [paused, setPaused] = useState(false);
  const [intensity, setIntensity] = useState(68);

  const statusCopy = useMemo(() => {
    if (mode === "native") {
      return "native drawElementImage active";
    }

    return "canvas fallback active";
  }, [mode]);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = stagingCanvasRef.current;
    const panel = domPanelRef.current;

    if (!viewport || !canvas || !panel) {
      return;
    }

    const source = createHtmlCanvasSource(canvas, panel);
    const scene = createDemoScene(viewport, source.canvas);
    setMode(source.mode);

    let animationFrame = 0;
    let last = performance.now();
    let lastStateUpdate = 0;

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      const phase = now * 0.001;

      if (!pausedRef.current && now - lastStateUpdate > 90) {
        lastStateUpdate = now;
        const next = makeTelemetry(phase, intensity);
        telemetryRef.current = next;
        setTelemetry(next);
        canvas.requestPaint?.();
      }

      source.render(telemetryRef.current);
      scene.texture.needsUpdate = true;
      scene.update(delta, phase);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
      source.dispose();
      scene.dispose();
    };
  }, [intensity]);

  return (
    <main className="app-shell">
      <section className="scene-panel" aria-label="Three.js scene">
        <div ref={viewportRef} className="three-viewport" />
      </section>

      <aside className="hud" aria-label="HTML-in-Canvas controls">
        <div className="hud-header">
          <div>
            <p className="eyebrow">React · TypeScript · Three.js</p>
            <h1>HTML-in-Canvas Texture Lab</h1>
          </div>
          <span className={`status-badge ${mode}`}>{statusCopy}</span>
        </div>

        <div className="explain-grid">
          <Step icon={<Activity size={18} />} label="DOM" value="real HTML panel" />
          <Step icon={<RefreshCw size={18} />} label="Canvas" value="drawElementImage" />
          <Step icon={<Waves size={18} />} label="Three" value="CanvasTexture" />
        </div>

        <div className="control-row">
          <button
            type="button"
            className="icon-button"
            aria-label={paused ? "Resume telemetry" : "Pause telemetry"}
            title={paused ? "Resume telemetry" : "Pause telemetry"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>

          <label className="slider-control">
            <span>
              <Gauge size={16} />
              Pulse intensity
            </span>
            <input
              type="range"
              min="25"
              max="95"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="metric-list">
          <Metric label="CPU" value={telemetry.cpu} suffix="%" />
          <Metric label="Memory" value={telemetry.memory} suffix="%" />
          <Metric label="Signal" value={telemetry.signal} suffix="%" />
          <Metric label="Latency" value={telemetry.latency} suffix="ms" decimals={1} />
        </div>

        <p className="note">
          The tiny clipped staging canvas stays painted so Chromium can keep a
          cached layoutsubtree snapshot. Without the experimental flag, the app
          draws a matching Canvas 2D fallback texture.
        </p>
      </aside>

      <div className="staging-container" aria-hidden="true">
        <canvas
          ref={stagingCanvasRef}
          className="staging-canvas"
          width="1024"
          height="640"
          layoutsubtree=""
        >
          <DomTexturePanel ref={domPanelRef} telemetry={telemetry} mode={mode} />
        </canvas>
      </div>
    </main>
  );
}

type DomTexturePanelProps = {
  telemetry: Telemetry;
  mode: HtmlCanvasMode;
  ref: React.Ref<HTMLDivElement>;
};

function DomTexturePanel({ telemetry, mode, ref }: DomTexturePanelProps) {
  const bars = Array.from({ length: 28 }, (_, index) => {
    const height = 20 + Math.sin(telemetry.phase * 2.2 + index * 0.48) * 16;
    return Math.max(8, height);
  });

  return (
    <div ref={ref} className="texture-card">
      <div className="texture-glow" />
      <header className="texture-header">
        <div>
          <p>Live DOM source</p>
          <h2>{telemetry.title}</h2>
        </div>
        <span className={`texture-mode ${mode}`}>
          {mode === "native" ? "DOM raster" : "fallback ready"}
        </span>
      </header>

      <section className="texture-metrics">
        <TextureMetric label="CPU" value={telemetry.cpu} tone="green" />
        <TextureMetric label="Memory" value={telemetry.memory} tone="blue" />
        <TextureMetric label="Signal" value={telemetry.signal} tone="orange" />
      </section>

      <section className="wave-card">
        <div className="wave-bars" aria-hidden="true">
          {bars.map((height, index) => (
            <i
              key={index}
              style={{
                height: `${height}px`,
                opacity: 0.32 + (index % 6) * 0.1,
              }}
            />
          ))}
        </div>
        <div>
          <span>Network latency</span>
          <strong>{telemetry.latency.toFixed(1)}ms</strong>
        </div>
      </section>
    </div>
  );
}

type TextureMetricProps = {
  label: string;
  value: number;
  tone: "green" | "blue" | "orange";
};

function TextureMetric({ label, value, tone }: TextureMetricProps) {
  return (
    <article className={`texture-metric ${tone}`}>
      <span>{label}</span>
      <strong>{Math.round(value).toString().padStart(2, "0")}</strong>
      <small>%</small>
    </article>
  );
}

type StepProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function Step({ icon, label, value }: StepProps) {
  return (
    <div className="step">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  suffix: string;
  decimals?: number;
};

function Metric({ label, value, suffix, decimals = 0 }: MetricProps) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>
        {value.toFixed(decimals)}
        {suffix}
      </strong>
    </div>
  );
}

function makeTelemetry(phase: number, intensity: number): Telemetry {
  const scale = intensity / 100;

  return {
    cpu: clamp(52 + Math.sin(phase * 1.5) * 34 * scale, 8, 96),
    memory: clamp(45 + Math.cos(phase * 1.1) * 26 * scale, 10, 92),
    signal: clamp(76 + Math.sin(phase * 1.9 + 1.4) * 22 * scale, 18, 99),
    latency: clamp(12 + Math.cos(phase * 2.4) * 6 * scale, 4, 24),
    phase,
    title: "Operations Deck",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default App;
