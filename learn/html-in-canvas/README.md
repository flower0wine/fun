# HTML-in-Canvas 学习入口

`html-in-canvas` 指的是 WICG 正在推进的 **HTML-in-Canvas** 浏览器能力：让开发者可以把一段真实 DOM 子树绘制到 Canvas 里。它的核心 API 是 Canvas 2D 上下文的实验方法：

```ts
const transform = ctx.drawElementImage(element, x, y, width, height);
```

它适合学习和实验这些方向：

- 把 HTML/CSS 组件截图式绘制进 Canvas 2D。
- 把 DOM UI 渲染成纹理，再贴到 WebGL 或 Three.js 场景里。
- 保留 HTML/CSS 的排版能力，同时获得 Canvas/WebGL 的合成、变形、滤镜或 3D 映射能力。

但它还不是稳定的跨浏览器能力。学习时要先把它当成“实验性平台 API”，而不是生产环境通用方案。

## 推荐阅读顺序

1. [01-概念与环境准备](./01-concept-and-setup.md)
2. [02-最小可用示例](./02-basic-usage.md)
3. [03-和 Three.js / WebGL 配合](./03-threejs-and-webgl.md)
4. [04-限制、注意事项与排错](./04-caveats-and-debugging.md)
5. [05-新手学习路线](./05-learning-roadmap.md)

## 当前状态速览

- 标准状态：WICG 提案，仍在实验阶段。
- 浏览器支持：主要关注 Chromium 系浏览器。官方文档当前写明需要 Chrome Canary 或 Brave Stable（Chromium 147+）并开启 `chrome://flags/#canvas-draw-element`。
- 关键 API：`CanvasRenderingContext2D.drawElementImage()`。
- 关键前提：被绘制的 DOM 必须是 `<canvas>` 的直接子元素，并且对应 canvas 需要声明 `layoutsubtree`。
- 推荐时机：在 canvas 的 `paint` 事件中绘制，必要时用 `requestPaint()` 主动请求下一帧 paint。
- 生产建议：必须做功能探测和 fallback，不要假设所有用户浏览器都有该 API。

## 本仓库里的相关示例

仓库中已有一个实验项目：

```text
html-in-canvas-three/
```

其中核心文件是：

- `html-in-canvas-three/src/htmlCanvasTexture.ts`：封装 `drawElementImage()` 探测、调用和 Canvas fallback。
- `html-in-canvas-three/src/App.tsx`：把 DOM 控制面板放进 `<canvas>` 的 fallback subtree。
- `html-in-canvas-three/src/threeScene.ts`：把绘制结果作为 Three.js 纹理使用。

## 参考资料

- 官方文档：[HTML-in-Canvas documentation](https://html-in-canvas.dev/docs/overview/)
- API 参考：[API Reference](https://html-in-canvas.dev/docs/api-reference/)
- 规范草案：[WICG HTML-in-Canvas](https://wicg.github.io/html-in-canvas/)
- 提案仓库：[WICG/html-in-canvas](https://github.com/WICG/html-in-canvas)
