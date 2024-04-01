export class Context {
  private static _instance: Context;

  public static CODE = 'DESIGN SKETCH 20240331';
  public static TECH_TITLE = 'Web Cryptography API window.crypto';
  public static TITLE = 'A few things about random numbers';
  public static TITLE_COLOR = 0x001f3f;

  // public static STAGE_WIDTH: number = 1920;
  // public static STAGE_HEIGHT: number = 1080;
  public static STAGE_ASPECT: number = 1 / 1;

  public static MARGIN: number = 24;

  public static GRID_DIVISIONS_X: number = 30;
  public static GRID_DIVISIONS_Y: number = 28;


  /**
   * getInstance
   */
  public static get instance(): Context {
    if (!this._instance) this._instance = new Context();

    return this._instance;
  }

  private constructor() { }
}
