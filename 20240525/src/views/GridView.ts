import { Container } from "pixi.js";
import { GridAlign, GridAnchor } from "../models/GridAlign";

/**
 * このクラスの単一責任は、グリッドの構造をモデル化し、そのグリッドの各種パラメータ（ステージの幅と高さ、分割数、
 * 各グリッドユニットのサイズ）を管理することです。このクラスは、グリッドに関連する情報を提供し、グリッドのサイ
 * ズや分割数に基づいて各グリッドユニットの幅と高さを計算する機能を提供
 *
 */
export class GridView {

  // !Static Methods

  /**
   * The width of the stage
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _stageWidth: number;
  public get stageWidth(): number {
    return this._stageWidth;
  }
  public set stageWidth(v: number) {
    this._stageWidth = v;
    this.calculateUnits();
    this.updateAnchorPositions();
  }

  /**
   * The height of the stage
   *
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _stageHeight: number;
  public get stageHeight(): number {
    return this._stageHeight;
  }
  public set stageHeight(v: number) {
    this._stageHeight = v;
    this.calculateUnits();
    this.updateAnchorPositions();
  }

  /**
   * The number of divisions along the x-axis
   *
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _divisionX: number;
  public get divisionX(): number {
    return this._divisionX;
  }
  public set divisionX(v: number) {
    this._divisionX = v;
    this.calculateUnits();
    this.updateAnchorPositions();
  }

  /**
   * The number of divisions along the y-axis
   *
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _divisionY: number;
  public get divisionY(): number {
    return this._divisionY;
  }
  public set divisionY(v: number) {
    this._divisionY = v;
    this.calculateUnits();
    this.updateAnchorPositions();
  }

  /**
   * The width of each grid unit
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _unitWidth: number = 0;
  public get unitWidth(): number {
    return this._unitWidth;
  }

  /**
   * The height of each grid unit
   * @private
   * @type {number}
   * @memberof GridModel
   */
  private _unitHeight: number = 0;
  public get unitHeight(): number {
    return this._unitHeight;
  }


  private _anchors: GridAnchor[] = [];
  public get anchors(): GridAnchor[] {
    return this._anchors;
  }


  // !Constructor Function
  constructor(width: number = 640, height: number = 640, divisionX: number = 10, divisionY: number = 10) {
    this._stageWidth = width;
    this._stageHeight = height;
    this._divisionX = divisionX;
    this._divisionY = divisionY;

    this.calculateUnits();
  }

  // !Getters and Setters

  // !Public Instance Methods
  /**
   * Adds a new anchor to the grid with specified container, grid position, and alignment
   * @param {Container} content The PIXI Container to anchor
   * @param {number} x The x position in the grid
   * @param {number} y The y position in the grid
   * @param {GridAlign} align The alignment of the content within the grid cell
   * @memberof GridModel
   */
  public addAnchor(content: Container, x: number, y: number, align: GridAlign): void {
    const anchor: GridAnchor = { content, x, y, align };
    this._anchors.push(anchor);
  }

  /**
   * Removes an anchor from the grid
   * @param {Container} content The PIXI Container to remove the anchor from
   * @memberof GridModel
   */
  public removeAnchor(content: Container): void {
    const index = this._anchors.findIndex((anchor) => anchor.content === content);
    if (index >= 0) {
      this._anchors.splice(index, 1);
    }
  }

  /**
   * Updates the position of each anchor's content based on the grid's x and y values
   * @memberof GridModel
   */
  public updateAnchorPositions(): void {
    this._anchors.forEach(anchor => {
      let newX: number;
      let newY: number;

      // Calculate new X position
      switch (anchor.align) {
        case GridAlign.TOP_LEFT:
        case GridAlign.BOTTOM_LEFT:
          newX = anchor.x * this._unitWidth;
          break;
        case GridAlign.TOP_RIGHT:
        case GridAlign.BOTTOM_RIGHT:
          newX = anchor.x * this._unitWidth - anchor.content.width;
          break;
        default:
          newX = anchor.x * this._unitWidth;
          break;
      }

      // Calculate new Y position
      switch (anchor.align) {
        case GridAlign.TOP_LEFT:
          newY = anchor.y * this._unitHeight;
          break;
        case GridAlign.TOP_RIGHT:
          newY = anchor.y * this._unitHeight;
          break;
        case GridAlign.BOTTOM_LEFT:
          newY = anchor.y * this._unitHeight - anchor.content.height;
          break;
        case GridAlign.BOTTOM_RIGHT:
          newY = anchor.y * this._unitHeight - anchor.content.height;
          break;
        default:
          newY = anchor.y * this._unitHeight;
          break;
      }

      // Update the position of the content
      anchor.content.x = newX;
      anchor.content.y = newY;
    });
  }

  // !Private Subroutines
  /**
   * Calculate the width and height of each grid unit
   * @private
   * @memberof GridModel
   */
  private calculateUnits() {
    this._unitWidth = this._stageWidth / this._divisionX;
    this._unitHeight = this._stageHeight / this._divisionY;
  }
}
