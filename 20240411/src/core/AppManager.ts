import { Application, Assets, Container, Graphics } from 'pixi.js';
import Stats from 'stats.js';
import { Context } from '../Context';
import { GridAlign } from '../models/GridAlign';
import { DisplayObjectHelper } from '../utils/DisplayObjectHelper';
import { MathUtil } from '../utils/MathUtil';
import { Clock } from '../views/Clock';
import { GridView } from '../views/GridView';
import { RandomTitleOneLine } from '../views/RandomTitleOneLine';
import { ScreenHelper } from '../views/ScreenHelper';
import { TimeIndicator } from '../views/TimeIndicator';

/**
 * Main Class(Presenter)
 */
export class AppManager {
  private static _instance: AppManager | undefined;

  // View
  /**
   * GridView グリッド位置の制御
   *
   * @private
   * @type {GridView}
   * @memberof AppManager
   */
  private _gridView: GridView = new GridView();

  public _app: Application | undefined;

  /**
   * 前の時間
   * @private
   * @type {Date}
   * @memberof AppManager
   */
  private _prevTime: Date = new Date();

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

  /**
   * グリッドを描画するためのGraphics
   *
   * @private
   * @type {(Graphics | undefined)}
   * @memberof AppManager
   */
  private _grid: Graphics | undefined;

  /**
   * 乱数の分布マップのコンテナ
   *
   * @private
   * @type {Container[]}
   * @memberof AppManager
   */
  private _randomMapContainers: Container[] = [];

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

    this._gridView.divisionX = Context.GRID_DIVISIONS_X;
    this._gridView.divisionY = Context.GRID_DIVISIONS_Y;

    await this.initPIXI();

    this.initializeCanvasStyle();

    this.addRandomValues();
    this.resizeApp();
  }

  /**
   * Initialization of PIXI
   * PIXIの初期化
   * @returns {Promise<void>}
   * @memberof AppManager
   */
  private async initPIXI(): Promise<void> {
    // Applicationのインスタンスを作成
    this._app = new Application();

    await this._app.init({
      width: this._gridView.stageWidth,
      height: this._gridView.stageHeight,
      backgroundColor: 0xffffff, // Ensure this is a hexadecimal value
      antialias: true,
      autoDensity: true,
      resolution: 2,
    });

    // FPS
    this._app.ticker.maxFPS = 60;

    // 毎フレームの処理
    this._app.ticker.add(() => {
      this.update();
    });

    // Pixi.jsの描画canvasをDOMに追加
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
    // web font のロード
    const font = loadScreenAssets.akshar;
    await font.load();
    document.fonts.add(font);

    this._background = new Container();
    this._app.stage.addChild(this._background);
    this._grid = new Graphics();
    ScreenHelper.GetLayoutGrid(this._grid, this._gridView, 0x66aaFF);
    this._grid.x = 0;
    this._grid.y = 0;
    this._background.addChild(this._grid);
    this._background.alpha = 0.25;

    this._mainStage = new Graphics();
    this._app.stage.addChild(this._mainStage);

    const title = new RandomTitleOneLine(Context.CODE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(title);
    this._gridView.addAnchor(title, 1, 1, GridAlign.TOP_LEFT);
    title.start();

    const techTitle = new RandomTitleOneLine(Context.TECH_TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(techTitle);
    this._gridView.addAnchor(techTitle, 11, 1, GridAlign.TOP_LEFT);
    techTitle.start();

    const subTitle = new RandomTitleOneLine(Context.TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(subTitle);
    this._gridView.addAnchor(subTitle, this._gridView.divisionX - 1, 1, GridAlign.TOP_RIGHT);
    subTitle.start();

    const timeIndicator = new TimeIndicator(new Date());
    this._mainStage.addChild(timeIndicator);
    this._gridView.addAnchor(timeIndicator, 1, this._gridView.divisionY - 1, GridAlign.BOTTOM_LEFT);
    this._app.ticker.add(timeIndicator.update);

    const clock = new Clock();
    this._mainStage.addChild(clock);
    this._gridView.addAnchor(clock, this._gridView.divisionX - 1, this._gridView.divisionY - 1, GridAlign.BOTTOM_RIGHT);
    this._app.ticker.add(clock.update);

  }

  /**
   * 乱数の分布マップの生成と追加
   * @returns
   * @memberof AppManager
   */
  private addRandomValues() {
    const timestamp = new Date();
    const { cryptoRandomValues, suspectedRandomValues } = this.createRandomValues();
    this.createDistributionMap(cryptoRandomValues, suspectedRandomValues, timestamp);
  }

  /**
   * 乱数を生成
   * @returns 
   */
  private createRandomValues() {
    let cryptoRandomValues: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const cryptoRandomValue = MathUtil.getRandomFloat(0, 1);
      cryptoRandomValues.push(cryptoRandomValue);
    }

    let suspectedRandomValues: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const suspectedRandomValue = Math.random();
      suspectedRandomValues.push(suspectedRandomValue);
    }

    return { cryptoRandomValues, suspectedRandomValues };
  }

  /**
   * 乱数の頻出度を計算
   * @param values 乱数
   * @returns 
   */
  private calculateValueFrequencies(values: number[]): Record<string, number> {
    // 値の整数部分の頻出度を計算
    const frequencies = values.reduce((acc: Record<number, number>, value) => {
      const intValue = Math.floor(value);
      acc[intValue] = (acc[intValue] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const maxFrequency = Math.max(...Object.values(frequencies));
    const minFrequency = Math.min(...Object.values(frequencies));

    // 分母が0になる場合（すべての値が同じバケットに分類される場合）、正規化せずに1を設定
    if (maxFrequency - minFrequency === 0) {
      return Object.keys(frequencies).reduce((acc: Record<string, number>, key) => {
        acc[key] = 1; // すべての頻度を1に設定
        return acc;
      }, {} as Record<string, number>);
    } else {
      // バケットの頻度を0〜1に正規化
      const normalizedFrequencies = Object.keys(frequencies).reduce((acc: Record<string, number>, key) => {
        const normalized = (frequencies[Number(key)] - minFrequency) / (maxFrequency - minFrequency);
        acc[key] = normalized;
        return acc;
      }, {} as Record<string, number>);

      return normalizedFrequencies;
    }
  }

  /**
   * 乱数の分布マップを描画
   * @param cryptoRandomValues 
   * @param suspectedRandomValues 
   * @param timestamp 
   */
  private createDistributionMap(cryptoRandomValues: number[], suspectedRandomValues: number[], timestamp: Date) {
    const width = Context.STAGE_WIDTH - this._gridView.unitWidth * 2;
    const reCryptoValues = cryptoRandomValues.map(value => value * width);
    const reSuspectedValues = suspectedRandomValues.map(value => value * width);

    const reCryptoValueFrequencies = this.calculateValueFrequencies(reCryptoValues);
    const reSuspectedValueFrequencies = this.calculateValueFrequencies(reSuspectedValues);

    const createGraphics = (frequencies: Record<string, number>) => {
      const graphics = new Graphics();
      Object.entries(frequencies).forEach(([value, frequency]) => {
        graphics.rect(Number(value), 0, 1, this._gridView.unitHeight);
        graphics.fill({ color: Context.TITLE_COLOR, alpha: frequency });
      });
      return graphics;
    };

    const reCryptoGraphics = createGraphics(reCryptoValueFrequencies);
    const reSuspectedGraphics = createGraphics(reSuspectedValueFrequencies);

    if (this._mainStage) {
      const container = new Container();
      const timestampText = DisplayObjectHelper.getText(timestamp.
        toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '-').replace(' ', ' ').replace(/:/g, ':')
        .toString(), 'Akshar Regular', 10, Context.TITLE_COLOR, 0.5);
      container.addChild(timestampText);
      timestampText.y = this._gridView.unitHeight * 0 + this._gridView.unitHeight * 0.40;
      container.addChild(reCryptoGraphics);
      reCryptoGraphics.y = this._gridView.unitHeight * 1;
      container.addChild(reSuspectedGraphics);
      reSuspectedGraphics.y = this._gridView.unitHeight * 2;
      this._mainStage.addChild(container);
      this._gridView.addAnchor(container, 1, this._randomMapContainers.length * 3 + 2, GridAlign.TOP_LEFT);

      this._randomMapContainers.push(container);
    }
  }

  update(): void {
    this._stats.begin();

    const now = new Date();

    const prevSeconds = this._prevTime.getSeconds();
    const currentSeconds = now.getSeconds();


    if (Math.abs(currentSeconds - prevSeconds) >= 1) {
      this._prevTime = now;
      if (this._randomMapContainers.length < 10) {
        this.addRandomValues();
        this._gridView.updateAnchorPositions();
      }
    }

    this._stats.end();
  }

  private resizeApp(): void {
    if (!this._app) return;

    // マージンを考慮したウィンドウの利用可能な幅と高さを計算
    // const windowWidth: number = this.getWindowWidth(Context.MARGIN);
    // const windowHeight: number = this.getWindowHeight(Context.MARGIN);
    const windowWidth: number = Context.STAGE_WIDTH;
    const windowHeight: number = Context.STAGE_HEIGHT;

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
      ScreenHelper.GetLayoutGrid(this._grid, this._gridView, 0x66aaFF);
    }

  }

  private updateGridView(stageWidth: number, stageHeight: number) {
    this._gridView.stageWidth = stageWidth;
    this._gridView.stageHeight = stageHeight;
  }

  // private getWindowHeight(margin: number): number {
  //   return window.innerHeight - margin * 2;
  // }

  // private getWindowWidth(margin: number): number {
  //   return window.innerWidth - margin * 2;
  // }
}
