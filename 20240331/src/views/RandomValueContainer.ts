import { Container } from 'pixi.js';
import { MathUtil } from '../utils/MathUtil';
import { TimeUtil } from '../utils/TimeUtil'; // Ensure correct import path
import { RandomTitleOneLine } from './RandomTitleOneLine';

export class RandomValueContainer extends Container {
  private _gap: number = 0;

  constructor(gap: number = 16) { // Type should be the actual type of _gridModel
    super();

    this._gap = gap;
  }

  public populateContent(): void {
    const timestamp = new RandomTitleOneLine(TimeUtil.getTimestamp(), 12, 0x666666, 0.4);
    // timestamp.alpha = 0.75;
    this.addChild(timestamp);
    timestamp.start();

    const randomValue = new RandomTitleOneLine(MathUtil.getRandomInt(0, 10 ** 16).toString().padStart(16, '0'), 24);
    this.addChild(randomValue);
    randomValue.y += this._gap;
    randomValue.start();
  }
}

