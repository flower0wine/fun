/// <reference types="vite/client" />

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
  onpaint: ((this: HTMLCanvasElement, ev: PaintEvent) => unknown) | null;
  requestPaint?: () => void;
  captureElementImage?: (element: Element) => ElementImage;
}

interface PaintEvent extends Event {
  readonly changedElements: readonly Element[];
}

interface ElementImage {
  readonly width: number;
  readonly height: number;
  close(): void;
}

declare namespace React {
  interface CanvasHTMLAttributes<T> {
    layoutsubtree?: string | boolean;
  }
}
