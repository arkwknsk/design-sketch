import { Graphics } from 'pixi.js';
import { Context } from '../Context';
// import { MathUtil } from './MathUtil'

export class Bar extends Graphics {
  private _height: number = 120;
  private _width: number = 16;
  // private _height: number = 40;
  // private _width: number = 4;
  private _alpha: number = 1.0;

  public constructor() {
    super();


    this.init();
  }

  public init() {
    this.rect(-this._width / 2, -this._height / 2, this._width, this._height);
    this.fill({ width: 1, color: Context.TITLE_COLOR, alpha: this._alpha });
  }
}
