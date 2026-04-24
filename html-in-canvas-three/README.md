# HTML-in-Canvas Three Lab

React + TypeScript + Three.js demo for the WICG HTML-in-Canvas experiment.

The scene maps a live DOM control deck onto a curved 3D display. In browsers
that expose the experimental API, the texture is produced with:

```ts
ctx.drawElementImage(htmlElement, 0, 0, width, height);
```

If that API is unavailable, the app keeps the 3D scene running with a Canvas 2D
fallback texture and shows `canvas fallback active` in the UI.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Enable Native HTML-in-Canvas

Use a Chromium build that includes the experiment, then enable:

```text
chrome://flags/#canvas-draw-element
```

Restart the browser and reload the demo. The badge should switch from
`canvas fallback active` to `native HTML-in-Canvas active`.

## Notes

- This is an experimental WICG proposal, not a stable cross-browser API.
- The direct DOM-to-canvas path is isolated in `src/htmlCanvasTexture.ts`.
- The Three.js scene is isolated in `src/threeScene.ts`.
