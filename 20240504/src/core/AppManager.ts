import { Application, Assets, Container, Graphics, Text } from 'pixi.js';
import noise from "simplenoise";
import Stats from 'stats.js';
import { Pane } from "tweakpane";
import { Context } from '../Context';
import weatherData from '../data.json';
import { GridAlign } from '../models/GridAlign';
import { DisplayObjectHelper } from '../utils/DisplayObjectHelper';
import { TimeUtil } from '../utils/TimeUtil';
import { Bar } from '../views/Bar';
import { GridView } from '../views/GridView';
import { RandomTitleOneLine } from '../views/RandomTitleOneLine';
import { ScreenHelper } from '../views/ScreenHelper';

/*
  https://www.data.jma.go.jp/risk/obsdl/index.php
*/

interface WeatherData {
  datetime: Date; // Changed to accept Date type
  wind_speed: number;
  wind_direction: string;
  sunshine_duration: number;
  weather: number;
  cloud_cover_tenths: number;
  visibility: number;
  temperature: number;
  precipitation: number;
  snowfall: number;
  snow_depth: number;
  sea_level_pressure: number;
  station_pressure: number;
  solar_radiation: number;
  wind_direction_angle: number;
}

interface WeatherDataContainer {
  data: WeatherData[];
}


/**
 * Main Class(Presenter)
 */
export class AppManager {
  private static _instance: AppManager | undefined;

  private degToRad = (deg: number): number => {
    return deg * (Math.PI / 180.0);
  };

  /**
   * 気象データ
   *
   * @private
   * @type {WeatherDataContainer}
   * @memberof AppManager
   */
  private _weatherData: WeatherData[] = this.convertWeatherData(weatherData).data;

  /**
   * 現在表示している気象データのインデックス
   *
   * @private
   * @type {number}
   * @memberof AppManager
   */
  private _weatherDataIndex: number = 0;

  private _currentWeatherData: WeatherData = this._weatherData[this._weatherDataIndex];

  private _targetDegree: number[][] = Array.from({ length: Context.GRID_DIVISIONS_X }, () =>
    Array(Context.GRID_DIVISIONS_Y).fill(this._currentWeatherData.wind_direction_angle));
  private _targetRad: number[][] = Array.from({ length: Context.GRID_DIVISIONS_X }, () =>
    Array(Context.GRID_DIVISIONS_Y).fill(this.degToRad(this._currentWeatherData.wind_direction_angle)));
  private _currentFrequency: number = this._currentWeatherData.wind_speed;
  private _currentAmplitude: number = this._currentWeatherData.wind_speed;

  // View
  public _app: Application | undefined;

  /**
   * GridView グリッド位置の制御
   *
   * @private
   * @type {GridView}
   * @memberof AppManager
   */
  private _gridView: GridView = new GridView();

  /**
   * Disk配置のオフセット
   *
   * @private
   * @memberof AppManager
   */
  private _cOffset = 2;
  private _rOffset = 2;

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

  private _disks: Bar[][] = Array.from({ length: Context.GRID_DIVISIONS_X }, () => []);

  private _recordDateText: Text | undefined;
  private _windSpeedText: Text | undefined;
  private _windDirectionText: Text | undefined;

  /**
   * Debug系
   *
   */
  private _stats: Stats = new Stats();

  static PARAMS_GENERAL = {
    degree: 0,
    speed: 0,
    n: 0,
    targetDeg: 0,
    currentDeg: 0,
  };

  static PARAMS_NOISE = {
    period: 2.50,
    time: 6770,
    frequency: 4.2,
    amplitude: 0.2,
    scale: 0.15,
    offset: 1.0,
  };


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

    AppManager.PARAMS_GENERAL.degree = this._currentWeatherData.wind_direction_angle;

    this.initDebugPanel();

    // ウィンドウのリサイズイベントとロードイベントにresizeAppメソッドをバインド
    window.addEventListener('resize', this.resizeApp.bind(this));
    window.addEventListener('load', this.resizeApp.bind(this));

    this._gridView.divisionX = Context.GRID_DIVISIONS_X;
    this._gridView.divisionY = Context.GRID_DIVISIONS_Y;

    // const corePath = '../ffmpeg/ffmpeg-core.js';
    // const ffmpeg: FFmpeg = createFFmpeg({ corePath, log: true });

    await this.initPIXI();
    this.setInitialDegree();

    this.initializeCanvasStyle();
    this.resizeApp();

    noise.seed(new Date('2024-05-01 00:00:00').getTime());
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

    const title = new RandomTitleOneLine(import.meta.env.VITE_APP_TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(title);
    this._gridView.addAnchor(title, 1, 1, GridAlign.BOTTOM_LEFT);
    title.start();

    const subTitle = new RandomTitleOneLine(Context.TITLE, 14, Context.TITLE_COLOR);
    this._mainStage.addChild(subTitle);
    this._gridView.addAnchor(subTitle, this._gridView.divisionX - 1, 1, GridAlign.BOTTOM_RIGHT);
    subTitle.start();

    this._recordDateText = DisplayObjectHelper.getText('', "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(this._recordDateText);
    this._gridView.addAnchor(this._recordDateText, 1, this._gridView.divisionY - 1, GridAlign.TOP_LEFT);

    this._windDirectionText = DisplayObjectHelper.getText('Wind: Direction: none', "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(this._windDirectionText);
    this._gridView.addAnchor(this._windDirectionText, 6, this._gridView.divisionY - 1, GridAlign.TOP_LEFT);

    this._windSpeedText = DisplayObjectHelper.getText(`Speed: none`, "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(this._windSpeedText);
    this._gridView.addAnchor(this._windSpeedText, 12, this._gridView.divisionY - 1, GridAlign.TOP_RIGHT);

    const place = DisplayObjectHelper.getText(`Morioka, Iwate, Japan`, "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(place);
    place.angle = 270;
    place.pivot.set(-20, 12);
    this._gridView.addAnchor(place, 1, this._gridView.divisionY / 2 + 1, GridAlign.TOP_LEFT);

    const latLng = DisplayObjectHelper.getText(`39.6983596° N, 141.1659834° E`, "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(latLng);
    latLng.angle = 270;
    latLng.pivot.set(10, -10);
    this._gridView.addAnchor(latLng, this._gridView.divisionX + 2, this._gridView.divisionY / 2 + 1, GridAlign.TOP_RIGHT);

    this.updateText();

    for (let c = 0; c < Context.GRID_DIVISIONS_X - this._cOffset * 2 + 1; c++) {
      for (let r = 0; r < Context.GRID_DIVISIONS_Y - this._rOffset * 2 + 1; r++) {
        const disk = new Bar();
        this._mainStage.addChild(disk);
        this._gridView.addAnchor(disk, c + this._cOffset, r + this._rOffset, GridAlign.TOP_LEFT);
        this._mainStage.addChild(disk);
        this._disks[c].push(disk);
      }
    }

    for (let i = 0; i < this._disks.length; i++) {
      for (let j = 0; j < this._disks[i].length; j++) {
        this._targetRad[i][j] = this.degToRad(this._currentWeatherData.wind_direction_angle);
        this._disks[i][j].rotation = this.degToRad(this._currentWeatherData.wind_direction_angle);
      }
    }


  }

  private initDebugPanel = (): void => {
    const pane = new Pane();

    const generalPane = pane.addFolder({
      title: 'General',
    });
    generalPane.addBinding(AppManager.PARAMS_GENERAL, 'degree', {
      min: 0.0,
      max: 360.0,
      step: 19,
      readonly: true,
    });
    generalPane.addBinding(AppManager.PARAMS_GENERAL, 'speed', {
      readonly: true,
    });
    generalPane.addBinding(AppManager.PARAMS_GENERAL, 'n', {
      readonly: true,
      view: 'graph',
      min: -1,
      max: +1,
    });

    const noisePane = pane.addFolder({
      title: 'Noise',
    });
    noisePane.addBinding(AppManager.PARAMS_NOISE, 'frequency', {
      readonly: true,
    });
    noisePane.addBinding(AppManager.PARAMS_NOISE, 'amplitude', {
      readonly: true,
    });

    noisePane.addBinding(AppManager.PARAMS_NOISE, 'time', {
      min: 100.0,
      max: 10000,
      step: 0.1,
    });
    noisePane.addBinding(AppManager.PARAMS_NOISE, 'scale', {
      readonly: true,
    });
  };

  update(): void {
    this._stats.begin();

    const time = Date.now() / AppManager.PARAMS_NOISE.time;

    const now = new Date();

    const prevSeconds = this._prevTime.getSeconds();
    const currentSeconds = now.getSeconds();

    if (Math.abs(currentSeconds - prevSeconds) >= 3) {
      this._weatherDataIndex = (this._weatherDataIndex + 1) % this._weatherData.length;
      this._prevTime = now;

      this._currentWeatherData = this._weatherData[this._weatherDataIndex];
      AppManager.PARAMS_GENERAL.degree = this._currentWeatherData.wind_direction_angle;
      AppManager.PARAMS_GENERAL.speed = this._currentWeatherData.wind_speed;
      this.updateText();
    }

    this._currentFrequency = Math.floor((this._currentWeatherData.wind_speed * 0.8) * 10) / 10;
    this._currentAmplitude = 0.1;
    AppManager.PARAMS_NOISE.frequency = this._currentFrequency;
    AppManager.PARAMS_NOISE.amplitude = this._currentAmplitude;
    AppManager.PARAMS_NOISE.scale = (this._currentWeatherData.wind_speed * .06);

    for (let i = 0; i < this._disks.length; i++) {
      for (let j = 0; j < this._disks[i].length; j++) {

        const px = j / this._disks.length * AppManager.PARAMS_NOISE.scale + time;
        const py = i / this._disks[i].length * AppManager.PARAMS_NOISE.scale;

        const n = noise.perlin2(px * this._currentFrequency, py * this._currentFrequency) * this._currentAmplitude;
        this._targetRad[i][j] = 2 * Math.PI * n + this.degToRad(this._currentWeatherData.wind_direction_angle);

        let diff = (this._targetRad[i][j] - this._disks[i][j].rotation);

        if (diff > Math.PI) {
          diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
          diff += 2 * Math.PI;
        }
        const rotationAmount: number = diff * 0.05;

        this._disks[i][j].rotation += rotationAmount;

        if (i === 0 && j === 0) {
          AppManager.PARAMS_GENERAL.n = n;
        }
      }
    }

    this._stats.end();
  }

  private setInitialDegree(): void {
    const cOffset = 2;
    const rOffset = 2;
    for (let i = 0; i < Context.GRID_DIVISIONS_X - 1 - cOffset * 2; i++) {
      for (let j = 0; j < Context.GRID_DIVISIONS_Y - 1 - rOffset * 2; j++) {
        this._targetDegree[i][j] = this._currentWeatherData.wind_direction_angle;
        this._disks[i][j].angle = this._targetDegree[i][j];
      }
    }
  }

  private updateText(): void {
    if (this._recordDateText) this._recordDateText.text = TimeUtil.getTimestampShort(this._currentWeatherData.datetime);
    const windDirection = this._currentWeatherData.wind_direction.replace(/北/g, 'N').replace(/東/g, 'E').replace(/南/g, 'S').replace(/西/g, 'W');
    if (this._windDirectionText) this._windDirectionText.text = `Wind Direction: ${windDirection}`;
    if (this._windSpeedText) this._windSpeedText.text = `Speed: ${this._currentWeatherData.wind_speed} m/s`;
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

  /**
   * data.jsonのdatetimeプロパティをDate型に変換する関数
   *
   * @memberof AppManager
   */

  private convertWeatherData(data: any): WeatherDataContainer {
    return {
      data: data.data.map((item: any) => ({
        ...item,
        datetime: new Date(item.datetime)
      }))
    };
  }

}
