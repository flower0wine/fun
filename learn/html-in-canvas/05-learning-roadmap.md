# 05 - 新手学习路线

这条路线按 2 到 4 周设计。每天投入 30 到 90 分钟即可推进。

## 第 0 阶段：先跑通环境

目标：确认浏览器和本机项目可以使用实验 API。

任务：

- 安装或打开 Chromium 系浏览器。
- 启用 `chrome://flags/#canvas-draw-element`。
- 写一个页面检测 `ctx.drawElementImage`。
- 在不支持时显示 fallback 文案。

验收标准：

- 控制台能输出支持状态。
- 不支持时页面不崩溃。

## 第 1 阶段：掌握 Canvas 2D 基础

目标：理解 canvas 坐标、尺寸和绘制循环。

学习内容：

- `canvas.width` / `canvas.height` 和 CSS 尺寸区别。
- `getContext("2d")`。
- `clearRect()`、`fillRect()`、`drawImage()`。
- `requestAnimationFrame()`。
- `devicePixelRatio`。

练习：

- 手绘一个卡片。
- 做一个每秒更新数字的 canvas。
- 做一个高 DPR 下不模糊的 canvas。

## 第 2 阶段：绘制真实 DOM

目标：把一个 HTML 卡片绘制进 canvas。

学习内容：

- `<canvas layoutsubtree>`。
- canvas fallback subtree。
- 直接子元素限制。
- `drawElementImage()`。
- `paint` 事件和 `requestPaint()`。
- 功能探测和 `try/catch`。
- DOM 尺寸和 canvas 像素尺寸对齐。

练习：

- 绘制一个静态 DOM 卡片。
- 修改 DOM 文案后重新绘制。
- 加入按钮、进度条、状态徽章等真实 HTML 元素。
- 写一个 fallback：不支持时手绘简化卡片。

## 第 3 阶段：状态驱动渲染

目标：理解 DOM 状态更新和 canvas 捕获之间的节奏。

学习内容：

- React/Vue/Svelte 状态更新后的绘制时机。
- 字体和图片加载完成后重绘。
- 只在 dirty 时重绘。
- 每帧重绘的成本。

练习：

- 用 React 写一个实时仪表盘。
- 数值变化时绘制到 canvas。
- 增加“暂停捕获”和“手动捕获”按钮。
- 比较每帧绘制和按需绘制的性能差异。

## 第 4 阶段：接入 Three.js

目标：把 canvas 作为 3D 纹理。

学习内容：

- `THREE.CanvasTexture`。
- `texture.needsUpdate`。
- `MeshBasicMaterial`。
- 平面几何体和纹理比例。
- 渲染循环和资源释放。

练习：

- 把 DOM 卡片贴到 3D 平面上。
- 让平面旋转或轻微浮动。
- 更新 DOM 后同步更新纹理。
- 增加 fallback texture。

## 第 5 阶段：进阶交互和工程化

目标：把实验代码变成可维护模块。

学习内容：

- 封装 `createHtmlCanvasTextureSource()`。
- 错误边界和状态展示。
- 资源释放。
- 纹理尺寸策略。
- 交互坐标映射。
- 可访问性保留方案。

练习：

- 把 HTML-in-Canvas 逻辑抽成独立模块。
- 提供 `status: "native" | "fallback"`。
- 提供 `render()` 方法。
- 在 Three.js 场景销毁时释放纹理和几何体。
- 写一个 README 说明浏览器要求和 fallback 行为。

## 推荐项目

### 项目 1：DOM 名片捕获

做一个 HTML 名片，绘制到 canvas，并提供下载按钮。

重点：

- DOM 尺寸固定。
- 字体加载后捕获。
- 不支持时提示用户。

### 项目 2：实时状态面板

做一个模拟服务器监控面板，每秒变化 CPU、内存、延迟数字，再绘制到 canvas。

重点：

- 状态变化。
- 按需重绘。
- fallback。

### 项目 3：Three.js 控制屏

把状态面板贴到一个 3D 屏幕上。

重点：

- CanvasTexture。
- `texture.needsUpdate`。
- 纹理比例。
- 资源释放。

### 项目 4：可交互 3D 面板

在 3D 屏幕上点击一个区域，映射到原 DOM 坐标并触发状态变化。

重点：

- raycaster。
- UV 坐标。
- DOM 坐标映射。
- 真实 DOM 交互层和纹理展示层的关系。

## 需要补的基础

如果某一步卡住，优先补这些：

- Canvas 2D：MDN Canvas tutorial。
- 浏览器渲染流程：layout、paint、composite。
- CSS 尺寸体系：CSS px、设备像素、DPR。
- Three.js：scene、camera、renderer、mesh、material、texture。
- React：ref、effect、状态更新时机。

## 学习原则

- 先 2D，后 3D。
- 先静态，后动态。
- 先展示，后交互。
- 先支持检测，后功能封装。
- 任何 demo 都保留 fallback。

## 最后要形成的能力

学完后你应该能独立完成：

- 判断浏览器是否支持 HTML-in-Canvas。
- 把 DOM 子树绘制到 canvas。
- 处理基础尺寸、DPR 和重绘问题。
- 在不支持时降级。
- 把 canvas 作为 Three.js 纹理。
- 解释为什么它还不适合无 fallback 的生产功能。
