import { Application, Assets, Container, Graphics, Text } from 'pixi.js';
import noise from "simplenoise";
import Stats from 'stats.js';
import * as THREE from 'three';
import { Pane } from "tweakpane";
import { Context } from '../Context';
import { GridAlign } from '../models/GridAlign';
import { DisplayObjectHelper } from '../utils/DisplayObjectHelper';
import { DayBundle } from '../views/DayBundle';
import { GridView } from '../views/GridView';
import { RandomTitleOneLine } from '../views/RandomTitleOneLine';
import { ScreenHelper } from '../views/ScreenHelper';

interface CityPopulationData {
    Index: number;
    "Country Code": number;
    "Country or area": string;
    "City Code": number;
    "Urban Agglomeration": string;
    Note: number;
    Latitude: number;
    Longitude: number;
    [year: string]: number | string; // 年と人口のデータは動的なキーを持つため、インデックスシグネチャを使用
}

/**
 * Main Class(Presenter)
 */
export class AppManager {
  private static _instance: AppManager | undefined;

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

  private _cityPopulationData: CityPopulationData[] = [];

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

  private _disks: DayBundle[][] = Array.from({ length: Context.GRID_DIVISIONS_X }, () => []);

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
    canvasStyle.boxSizing = 'border-box'; // マージン含めたサイズ計算のため
  }

  /**
   * 初期化設定
   */
  public async init(): Promise<void> {
    this._stats.showPanel(0);
    document.body.appendChild(this._stats.dom);

    this.initDebugPanel();

    // ウィンドウのリサイズイベントとロードイベントにresizeAppメソッドをバインド
    window.addEventListener('resize', this.resizeApp.bind(this));
    window.addEventListener('load', this.resizeApp.bind(this));

    this._gridView.divisionX = Context.GRID_DIVISIONS_X;
    this._gridView.divisionY = Context.GRID_DIVISIONS_Y;

    await this.initPIXI();

    this.initializeCanvasStyle();

    this._cityPopulationData = await fetchCityPopulationData('./json/megacities_data.json');
    console.log(`[AppManager] cities count: ${this._cityPopulationData.length}`);
    this.initThree();
    this.resizeApp();

    noise.seed(new Date('2024-04-01 00:00:00').getTime());
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
      backgroundColor: Context.BACKGROUND_COLOR, // Ensure this is a hexadecimal value
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

    this._recordDateText = DisplayObjectHelper.getText('2020', "Akshar Regular", 14, Context.TITLE_COLOR);
    this._mainStage.addChild(this._recordDateText);
    this._gridView.addAnchor(this._recordDateText, this._gridView.divisionX - 1, this._gridView.divisionY - 1, GridAlign.TOP_RIGHT);

    this.updateText();
  }

  private initThree() {
    const size = { width: Context.STAGE_WIDTH, height: Context.STAGE_HEIGHT };
    const scene = new THREE.Scene();
    // 座標軸を表示
    // const axes = new THREE.AxesHelper(32);
    // scene.add(axes);

    const camera = new THREE.PerspectiveCamera(
      45,
      size.width / size.height,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true});
    renderer.setSize(size.width, size.height);
    renderer.setClearColor(0x000000, 0);
    // document.body.appendChild(renderer.domElement);

    const main = document.getElementById('three-container');
    if (main) {
      main.appendChild(renderer.domElement as HTMLCanvasElement);
      console.log('[Main]: Added PIXI');

    }

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: "gray", transparent: true, opacity: 0 });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    const radius = 0.015;
    const radialSegments = 6;
  for (let i = 0; i < this._cityPopulationData.length; i++) {
      const current = this._cityPopulationData[i];
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.32*6.4, radialSegments, radialSegments),
        new THREE.MeshPhongMaterial({ color: "white", transparent: false, opacity: 0.8 })
      );

      const verticalAngle = current.Longitude * (Math.PI / 180); // lng
      const horizontalAngle = current.Latitude * (Math.PI / 180); // lat
      this.setPosition(cylinder, globe, verticalAngle, horizontalAngle);
    }

    // const cylinder = new THREE.Mesh(
    //   new THREE.CylinderGeometry(0.025, 0.025, 0.5, 32, 32),
    //   new THREE.MeshPhongMaterial({ color: "red" })
    // );
    // const verticalAngle2 = 141.1519253 * (Math.PI / 180); // Convert degrees to radians
    // const horizontalAngle2 = 39.7020449 * (Math.PI / 180); // Convert degrees to radians
    // this.setPosition(cylinder, globe, verticalAngle2, horizontalAngle2);

    // const cylinder2 = new THREE.Mesh(
    //   new THREE.CylinderGeometry(0.025, 0.025, 0.5, 32, 32),
    //   new THREE.MeshPhongMaterial({ color: "blue" })
    // );
    // this.setPosition(cylinder2, globe, 90 * (Math.PI / 180), 0 * (Math.PI / 180));


    camera.position.z = 7;
    const directionalLight = new THREE.DirectionalLight("gray", 0.75);
    directionalLight.position.set(1, 1, 7);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight("gray",1);
    scene.add(ambientLight);

    const animate = () => {
      requestAnimationFrame(animate);
      // globe.rotation.x += 0.01;
      globe.rotation.y += 0.0025;
      renderer.render(scene, camera);
    };
    animate();
  }

  private setPosition(target: THREE.Mesh, globe: THREE.Mesh, verticalAngle: number, horizontalAngle: number) {

    const radius = 1.05; // The radius of the cube (sphere) is 1
    const x = radius * Math.sin(verticalAngle) * Math.cos(horizontalAngle);
    const y = radius * Math.sin(verticalAngle) * Math.sin(horizontalAngle);
    const z = radius * Math.cos(verticalAngle);
    target.position.set(x, y, z);

    // Look at the center of the sphere
    target.lookAt(new THREE.Vector3(0, 0, 0));

    // Adjust the rotation to make the Y-axis point towards the center
    target.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    // cylinder.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);

    globe.add(target);
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

    const now = new Date();

    const prevSeconds = this._prevTime.getSeconds();
    const currentSeconds = now.getSeconds();

    if (Math.abs(currentSeconds - prevSeconds) >= 3) {
    }


    this._stats.end();
  }

  private updateText(): void {
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

// JSONデータをフェッチしてパースする例
async function fetchCityPopulationData(url: string): Promise<CityPopulationData[]> {
    const response = await fetch(url);
    const data: CityPopulationData[] = await response.json();
    return data;
}
