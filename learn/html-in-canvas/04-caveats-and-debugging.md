# 04 - 限制、注意事项与排错

## 最大注意事项：它仍是实验能力

不要把 HTML-in-Canvas 当成稳定 Web 标准来用。当前学习和实验可以大胆尝试，但生产项目要非常谨慎。

必须做：

- 功能探测。
- fallback。
- 浏览器版本说明。
- 错误捕获。
- 降级后的用户体验。

基础探测：

```ts
const canDrawElement =
  Boolean(ctx) && typeof ctx.drawElementImage === "function";
```

调用时也建议包一层 `try/catch`：

```ts
try {
  const transform = ctx.drawElementImage?.(panel, 0, 0, width, height);
  if (transform) {
    panel.style.transform = transform.toString();
  }
} catch (error) {
  drawFallback();
}
```

## 常见问题

### 1. `ctx.drawElementImage is not a function`

可能原因：

- 没用支持该实验的 Chromium 浏览器。
- 没开启 `chrome://flags/#canvas-draw-element`。
- 浏览器重启前 flag 没生效。
- TypeScript 类型声明不等于运行时支持。

处理：

- 先在控制台检查：`"drawElementImage" in CanvasRenderingContext2D.prototype`。
- 做 fallback，不要让页面崩溃。

### 2. 画出来是空白

可能原因：

- 被绘制元素不在 `<canvas>` fallback subtree 里。
- 被绘制元素不是 `<canvas>` 的直接子元素。
- canvas 没有 `layoutsubtree`。
- 元素尺寸为 0。
- 样式还没加载完成。
- 字体或图片资源还没 ready。
- 在第一帧快照生成前就调用了 `drawElementImage()`。

处理：

- 确认 DOM 结构是 `<canvas layoutsubtree><div id="panel">...</div></canvas>`，并且传入的是这个直接子元素。
- 用 DevTools 查看 `panel.getBoundingClientRect()`。
- 等 `document.fonts.ready` 后再绘制。
- 图片加载后再触发绘制。
- 优先在 `canvas.onpaint` 里绘制，或使用 `canvas.requestPaint()`。

### 3. 尺寸和预期不一致

Canvas 有两套尺寸：

- HTML 属性尺寸：`canvas.width`、`canvas.height`，决定内部像素缓冲区。
- CSS 尺寸：`canvas.style.width` 或 CSS 规则，决定页面显示大小。

建议：

```ts
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(cssWidth * dpr);
canvas.height = Math.round(cssHeight * dpr);
canvas.style.width = `${cssWidth}px`;
canvas.style.height = `${cssHeight}px`;
ctx.scale(dpr, dpr);
```

如果使用 `drawElementImage(panel, 0, 0, canvas.width, canvas.height)`，要明确你传的是像素尺寸还是 CSS 逻辑尺寸。

### 4. 纹理模糊

可能原因：

- Canvas 内部像素太小。
- Three.js 纹理映射被放大。
- 没考虑 `devicePixelRatio`。

处理：

- 增大 Canvas 内部尺寸。
- 控制 3D 平面尺寸和纹理比例。
- 根据需要设置 texture filtering。

### 5. 更新不及时

可能原因：

- DOM 状态改了，但没有重新调用 `drawElementImage()`。
- Three.js 里忘了设置 `texture.needsUpdate = true`。
- 绘制发生在布局更新之前。
- 在 `paint` 事件外读取的是上一帧快照。

处理：

- React 中可在状态变化后的 effect 或 animation frame 里重绘。
- Three.js 每次重绘 canvas 后设置 `texture.needsUpdate = true`。
- 必要时用 `requestAnimationFrame` 等一帧。
- 更推荐使用 `canvas.onpaint` 响应子树变化。

## 安全与跨域

Canvas 有安全模型。只要涉及跨域图片、视频、iframe 或外部资源，就要小心 canvas tainting。被污染的 canvas 后续无法安全读取像素，例如 `toDataURL()`、`getImageData()` 可能抛错。

建议：

- 图片资源使用同源或配置 CORS。
- 避免把第三方未授权内容绘制进需要读取像素的 canvas。
- 不要假设 iframe 或复杂嵌入内容都能被绘制。

## CSS 注意事项

实验 API 的具体 CSS 支持范围可能随实现变化。新手阶段建议从简单、稳定的 CSS 开始：

- Flex/Grid 布局。
- 背景色、边框、阴影。
- 基础字体。
- 简单 transform。

谨慎使用：

- 重滤镜。
- 复杂混合模式。
- 视频、iframe、跨域图片。
- 超大 DOM 子树。
- 依赖滚动容器内部状态的复杂布局。

## 可访问性注意事项

绘制到 canvas 或 WebGL 后的内容是像素，不再天然保留 DOM 可访问性。

如果这是核心信息或核心操作，需要：

- 保留真实 DOM 作为可访问层。
- 给 canvas 提供合理 `aria-label` 或替代文本。
- 不要只把关键表单放到 3D 纹理里。
- 键盘和屏幕阅读器路径应走真实 DOM。

## 调试清单

遇到问题时按顺序查：

1. 浏览器是否支持并开启 flag。
2. `ctx` 是否成功获取。
3. `ctx.drawElementImage` 是否是函数。
4. canvas 是否有 `layoutsubtree`。
5. 目标 DOM 是否是 canvas 的直接子元素。
6. 目标 DOM 是否有非零尺寸。
7. 是否在 `paint` 事件里绘制，或是否已经有可用快照。
8. CSS、字体、图片是否加载完成。
9. 是否有异常被吞掉。
10. Three.js 是否设置 `texture.needsUpdate = true`。
11. fallback 是否能正常显示。
