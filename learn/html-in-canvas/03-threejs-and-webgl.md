# 03 - 和 Three.js / WebGL 配合

HTML-in-Canvas 最有趣的用法之一，是把真实 DOM 绘制成 Canvas，再把这个 Canvas 作为 WebGL 纹理。

## 数据流

```text
DOM panel
  -> ctx.drawElementImage(panel, ...)
  -> HTMLCanvasElement
  -> THREE.CanvasTexture
  -> material.map
  -> mesh
```

## Three.js 最小思路

```ts
import * as THREE from "three";

const sourceCanvas = document.querySelector<HTMLCanvasElement>("#source");
const panel = document.querySelector<HTMLElement>("#panel");
const ctx = sourceCanvas?.getContext("2d");

if (!sourceCanvas || !panel || !ctx) {
  throw new Error("Missing source canvas, panel, or context.");
}

const texture = new THREE.CanvasTexture(sourceCanvas);
texture.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.PlaneGeometry(4, 2.25);
const material = new THREE.MeshBasicMaterial({ map: texture });
const screen = new THREE.Mesh(geometry, material);

scene.add(screen);

function animate() {
  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  try {
    if (typeof ctx.drawElementImage === "function") {
      const transform = ctx.drawElementImage(panel, 0, 0, sourceCanvas.width, sourceCanvas.height);
      panel.style.transform = transform.toString();
    }
  } catch {
    drawFallbackTexture(ctx);
  }

  texture.needsUpdate = true;
  renderer.render(scene, camera);
}

animate();
```

## 和普通 DOM UI 的区别

绘制到 WebGL 纹理后，它不再是页面上的可交互 DOM。它只是像素纹理。

这意味着：

- 鼠标不能直接点击纹理里的 button。
- 输入框不能直接获得焦点。
- 屏幕阅读器不会把纹理内容当成可访问 HTML。
- 需要自己把 3D 场景中的指针命中位置映射回 DOM 坐标，才能模拟交互。

新手阶段建议先把它当成“动态展示层”，不要一开始就做复杂交互。

## 也可以直接上传元素纹理

API 参考里还包含 WebGL 扩展：

```ts
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texElementImage2D(
  gl.TEXTURE_2D,
  0,
  gl.RGBA,
  gl.RGBA,
  gl.UNSIGNED_BYTE,
  panel,
);
```

不过新手建议先走 `drawElementImage() -> CanvasTexture` 路线，因为它更容易调试，也方便写 Canvas fallback。

## 推荐架构

把逻辑拆成三层：

```text
DOM 层：负责排版和状态展示
Canvas 捕获层：负责 drawElementImage / fallback
Three.js 层：负责纹理、材质、相机、动画
```

本仓库示例对应：

- `App.tsx`：DOM 层。
- `htmlCanvasTexture.ts`：Canvas 捕获层。
- `threeScene.ts`：Three.js 层。

这种拆法的好处是实验 API 变化时只需要改捕获层。

## 性能建议

- 控制纹理尺寸。先从 `512x512`、`1024x512`、`1024x640` 这种规模开始。
- 内容不变时不要每帧重绘。
- 重绘后才设置 `texture.needsUpdate = true`。
- 避免在被绘制 DOM 内放太重的 CSS 效果。
- 避免无限嵌套和巨大 DOM 子树。
- 字体、图片等资源加载完成后再第一次捕获。

## 交互进阶思路

如果确实需要让 3D 里的 HTML 纹理可交互，可以按这个方向拆：

1. 用 Three.js raycaster 找到鼠标命中的 mesh。
2. 从 UV 坐标算出纹理上的像素位置。
3. 把像素位置映射到 DOM 面板坐标。
4. 根据坐标分发或模拟 DOM 事件。

这部分复杂度较高，建议等基础纹理流程稳定后再做。

## 适合的使用场景

- 科幻面板、仪表盘、HUD。
- 3D 产品展示里的动态标签。
- 游戏或交互实验里的 UI 屏幕。
- 把设计系统组件转成可变形纹理。
- 需要 CSS 排版能力的 Canvas/WebGL demo。

## 不适合的使用场景

- 普通网页 UI。直接用 DOM 更简单。
- 强可访问性要求的核心表单。
- 必须支持所有主流浏览器的生产功能。
- 高频复杂交互的全量应用界面。
