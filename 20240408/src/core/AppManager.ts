import Matter from 'matter-js';
import { Application, Assets, Container, Graphics } from 'pixi.js';
import Stats from 'stats.js';
import { Context } from '../Context';
import { GridAlign } from '../models/GridAlign';
import { Clock } from '../views/Clock';
import { GridView } from '../views/GridView';
import { RandomTitleOneLine } from '../views/RandomTitleOneLine';
import { ScreenHelper } from '../views/ScreenHelper';
import { TimeDisk } from '../views/TimeDisk';
import { TimeIndicator } from '../views/TimeIndicator';

/**
 * Main Class(Presenter)
 */
export class AppManager {
  private static _instance: AppManager | undefined;

  // Model
  private _gridModel: GridView = new GridView();

  public _app: Application | undefined;

  private _prevTime: Date = new Date();

  /**
   * 描画領域のアスペクト比
   *
   * @private
   * @type {number}
   * @memberof AppManager
   */
  private _aspectRatio: number = Context.STAGE_ASPECT;

  private _sideWallWidth: number = 10;

  private _engine: Matter.Engine;
  private _world: Matter.World;

  /**
   * Sprite系
   */
  private _mainStage: Graphics | undefined;
  private _background: Container | undefined;
  private _uiStage: Container | undefined;

  private _grid: Graphics | undefined;

  private _timeDisks: TimeDisk[] = [];
  private _timeDiskBodies: Matter.Body[] = [];

  private _leftGround: Matter.Body | undefined;
  private _rightGround: Matter.Body | undefined;
  private _leftWall: Matter.Body | undefined;
  private _rightWall: Matter.Body | undefined;

  /**
   *　演出のメインタイムライン
   *
   * @private
   * @type {(gsap.core.Timeline | undefined)}
   * @memberof AppManager
   */

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
  private constructor() {
    this._engine = Matter.Engine.create({
      gravity: {
        x: 0, // 水平方向の重力、0は重力なしを意味する
        y: 1, // 垂直方向の重力、1は標準の地球の重力を意味する
        scale: 0.001 // 重力のスケール、値を小さくすると重力の影響が減少
      }
    });
    this._world = this._engine.world;
  }

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

    if (this._app) {
      // console.log(`[Main]: ${this._app.screen.width} x ${this._app.screen.height}`);
      this._rightGround = Matter.Bodies.rectangle(this._app.screen.width / 4, this._app.screen.height + 60 / 2, this._app.screen.width / 2, 60,
        { isStatic: true, restitution: 0.25, friction: 0, render: { fillStyle: 'red', strokeStyle: 'black', lineWidth: 1 } });
      Matter.World.add(this._world, this._rightGround);
      this._leftGround = Matter.Bodies.rectangle(this._app.screen.width * 3 / 4, this._app.screen.height + 60 / 2, this._app.screen.width / 2, 60,
        { isStatic: true, restitution: 0.25, friction: 0, render: { fillStyle: 'red', strokeStyle: 'black', lineWidth: 1 } });
      Matter.World.add(this._world, this._leftGround);
      this._leftWall = Matter.Bodies.rectangle(-(this._sideWallWidth / 2), this._app.screen.height / 2, this._sideWallWidth, this._app.screen.height, { isStatic: true });
      Matter.World.add(this._world, this._leftWall);
      this._rightWall = Matter.Bodies.rectangle(this._app.screen.width + this._sideWallWidth / 2, this._app.screen.height / 2, this._sideWallWidth, this._app.screen.height, { isStatic: true });
      Matter.World.add(this._world, this._rightWall);
    }
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
      backgroundColor: 0xffffff,
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

    this._uiStage = new Graphics();
    this._app.stage.addChild(this._uiStage);

    const title = new RandomTitleOneLine(Context.CODE, 14, Context.TITLE_COLOR);
    this._uiStage.addChild(title);
    this._gridModel.addAnchor(title, 1, 1, GridAlign.TOP_LEFT);
    title.start();

    const techTitle = new RandomTitleOneLine(Context.TECH_TITLE, 14, Context.TITLE_COLOR);
    this._uiStage.addChild(techTitle);
    this._gridModel.addAnchor(techTitle, 11, 1, GridAlign.TOP_LEFT);
    techTitle.start();

    const subTitle = new RandomTitleOneLine(Context.TITLE, 14, Context.TITLE_COLOR);
    this._uiStage.addChild(subTitle);
    this._gridModel.addAnchor(subTitle, this._gridModel.divisionX - 1, 1, GridAlign.TOP_RIGHT);
    subTitle.start();

    const timeIndicator = new TimeIndicator(new Date());
    this._uiStage.addChild(timeIndicator);
    this._gridModel.addAnchor(timeIndicator, 1, this._gridModel.divisionY / 2 - 1, GridAlign.TOP_LEFT);
    this._app.ticker.add(timeIndicator.update);

    const clock = new Clock();
    this._uiStage.addChild(clock);
    this._gridModel.addAnchor(clock, this._gridModel.divisionX - 1, this._gridModel.divisionY / 2 - 1, GridAlign.TOP_RIGHT);
    this._app.ticker.add(clock.update);

  }


  update(): void {
    this._stats.begin();


    const now = new Date();

    const prevSeconds = this._prevTime.getSeconds();
    const currentSeconds = now.getSeconds();


    if (Math.abs(currentSeconds - prevSeconds) >= 1) {
      if (this._timeDiskBodies.length >= 30) {
        for (let i = 0; i < 20; i++) {
          const bodyToRemove = this._timeDiskBodies.shift();
          const diskToRemove = this._timeDisks.shift();
          if (bodyToRemove) {
            Matter.World.remove(this._world, bodyToRemove);
          }
          if (diskToRemove && this._mainStage) {
            this._mainStage.removeChild(diskToRemove);
          }
        }
      }

      if (this._app?.screen?.width) {

        let radius = 0;
        if (currentSeconds === 0) {
          radius = 150;
        } else if (currentSeconds % 10 === 0) {
          radius = 100;
        }
        else {
          radius = 35 + 50 * Math.random();
        }
        let fontSize = 16 * radius / 100;
        const timeBall = Matter.Bodies.circle(radius + (this._app?.screen?.width - radius * 2) * Math.random(), -radius, radius, {
          mass: radius / 2,
          restitution: 0.25, friction: 0.55, frictionAir: 0.02
        });
        Matter.World.add(this._world, timeBall);
        // Matter.Body.applyForce(timeBall, { x: timeBall.position.x, y: timeBall.position.y + timeBall.bounds.max.y / 2 }, { x: 0.0, y: 0 });
        Matter.Body.setAngularVelocity(timeBall, Math.PI / 8 * Math.random()); // ラジアン単位で回転速度を設定
        const timeDisk = new TimeDisk(radius, fontSize, 0xffffff);
        this._mainStage?.addChild(timeDisk);
        this._prevTime = now;

        this._timeDisks.push(timeDisk);
        this._timeDiskBodies.push(timeBall);
      }

    }
    Matter.Engine.update(this._engine);

    this._timeDisks.forEach((timeDisk, index) => {
      timeDisk.x = this._timeDiskBodies[index].position.x;
      timeDisk.y = this._timeDiskBodies[index].position.y;
      timeDisk.rotation = this._timeDiskBodies[index].angle;
    });

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

    if (this._rightGround) {
      Matter.Body.setPosition(this._rightGround, { x: newWidth / 2, y: newHeight + 60 / 2 });
    }
    if (this._leftWall) {
      Matter.Body.setPosition(this._leftWall, { x: -5, y: newHeight / 2 });
    }
    if (this._rightWall) {
      Matter.Body.setPosition(this._rightWall, { x: newWidth + 5, y: newHeight / 2 });
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
