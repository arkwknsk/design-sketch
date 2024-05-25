import gsap from "gsap";
import { Container } from "pixi.js";
import { WeatherData } from "../core/AppManager";
import { MathUtil } from "../utils/MathUtil";
import { Bar } from "./Bar";

export class DayBundle extends Container {
  /**
   * 表示する気象情報の配列
   *
   * @private
   * @type {WeatherData[]}
   * @memberof DayBundle
   */
  private _weatherDataContainer: WeatherData[];

  /*
    * バーのコンテナ
    *
    * @private
    * @type {Bar[]}
    * @memberof DayBundle
  */
  private _barContainer: Bar[] = [];

  /*
   * バーの表示遅延

    * @private
    * @type {number}
    * @memberof DayBundle
    * @default 0
    * @memberof DayBundle
  */
  private _delay: number;

  public constructor(weatherDataContainer: WeatherData[], delay: number = 0) {
    super();

    this._weatherDataContainer = weatherDataContainer;
    this._delay = delay;

    this.init();
  }

  public init() {
    this._weatherDataContainer.forEach((weatherData) => {
      // const bar = new Bar(weatherData.wind_speed / 6);
      const bar = new Bar(MathUtil.scale(weatherData.wind_speed, 0, 5, 0.5, 1));
      bar.angle = weatherData.wind_direction_angle;
      bar.alpha = 0.0;
      this.addChild(bar);
      this._barContainer.push(bar);
    });

    const timeline = gsap.timeline();
    timeline.delay(this._delay);
    this._barContainer.forEach((bar, index) => {
      timeline.to(bar, { alpha: 1, duration: 1.0 }, index * 0.4);
    });
  }
}
