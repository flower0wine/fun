# React HTML-in-Canvas Three Demo

React + TypeScript + Three.js demo for the WICG HTML-in-Canvas experiment.

The app renders a real DOM telemetry panel into a canvas, then uses that canvas
as a `THREE.CanvasTexture` on a curved 3D display. If the browser does not
support the experimental API, the scene keeps running with a hand-drawn Canvas
2D fallback texture.

## Run

```bash
npm install
npm run dev -- --port 5180
```

Open:

```text
http://127.0.0.1:5180/
```

## Enable native HTML-in-Canvas

Use a Chromium build that exposes the experiment, then enable:

```text
chrome://flags/#canvas-draw-element
```

Restart the browser and reload the page. The badge switches from
`canvas fallback active` to `native drawElementImage active` when
`CanvasRenderingContext2D.drawElementImage()` is available.

## Implementation notes

- The DOM source lives as a direct child of `<canvas layoutsubtree>`.
- The staging canvas is clipped to a 1x1 visible area instead of using
  `display: none`, because hidden layoutsubtree content may not get a cached
  paint record.
- `src/htmlCanvasSource.ts` owns `drawElementImage()`, `onpaint`,
  `requestPaint()`, and fallback drawing.
- `src/threeScene.ts` owns the Three.js scene and `CanvasTexture`.
- `src/App.tsx` owns React state and the live DOM panel.

## References

- Official demos: https://html-in-canvas.dev/demos/
- 3D room example: https://html-in-canvas.dev/demos/3d-room-live-content/
- Hello World example: https://html-in-canvas.dev/demos/hello-world/
- WICG draft: https://wicg.github.io/html-in-canvas/
