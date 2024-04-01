import { Container } from "pixi.js";

export const GridAlign = {
  TOP_LEFT: 'topLeft',
  TOP_RIGHT: 'topRight',
  BOTTOM_LEFT: 'bottomLeft',
  BOTTOM_RIGHT: 'bottomRight',
} as const;

export type GridAlign = (typeof GridAlign)[keyof typeof GridAlign];

export interface GridAnchor {
  content: Container;
  x: number;
  y: number;
  align: GridAlign;
}
