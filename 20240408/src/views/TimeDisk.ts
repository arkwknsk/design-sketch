import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Context } from '../Context';

export class TimeDisk extends Container {
  private _fontSize = 16;
  private _fontColor = 0x000000;
  private _radius = 100;

  private _time = new Date();

  private _text: Text = new Text();

  constructor(radius: number = 100, fontSize: number = 16, fontColor: number = 0x000000) {
    super();

    // this._string = ;
    this._fontSize = fontSize;
    this._fontColor = fontColor;
    this._radius = radius;

    this.init();
  }

  public init() {
    const disk = new Graphics();
    disk.circle(0, 0, this._radius);
    disk.fill({ color: Context.TITLE_COLOR, alpha: 1.0 });
    // disk.stroke({ width: 2, color: 0x000000 });
    this.addChild(disk);


    const style = new TextStyle({
      fontFamily: "Akshar Regular",
      fontWeight: '400',
      fill: this._fontColor,
      fontSize: this._fontSize,
      letterSpacing: 1.0,
      align: 'left',
    });

    this._text = new Text({
      text: this._time.
        toLocaleString('ja-JP', {
          // year: 'numeric',
          // month: '2-digit',
          // day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '-').replace(' ', ' ').replace(/:/g, ':'),
      style: style,
    });
    this._text.anchor.set(0, 0.5);
    this._text.x = -this._radius + this._fontSize * 0.75;
    this.addChild(this._text);
  }
}

