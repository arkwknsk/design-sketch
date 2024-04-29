export class Context {
  private static _instance: Context;

  public static TITLE = 'Mark of wind';
  public static TITLE_COLOR = 0x001f3f;

  public static STAGE_WIDTH: number = 760;
  public static STAGE_HEIGHT: number = 760;
  public static STAGE_ASPECT: number = 1 / 1;

  public static MARGIN: number = 24;

  public static GRID_DIVISIONS_X: number = 13;
  public static GRID_DIVISIONS_Y: number = 13;


  /**
   * getInstance
   */
  public static get instance(): Context {
    if (!this._instance) this._instance = new Context();




    return this._instance;
  }

  private constructor() { }
}
