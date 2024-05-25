import { Graphics } from 'pixi.js';
import { Context } from '../Context';
// import { MathUtil } from './MathUtil'

export class Bar extends Graphics {
  private _height: number = 40;
  private _width: number = 8;
  private _alpha: number = 0.5;
  private _xScale: number;

  public constructor(scale: number = 1) {
    super();

    this._xScale = scale;
    this.init();
  }

  public init() {
    this.rect(-this._width / 2, -this._height * (1 / 6), this._width, this._height * this._xScale);
    this.fill({
      width: 1, color: Context.TITLE_COLOR, alpha: this._alpha
    });
  }
}
