# 01 - 概念与环境准备

## 它解决什么问题

传统 Canvas 的绘制模型很底层：文字、按钮、卡片、布局、响应状态都要自己画。HTML/CSS 则擅长布局、字体、组件和状态管理，但正常情况下不能直接作为 Canvas 像素源。

HTML-in-Canvas 试图连接这两者：

```text
真实 DOM + CSS 布局 -> drawElementImage() -> Canvas 像素 -> 2D 合成 / WebGL 纹理 / Three.js 材质
```

你可以把一个真实 HTML 组件当成“可绘制图层”，然后在 Canvas 里继续做：

- 缩放、裁切、旋转、透明度合成。
- 离屏缓存。
- 后处理。
- 映射到 3D 模型或平面。
- 和传统 Canvas 图形混合。

## 它不是 html2canvas

`html2canvas` 是 JavaScript 库，通过解析 DOM 和 CSS 尝试模拟截图。HTML-in-Canvas 是浏览器原生能力，由浏览器渲染引擎直接把 DOM 子树绘制到 canvas。

区别很重要：

| 项目 | html2canvas | HTML-in-Canvas |
| --- | --- | --- |
| 类型 | 第三方库 | 浏览器实验 API |
| 原理 | JS 解析并重建渲染 | 浏览器原生绘制 DOM 子树 |
| 兼容性 | 可在更多浏览器尝试 | 目前依赖实验浏览器能力 |
| CSS 还原度 | 取决于库支持 | 理论上更接近浏览器真实渲染 |
| 生产可用性 | 常用于截图类需求 | 当前应视为实验 |

## 基本运行环境

建议准备：

- Chromium 或 Chrome Canary / Dev / Beta 等带实验能力的 Chromium 系浏览器。
- 本地开发服务器，例如 Vite、Next.js、Astro 或任意静态服务器。
- 基础 Canvas 2D 知识。
- 如果要贴到 3D 场景里，还需要 Three.js 或 WebGL 基础。

开启实验能力：

1. 打开 `chrome://flags/#canvas-draw-element`。
2. 启用对应 flag。
3. 重启浏览器。
4. 在页面里检测 `ctx.drawElementImage` 是否存在。

最小检测代码：

```ts
const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d");

const supported = Boolean(ctx && "drawElementImage" in ctx);
console.log("HTML-in-Canvas supported:", supported);
```

## 必须理解的结构要求

HTML-in-Canvas 不是随便抓取页面任意 DOM。它要求被绘制元素位于 canvas 的 fallback subtree 中，也就是写在 `<canvas>...</canvas>` 标签内部。按当前 API 参考，被传给 `drawElementImage()` 的元素还必须是 canvas 的直接子元素。

典型结构：

```html
<canvas id="output" width="600" height="400" layoutsubtree>
  <div id="panel">
    <h1>Status</h1>
    <button>Refresh</button>
  </div>
</canvas>
```

核心点：

- `<canvas>` 需要启用 `layoutsubtree`。
- 要绘制的元素是 `<canvas>` 的直接子元素。
- 用 `ctx.drawElementImage(panel, 0, 0, 600, 400)` 把 `panel` 绘制到 canvas 像素里。

在 React 里，`layoutsubtree` 也可以通过 DOM API 设置：

```ts
canvas.setAttribute("layoutsubtree", "true");
```

## 推荐绘制时机

官方示例推荐使用 canvas 的 `paint` 事件。这样可以拿到当前帧记录好的 DOM 快照：

```ts
canvas.onpaint = () => {
  ctx.reset();
  const transform = ctx.drawElementImage(panel, 0, 0);
  panel.style.transform = transform.toString();
};
```

如果你在 `paint` 事件外调用，拿到的可能是上一帧快照；如果还没有任何快照被记录，调用可能抛错。需要主动触发时，可以使用：

```ts
canvas.requestPaint();
```

## 学习前置知识

先掌握这些内容，后面会轻松很多：

- HTML：元素、语义结构、表单控件。
- CSS：布局、定位、尺寸、字体、背景、伪类。
- Canvas 2D：`getContext("2d")`、坐标系、清屏、绘制图片、合成。
- 浏览器渲染：DOM、CSSOM、layout、paint 的大致流程。
- TypeScript：实验 API 类型补充。
- 如果进入 3D：Three.js 的 `CanvasTexture`、材质、渲染循环。
