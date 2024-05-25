export class Context {
  private static _instance: Context;

  public static TITLE = 'Mark of wind';
  public static TITLE_COLOR = 0xccddff;
  public static BACKGROUND_COLOR = 0x1c171d;

  public static STAGE_WIDTH: number = 760;
  public static STAGE_HEIGHT: number = 760;
  public static STAGE_ASPECT: number = 1 / 1;

  public static MARGIN: number = 24;

  public static GRID_DIVISIONS_X: number = 18;
  public static GRID_DIVISIONS_Y: number = 16;


  /**
   * getInstance
   */
  public static get instance(): Context {
    if (!this._instance) this._instance = new Context();




    return this._instance;
  }

  private constructor() { }
}
