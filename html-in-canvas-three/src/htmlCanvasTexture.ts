export type HtmlCanvasStatus = "native" | "fallback";

export type HtmlCanvasTextureSource = {
  textureCanvas: HTMLCanvasElement;
  status: HtmlCanvasStatus;
  render: (metrics: LiveMetrics) => boolean;
};

export type LiveMetrics = {
  fps: number;
  energy: number;
  load: number;
  latency: number;
  phase: number;
};

const WIDTH = 1024;
const HEIGHT = 640;

export function createHtmlCanvasTextureSource(
  htmlElement: HTMLElement,
): HtmlCanvasTextureSource {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = WIDTH;
  textureCanvas.height = HEIGHT;

  const ctx = textureCanvas.getContext("2d", {
    alpha: true,
    colorSpace: "display-p3",
  } as CanvasRenderingContext2DSettings);

  if (!ctx) {
    throw new Error("2D canvas is unavailable.");
  }

  const canDrawElement = typeof ctx.drawElementImage === "function";
  const status: HtmlCanvasStatus = canDrawElement ? "native" : "fallback";

  const render = (metrics: LiveMetrics) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (canDrawElement && ctx.drawElementImage) {
      try {
        ctx.drawElementImage(htmlElement, 0, 0, WIDTH, HEIGHT);
        return true;
      } catch (error) {
        drawFallbackPanel(ctx, metrics, true);
        return true;
      }
    }

    drawFallbackPanel(ctx, metrics, false);
    return true;
  };

  return { textureCanvas, status, render };
}

function drawFallbackPanel(
  ctx: CanvasRenderingContext2D,
  metrics: LiveMetrics,
  nativeFailed: boolean,
) {
  const { canvas } = ctx;
  const width = canvas.width;
  const height = canvas.height;
  const pulse = (Math.sin(metrics.phase) + 1) / 2;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#101b2e");
  background.addColorStop(0.48, "#183950");
  background.addColorStop(1, "#d46b3a");
  ctx.fillStyle = background;
  roundRect(ctx, 0, 0, width, height, 48);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 16; i += 1) {
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + i * 0.004})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.22, 54 + i * 22 + pulse * 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  drawGlassCard(ctx, 56, 56, 912, 528);

  ctx.fillStyle = "#f9f4df";
  ctx.font = "700 56px Georgia, serif";
  ctx.fillText("Orbit Control Deck", 96, 142);

  ctx.fillStyle = "rgba(249,244,223,0.68)";
  ctx.font = "26px Trebuchet MS, sans-serif";
  ctx.fillText(
    nativeFailed ? "Native drawElementImage failed; using canvas fallback." : "Enable chrome://flags/#canvas-draw-element for native HTML.",
    98,
    188,
  );

  drawMetric(ctx, "FPS", metrics.fps, 102, 286, "#d7ff72");
  drawMetric(ctx, "ENERGY", metrics.energy, 382, 286, "#81f7e5");
  drawMetric(ctx, "LOAD", metrics.load, 662, 286, "#ffb45e");

  ctx.fillStyle = "rgba(249,244,223,0.7)";
  ctx.font = "22px Trebuchet MS, sans-serif";
  ctx.fillText("Live DOM panel mirrored into a Three.js material texture.", 102, 482);
  ctx.fillText("Fallback is intentionally hand drawn so the 3D scene remains usable.", 102, 520);
}

function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 22;
  roundRect(ctx, x, y, width, height, 38);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
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
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, x, y, 214, 126, 24);
  ctx.fill();

  ctx.fillStyle = "rgba(249,244,223,0.62)";
  ctx.font = "18px Trebuchet MS, sans-serif";
  ctx.fillText(label, x + 26, y + 38);

  ctx.fillStyle = color;
  ctx.font = "700 44px Trebuchet MS, sans-serif";
  ctx.fillText(String(Math.round(value)).padStart(2, "0"), x + 26, y + 92);
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
