export type HtmlCanvasMode = "native" | "fallback";

export type Telemetry = {
  cpu: number;
  memory: number;
  signal: number;
  latency: number;
  phase: number;
  title: string;
};

export type HtmlCanvasSource = {
  canvas: HTMLCanvasElement;
  mode: HtmlCanvasMode;
  render: (telemetry: Telemetry) => boolean;
  dispose: () => void;
};

const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 640;

export function createHtmlCanvasSource(
  canvas: HTMLCanvasElement,
  element: HTMLElement,
): HtmlCanvasSource {
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  canvas.layoutSubtree = true;
  canvas.setAttribute("layoutsubtree", "");

  const ctx = canvas.getContext("2d", {
    alpha: true,
    colorSpace: "display-p3",
  } as CanvasRenderingContext2DSettings);

  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const canDrawElement = typeof ctx.drawElementImage === "function";
  const mode: HtmlCanvasMode = canDrawElement ? "native" : "fallback";

  const renderNative = () => {
    if (!ctx.drawElementImage) {
      return false;
    }

    ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    const transform = ctx.drawElementImage(element, 0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    element.style.transform = transform.toString();
    return true;
  };

  const render = (telemetry: Telemetry) => {
    if (canDrawElement) {
      try {
        return renderNative();
      } catch {
        drawFallbackPanel(ctx, telemetry, true);
        return true;
      }
    }

    drawFallbackPanel(ctx, telemetry, false);
    return true;
  };

  canvas.onpaint = () => {
    if (canDrawElement) {
      try {
        renderNative();
      } catch {
        return;
      }
    }
  };

  canvas.requestPaint?.();

  return {
    canvas,
    mode,
    render,
    dispose: () => {
      canvas.onpaint = null;
    },
  };
}

function drawFallbackPanel(
  ctx: CanvasRenderingContext2D,
  telemetry: Telemetry,
  nativeFailed: boolean,
) {
  const { canvas } = ctx;
  const width = canvas.width;
  const height = canvas.height;
  const pulse = (Math.sin(telemetry.phase) + 1) / 2;

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#111827");
  gradient.addColorStop(0.52, "#164e63");
  gradient.addColorStop(1, "#f97316");
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, width, height, 44);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 18; i += 1) {
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + i * 0.004})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.22, 42 + i * 22 + pulse * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  drawSurface(ctx, 56, 50, width - 112, height - 100);

  ctx.fillStyle = "#fff7ed";
  ctx.font = "700 52px Inter, system-ui, sans-serif";
  ctx.fillText(telemetry.title, 100, 136);

  ctx.fillStyle = "rgba(255,247,237,0.7)";
  ctx.font = "24px Inter, system-ui, sans-serif";
  ctx.fillText(
    nativeFailed ? "Native snapshot failed; canvas fallback is active." : "Enable chrome://flags/#canvas-draw-element for native DOM snapshots.",
    102,
    184,
  );

  drawMetric(ctx, "CPU", telemetry.cpu, 102, 280, "#bef264");
  drawMetric(ctx, "MEM", telemetry.memory, 382, 280, "#67e8f9");
  drawMetric(ctx, "SIGNAL", telemetry.signal, 662, 280, "#fdba74");

  ctx.fillStyle = "rgba(255,247,237,0.72)";
  ctx.font = "22px Inter, system-ui, sans-serif";
  ctx.fillText(`Latency ${telemetry.latency.toFixed(1)}ms`, 102, 485);
  ctx.fillText("Fallback is hand-drawn so the Three.js scene keeps running.", 102, 526);
}

function drawSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.shadowColor = "rgba(0,0,0,0.36)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, x, y, width, height, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawMetric(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, x, y, 214, 128, 20);
  ctx.fill();

  ctx.fillStyle = "rgba(255,247,237,0.66)";
  ctx.font = "700 18px Inter, system-ui, sans-serif";
  ctx.fillText(label, x + 26, y + 38);

  ctx.fillStyle = color;
  ctx.font = "800 48px Inter, system-ui, sans-serif";
  ctx.fillText(String(Math.round(value)).padStart(2, "0"), x + 26, y + 96);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
