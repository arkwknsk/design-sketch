export class Context {
  private static _instance: Context;

  public static CODE = 'DESIGN SKETCH 20240411';
  public static TECH_TITLE = 'Crypto / Suspected';
  public static TITLE = 'A few things about random numbers';
  public static TITLE_COLOR = 0x001f3f;

  public static STAGE_WIDTH: number = 760;
  public static STAGE_HEIGHT: number = 760;
  public static STAGE_ASPECT: number = 1 / 1;

  public static MARGIN: number = 24;

  public static GRID_DIVISIONS_X: number = 30;
  public static GRID_DIVISIONS_Y: number = 34;


  /**
   * getInstance
   */
  public static get instance(): Context {
    if (!this._instance) this._instance = new Context();




    return this._instance;
  }

  private constructor() { }
}
