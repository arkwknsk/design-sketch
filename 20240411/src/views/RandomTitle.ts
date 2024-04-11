import gsap from 'gsap';
import { Container, Text, TextStyle } from 'pixi.js';
import { AppManager } from '../core/AppManager';
import { TypeStatus } from '../models/TypeStatus';

export class RandomTitle extends Container {
  private _status: TypeStatus = TypeStatus.RANDOM;
  private _string: string = 'DESIGN SKETCH 20240320';
  private _fontSize = 16;

  private _appManager = AppManager.instance;

  private titleTexts: Text[];
  private dispValue: string = '';
  private dispCursor: number = 0;
  private dispCursorStep: number = 0.25;

  public constructor(text: string, fontSize: number) {
    super();
    this.titleTexts = [];

    this._string = text;
    this._fontSize = fontSize;

    this.init();
  }

  /**
   * Init
   */
  public init() {
    for (let i = 0; i <= this._string.length; i++) {
      const char = this._string[i];
      const style = new TextStyle({
        fontFamily: "Akshar Regular",
        fontWeight: '400',
        fill: 0x000000,
        fontSize: this._fontSize,
        // letterSpacing: -0.25
        align: 'right',
      });
      const text = new Text({
        text: char,
        style: style,
      });
      text.x = i * this._fontSize / 2;
      this.titleTexts.push(text);
      this.addChild(text);
    }
  }

  public start(): void {
    // const tl = gsap.timeline({ defaults: { duration: 1.0, ease: "power4.out" } });
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
    // if (this._status === TypeStatus.RANDOM || this._status === TypeStatus.TO_FIX) {
    this.dispValue = RandomTitle.getRandomString(this._string, Math.floor(this.dispCursor));
    // console.log(`[Title]: dispCursor ${Math.floor(this.dispCursor)}/${this.TITLE_STRING.length} this.dispValue:${this.dispValue}`);
    this.updateText(this.dispValue);
    // };
    if (this._status === TypeStatus.TO_FIX) {
      if (Math.floor(this.dispCursor) < this._string.length) {
        this.dispCursor += this.dispCursorStep;
      } else {
        // console.log(this.dispValue);
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
    for (let i = 0; i < str.length; i++) {
      const text = this.titleTexts[i];
      const targetStr = str.slice(i, i + 1);
      if (text.text !== targetStr) {
        try {
          text.text = targetStr;
        } catch (error) {
          console.error(`[Title]: updateText error ${error}`);
        }
      }
    }
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
