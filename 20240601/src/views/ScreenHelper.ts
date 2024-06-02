import { Graphics } from "pixi.js";
import { GridView } from "./GridView";

export class ScreenHelper {

  /**
   * レイアウト用のグリッドを返す
   *
   * @static
   * @return {*}  {Graphics}
   * @memberof ScreenHelper
   */
  static GetLayoutGrid(g: Graphics, gridView: GridView, color: number): void {
    g.clear();

    //水平方向に分割
    for (let i = 0; i <= gridView.divisionY; i++) {
      g.moveTo(0, gridView.unitHeight * i)
        .lineTo(gridView.stageWidth, gridView.unitHeight * i)
        .stroke({ width: 1, color: color });
    }

    //垂直方向に分割
    for (let i = 0; i <= gridView.divisionX; i++) {
      g.moveTo(gridView.unitWidth * i, 0)
        .lineTo(gridView.unitWidth * i, gridView.stageHeight)
        .stroke({ width: 1, color: color });;
    }

    g.alpha = 0.5;

    // return g;
  }

  static getPositionByGrid(unitX: number, unitY: number, gridModel: GridView): { x: number, y: number; } {
    return { x: unitX * gridModel.unitWidth, y: unitY * gridModel.unitHeight };
  }
}
