/// <reference types="vite/client" />

interface CanvasRenderingContext2D {
  drawElementImage?: (
    element: Element,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number,
  ) => void;
}
