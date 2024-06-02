import { Graphics, Text, TextStyle } from 'pixi.js';
// import { MathUtil } from './MathUtil'

export class Clock extends Graphics {
  private _string: string = "";
  private yearText: Text = new Text();
  private monthText: Text = new Text();
  private dayText: Text = new Text();
  private hourText: Text = new Text();
  private minText: Text = new Text();
  private secText: Text = new Text();
  private msecText: Text = new Text();
  private static textStyle: TextStyle = new TextStyle({
    fontFamily: "Akshar Regular",
    fontWeight: '400',
    fill: 0x000000,
    fontSize: 14,
    // letterSpacing: -0.25
    align: 'right',
  });

  private _margin = 4;

  public constructor() {
    super();

    this.init();
  }

  public init() {
    this.yearText = new Text({ text: '2024', style: Clock.textStyle });
    this.addChild(this.yearText);
    const dividerY2MText: Text = new Text({ text: '-', style: Clock.textStyle });
    dividerY2MText.x = this.yearText.x + this.yearText.width + this._margin;
    this.addChild(dividerY2MText);
    this.monthText = new Text({ text: '03', style: Clock.textStyle });
    this.monthText.x = dividerY2MText.x + dividerY2MText.width + this._margin;
    this.addChild(this.monthText);
    const dividerM2DText: Text = new Text({ text: '-', style: Clock.textStyle });
    dividerM2DText.x = this.monthText.x + this.monthText.width + this._margin;
    this.addChild(dividerM2DText);
    this.dayText = new Text({ text: '20', style: Clock.textStyle });
    this.dayText.x = dividerM2DText.x + dividerM2DText.width + this._margin;

    this.addChild(this.dayText);
    this.hourText = new Text({ text: '00', style: Clock.textStyle });
    this.hourText.x = this.dayText.x + this.dayText.width + this._margin * 3;
    this.addChild(this.hourText);
    const dividerH2MText: Text = new Text({ text: ':', style: Clock.textStyle });
    dividerH2MText.x = this.hourText.x + this.hourText.width + this._margin / 6;
    this.addChild(dividerH2MText);
    this.minText = new Text({ text: '00', style: Clock.textStyle });
    this.minText.x = dividerH2MText.x + dividerH2MText.width + this._margin;
    this.addChild(this.minText);
    const dividerM2SText: Text = new Text({ text: ':', style: Clock.textStyle });
    dividerM2SText.x = this.minText.x + this.minText.width + this._margin;
    this.addChild(dividerM2SText);
    this.secText = new Text({ text: '00', style: Clock.textStyle });
    this.secText.x = dividerM2SText.x + dividerM2SText.width + this._margin;
    this.addChild(this.secText);
    const dividerS2mText: Text = new Text({ text: '.', style: Clock.textStyle });
    dividerS2mText.x = this.secText.x + this.secText.width + this._margin / 3;
    this.addChild(dividerS2mText);
    this.msecText = new Text({ text: '888', style: Clock.textStyle });
    this.msecText.x = dividerS2mText.x + dividerS2mText.width + this._margin / 3;
    this.addChild(this.msecText);
  }

  public Start(): void {
  }

  public update = (): void => {
    const now = new Date();
    this.yearText.text = now.getFullYear().toString();
    this.monthText.text = Clock.zeroPadding(now.getMonth() + 1, 2);
    this.dayText.text = Clock.zeroPadding(now.getDate(), 2);
    this.hourText.text = Clock.zeroPadding(now.getHours(), 2);
    this.minText.text = Clock.zeroPadding(now.getMinutes(), 2);
    this.secText.text = Clock.zeroPadding(now.getSeconds(), 2);
    this.msecText.text = Clock.zeroPadding(now.getMilliseconds(), 3);
  };

  static zeroPadding(num: number, length: number): string {
    return (Array(length).join('0') + num).slice(-length);
  }

  toString(): string {
    return this._string;
  }

}
