import { Graphics } from 'pixi.js';
import { Context } from '../Context';
// import { MathUtil } from './MathUtil'

export class Disk extends Graphics {
  private _radius: number = 16;
  // private _color: number = 0x000000;
  private _circleAlpha: number = 0.2;
  private _lineAlpha: number = 1.0;

  public constructor() {
    super();


    this.init();
  }

  public init() {
    this.circle(0, 0, this._radius);
    this.stroke({ width: 1, color: Context.TITLE_COLOR, alpha: this._circleAlpha });

    this.moveTo(0, 0);
    this.lineTo(0, -this._radius);
    this.stroke({ width: 2, color: '#37bbe4', alpha: this._lineAlpha });
  }
}
