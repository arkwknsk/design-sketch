import { Text, TextStyle } from "pixi.js";

export class DisplayObjectHelper {
  static getDisplayObject(string: string, fontFamily: string, fontSize: number, fontColor: number): Text {
    const style = new TextStyle({
      fontFamily: fontFamily,
      fontWeight: '400',
      fill: fontColor,
      fontSize: fontSize,
      letterSpacing: 1.0,
      align: 'left',
    });

    const text = new Text({
      text: string,
      style: style,
    });

    return text;
  }
}

