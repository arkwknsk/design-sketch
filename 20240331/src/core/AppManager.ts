import gsap from 'gsap';
import { Application, Assets, Container, Graphics } from 'pixi.js';
import Stats from 'stats.js';
import { Context } from '../Context';
import { GridAlign } from '../models/GridAlign';
import { Clock } from '../views/Clock';
import { GridView } from '../views/GridView';
import { RandomTitleOneLine } from '../views/RandomTitleOneLine';
import { RandomValueContainer } from '../views/RandomValueContainer';
import { ScreenHelper } from '../views/ScreenHelper';
import { TimeIndicator } from '../views/TimeIndicator';

/**
 * Main Class(Presenter)
 */
export class AppManager {
  private static _instance: AppManager | undefined;

  // Model
  private _gridModel: GridView = new GridView();

  public _app: Application | undefined;

  /**
   * 描画領域のアスペクト比
   *
   * @private
   * @type {number}
   * @memberof AppManager
   */
  private _aspectRatio: number = Context.STAGE_ASPECT;

  /**
   * Sprite系
   */
  private _mainStage: Graphics | undefined;
  private _background: Container | undefined;

  private _grid: Graphics | undefined;
  private _randomValueContainers: RandomValueContainer[] | undefined;


  /**
   *　演出のメインタイムライン
   *
   * @private
   * @type {(gsap.core.Timeline | undefined)}
   * @memberof AppManager
   */
  private _mainTimeline: gsap.core.Timeline | undefined;

  /**
   * Debug系
   *
   */
  private _stats: Stats = new Stats();

  /**
   * getInstance
   */
  public static get instance(): AppManager {
    if (!this._instance) this._instance = new AppManager();

    return this._instance;
  }

  /**
   * Constructor
   */
  private constructor() { }

  /**
   * Canvasのスタイルの初期設定
   * 
   */
  private initializeCanvasStyle(): void {
    if (!this._app || !this._app.canvas) return;

    const canvasStyle = this._app.canvas.style;
    canvasStyle.margin = 'auto';
    canvasStyle.display = 'block';
    canvasStyle.boxSizing = 'border-box'; // マージンを含めたサイズ計算のため
  }

  /**
   * 初期化設定
   */
  public async init(): Promise<void> {
    this._stats.showPanel(0);
    document.body.appendChild(this._stats.dom);

    /*
    const pane = new Pane();
    const PARAMS = {
      ratio: Context.STAGE_ASPECT,
    };
    pane.addBinding(PARAMS, 'ratio', {
      options: {
        '1:1': 1,
        '4:3': 4 / 3,
        '16:9': 16 / 9,
      },
    }).on('change', (event) => {
      this._aspectRatio = event.value;
      this.resizeApp();
    });
    */
    // ウィンドウのリサイズイベントとロードイベントにresizeAppメソッドをバインド
    window.addEventListener('resize', this.resizeApp.bind(this));
    window.addEventListener('load', this.resizeApp.bind(this));

    this._gridModel.divisionX = Context.GRID_DIVISIONS_X;
    this._gridModel.divisionY = Context.GRID_DIVISIONS_Y;

    await this.initPIXI();

    this.initializeCanvasStyle();

    this.resizeApp();
  }

  /**
   * Initialization of PIXI
   * PIXIの初期化
   */
  private async initPIXI(): Promise<void> {
    // Applicationのインスタンスを作成
    this._app = new Application();

    await this._app.init({
      width: this._gridModel.stageWidth,
      height: this._gridModel.stageHeight,
      backgroundColor: 0xffffff, // Ensure this is a hexadecimal value
      antialias: true,
      autoDensity: true,
      resolution: 2,
    });

    // FPS
    this._app.ticker.maxFPS = 60;

    this._app.ticker.add(() => {
      this.update();
    });

    const main = document.getElementById('app-container');
    if (main) {
      main.appendChild(this._app.canvas as HTMLCanvasElement);
      console.log('[Main]: Added PIXI');
      this._app.stage.sortableChildren = true;

    }

    const manifest = {
      bundles: [
        {
          name: 'ui',
          assets: [
            {
              alias: 'akshar',
              src: 'font/Akshar-Regular.ttf'
            },
          ],
        },
      ],
    };
    //アセットのロード
    Assets.init({ manifest });
    await Assets.backgroundLoadBundle('ui');

    const loadScreenAssets = await Assets.loadBundle('ui');
    const font = loadScreenAssets.akshar;
    await font.load();
    document.fonts.add(font);

    this._background = new Container();
    this._app.stage.addChild(this._background);
    this._grid = new Graphics();
    ScreenHelper.GetLayoutGrid(this._grid, this._gridModel, 0x66aaFF);
    this._grid.x = 0;
    this._grid.y = 0;
    this._background.addChild(this._grid);
    this._background.alpha = 0.25;

    this._mainStage = new Graphics();
    this._app.stage.addChild(this._mainStage);

    const title = new RandomTitleOneLine(Context.CODE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(title);
    this._gridModel.addAnchor(title, 1, 1, GridAlign.TOP_LEFT);
    title.start();

    const techTitle = new RandomTitleOneLine(Context.TECH_TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(techTitle);
    this._gridModel.addAnchor(techTitle, 11, 1, GridAlign.TOP_LEFT);
    techTitle.start();

    const subTitle = new RandomTitleOneLine(Context.TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(subTitle);
    this._gridModel.addAnchor(subTitle, this._gridModel.divisionX - 1, 1, GridAlign.TOP_RIGHT);
    subTitle.start();

    const timeIndicator = new TimeIndicator(new Date());
    this._mainStage.addChild(timeIndicator);
    this._gridModel.addAnchor(timeIndicator, 1, this._gridModel.divisionY - 1, GridAlign.BOTTOM_LEFT);
    this._app.ticker.add(timeIndicator.update);

    const clock = new Clock();
    this._mainStage.addChild(clock);
    this._gridModel.addAnchor(clock, this._gridModel.divisionX - 1, this._gridModel.divisionY - 1, GridAlign.BOTTOM_RIGHT);
    this._app.ticker.add(clock.update);

    this.createRandomValueContainers();

  }

  private createRandomValueContainers() {
    if (!this._mainStage) return;
    const cols = 3;
    const rows = 6;
    const marginX = 1;
    const marginY = 3;
    this._randomValueContainers = [];
    this._mainTimeline = gsap.timeline({ defaults: { duration: 1.0, ease: "none" } });
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const randomValue = new RandomValueContainer(this._gridModel.unitHeight / 2);
        this._mainStage.addChild(randomValue);
        this._gridModel.addAnchor(randomValue, marginX + c * 10, marginY + r * 4, GridAlign.TOP_LEFT);
        this._mainTimeline.call(() => {
          randomValue.populateContent();
        }, [], (c === 0 && r === 0 ? "+=1.0" : "+=1.0"));
        this._randomValueContainers.push(randomValue);
      }
    }

    this._mainTimeline.to(this._randomValueContainers, {
      alpha: 0,
      stagger: {
        each: 0.4,
        grid: [cols, rows],
        from: "start",
        axis: "y" // Updated based on lint context
      },
      delay: 2.0,
      duration: 0.5,
      onComplete: () => {
        this._randomValueContainers?.forEach(container => { // Updated based on lint context
          this._gridModel.removeAnchor(container);
          this._mainStage?.removeChild(container); // Updated based on lint context
        });
        this._randomValueContainers = [];
      }
    }, "+=1.0").call(() => {
      this.createRandomValueContainers();
    }, [], "+=0");

    this._gridModel.updateAnchorPositions();
  }

  update(): void {
    this._stats.begin();

    // const now = new Date();

    this._stats.end();
  }

  private resizeApp(): void {
    if (!this._app) return;

    // マージンを考慮したウィンドウの利用可能な幅と高さを計算
    const windowWidth: number = this.getWindowWidth(Context.MARGIN);
    const windowHeight: number = this.getWindowHeight(Context.MARGIN);

    let newWidth: number = windowWidth;
    let newHeight: number = windowWidth / this._aspectRatio;

    // ウィンドウの高さに基づいて調整が必要な場合
    if (newHeight > windowHeight) {
      newHeight = windowHeight;
      newWidth = windowHeight * this._aspectRatio;
    }

    this.updateGridView(newWidth, newHeight);

    // PixiJSのCanvasの描画サイズを更新
    if (this._app.renderer)
      this._app.renderer.resize(newWidth, newHeight);

    // グリッドの描画を更新
    if (this._grid) {
      ScreenHelper.GetLayoutGrid(this._grid, this._gridModel, 0x66aaFF);
    }

  }

  private updateGridView(stageWidth: number, stageHeight: number) {
    this._gridModel.stageWidth = stageWidth;
    this._gridModel.stageHeight = stageHeight;
  }

  private getWindowHeight(margin: number): number {
    return window.innerHeight - margin * 2;
  }

  private getWindowWidth(margin: number): number {
    return window.innerWidth - margin * 2;
  }
}
