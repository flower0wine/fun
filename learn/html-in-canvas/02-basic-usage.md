# 02 - 最小可用示例

这一节只关注 Canvas 2D 的基本使用，不引入 Three.js。

## 第一步：准备 HTML 结构

```html
<canvas id="stage" width="640" height="360" layoutsubtree>
  <section id="card" class="card">
    <p class="eyebrow">Live DOM</p>
    <h1>HTML inside Canvas</h1>
    <button>Action</button>
  </section>
</canvas>
```

注意：`#card` 写在 `<canvas>` 内部。这里的 DOM 是 canvas fallback content，但在 HTML-in-Canvas 实验里可以被布局并绘制。

## 第二步：写样式

```css
canvas {
  width: 640px;
  height: 360px;
  border: 1px solid #d0d7de;
}

.card {
  box-sizing: border-box;
  width: 640px;
  height: 360px;
  padding: 40px;
  background: #101820;
  color: white;
  font-family: system-ui, sans-serif;
}

.eyebrow {
  color: #8bd3ff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

button {
  margin-top: 24px;
  padding: 10px 16px;
}
```

建议新手先让 DOM 尺寸和 canvas 内部像素尺寸一致，这样坐标和缩放最容易理解。

## 第三步：调用 drawElementImage

```ts
const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const card = document.querySelector<HTMLElement>("#card");
const ctx = canvas?.getContext("2d");

if (!canvas || !card || !ctx) {
  throw new Error("Missing canvas, card, or 2D context.");
}

if (typeof ctx.drawElementImage !== "function") {
  ctx.fillStyle = "#fff4cc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f2328";
  ctx.font = "20px system-ui";
  ctx.fillText("drawElementImage() is not available.", 32, 64);
} else {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const transform = ctx.drawElementImage(card, 0, 0, canvas.width, canvas.height);
  card.style.transform = transform.toString();
}
```

## 第四步：处理 TypeScript 类型

因为这是实验 API，很多 TypeScript 环境还没有内置类型。可以加一个声明文件，例如 `src/vite-env.d.ts` 或 `src/html-in-canvas.d.ts`：

```ts
interface CanvasRenderingContext2D {
  drawElementImage?(
    element: Element | ElementImage,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ): DOMMatrix;
}

interface HTMLCanvasElement {
  layoutSubtree: boolean;
  onpaint: ((this: HTMLCanvasElement, ev: Event) => unknown) | null;
  requestPaint(): void;
  captureElementImage(element: Element): ElementImage;
}

interface ElementImage {
  readonly width: number;
  readonly height: number;
  close(): void;
}
```

上面只声明了新手最常用的签名。完整 API 还有和 `drawImage()` 类似的源矩形重载。后续规范或浏览器实现更新时，以官方文档和实际浏览器行为为准。

## 第五步：优先使用 paint 事件

推荐让 canvas 在子树变化后通过 `paint` 事件通知你重绘：

```ts
canvas.onpaint = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (typeof ctx.drawElementImage === "function") {
    const transform = ctx.drawElementImage(card, 0, 0, canvas.width, canvas.height);
    card.style.transform = transform.toString();
  }
};
```

需要主动请求一次绘制时：

```ts
canvas.requestPaint();
```

如果你还在做 Three.js 动画循环，也可以在 `requestAnimationFrame` 里重绘；但要知道 `paint` 事件外调用时通常拿到上一帧快照，第一次调用前也可能因为没有快照而抛错。

```ts
function render() {
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawElementImage?.(card, 0, 0, canvas.width, canvas.height);
  } catch {
    drawFallback();
  }

  requestAnimationFrame(render);
}

render();
```

如果内容很少变化，不要无脑每帧绘制。可以只在状态更新、窗口尺寸变化、字体加载完成后重新绘制。

## 基本模式总结

```text
1. 在 canvas 内部放 DOM。
2. 给 canvas 启用 layoutsubtree。
3. 获取 CanvasRenderingContext2D。
4. 检测 ctx.drawElementImage 是否可用。
5. 在 `paint` 事件里调用 drawElementImage(element, x, y, width, height)。
6. 使用返回的 `DOMMatrix` 同步元素 transform。
7. 在不支持或调用失败时走 fallback。
```

## 常见 fallback 思路

当前阶段一定要准备 fallback：

- Canvas 手绘一个简化版 UI。
- 显示普通 DOM，不做 canvas 合成。
- 使用静态图片替代。
- 在截图需求里评估 `html2canvas`。
- 在 3D 纹理需求里使用手绘 Canvas texture。

本仓库 `html-in-canvas-three/src/htmlCanvasTexture.ts` 使用的就是“原生可用则绘制 DOM，不可用则手绘 Canvas 面板”的模式。
