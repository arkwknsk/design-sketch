import gsap from 'gsap';
import { Container, Text, TextStyle } from 'pixi.js';
import { AppManager } from '../core/AppManager';
import { TypeStatus } from '../models/TypeStatus';

export class RandomTitleOneLine extends Container {
  private _status: TypeStatus = TypeStatus.RANDOM;
  private _string: string = '';
  private _fontSize = 16;
  private _fontColor = 0x000000;

  private _appManager = AppManager.instance;

  private _text: Text = new Text();
  private dispValue: string = '';
  private dispCursor: number = 0;
  private _dispCursorStep: number = 0.25;

  public constructor(text: string, fontSize: number, fontColor: number = 0x000000, dispCursorStep: number = 0.25) {
    super();

    this._string = text;
    this._fontSize = fontSize;
    this._fontColor = fontColor;
    this._dispCursorStep = dispCursorStep;

    this.init();
  }

  /**
   * Init
   */
  public init() {
    const style = new TextStyle({
      fontFamily: "Akshar Regular",
      fontWeight: '400',
      fill: this._fontColor,
      fontSize: this._fontSize,
      letterSpacing: 1.0,
      align: 'right',
    });

    this._text = new Text({
      text: this._string,
      style: style,
    });
    this.addChild(this._text);
  }

  public start(): void {
    gsap.timeline({ defaults: { delay: 0, duration: 1.0 } })
      .call(() => {
        this._status = 'toFix';
      }, [], "+=2.0");
    if (this._appManager) {
      if (this._appManager._app) {
        this._appManager._app.ticker.add(this.update);
      } else {
        throw new Error('AppManager.app is not defined');
      }
    }
  }

  public toFix(): void {
    this._status = TypeStatus.TO_FIX;
    this.dispCursor = 0;
  }

  public update = (): void => {
    this.dispValue = RandomTitleOneLine.getRandomString(this._string, Math.floor(this.dispCursor));
    this.updateText(this.dispValue);
    if (this._status === TypeStatus.TO_FIX) {
      if (Math.floor(this.dispCursor) < this._string.length) {
        this.dispCursor += this._dispCursorStep;
      } else {
        if (this._appManager._app) {
          this._appManager._app.renderer.render(this); //強制再描画
          this._appManager._app.ticker.remove(this.update);
        } else {
          throw new Error('AppManager.app is not defined');
        }
      }
    }
  };

  private updateText(str: string): void {
    // console.log(`[Title]: updateText ${str}`);
    this._text.text = str;
  }

  /**
   * ランダム文字列の生成
   * @param value 文字列
   * @param cursor ランダム文字を表示する位置
   * @returns ランダム文字を含んだ文字列
   */
  static getRandomString(value: string, cursor: number): string {
    let result: string = '';
    for (let i = 0; i < value.length; i++) {
      if (i < Math.ceil(cursor)) {
        result += value.slice(i, i + 1);
      } else {
        result += this.randomChar();
      }
    }

    return result;
  }

  static randomChar() {
    // const pool = '?/\\(^)![]abcdefghijklmnopqrstuvwxyz0123456789{}*&^%$';
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return pool.charAt(Math.floor(Math.random() * pool.length));
  };

}
