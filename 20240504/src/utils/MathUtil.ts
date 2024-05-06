export class MathUtil {
  /**
   * Generates a random floating-point number between the specified min and max values.
   * 
   * @param {number} min - The minimum value (inclusive).
   * @param {number} max - The maximum value (exclusive).
   * @returns {number} A random floating-point number between min and max.
   */
  public static getRandomFloat(min: number, max: number): number {
    const maxUint32: number = 0xFFFFFFFF;
    let randomValue: Uint32Array = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    let scaledRandomValue: number = randomValue[0] / maxUint32; // Use a separate variable for the scaled value

    // スケールされた値を範囲内の値に変換
    return (scaledRandomValue * (max - min)) + min;
  }

  /**
   * Generates a random integer between the specified min and max values.
   * 
   * @param {number} min - The minimum value (inclusive).
   * @param {number} max - The maximum value (exclusive).
   * @returns {number} A random integer between min and max.
   */
  public static getRandomInt(min: number, max: number): number {
    return Math.floor(MathUtil.getRandomFloat(min, max));
  }

  /**
   * Generates a random access token of the specified length.
   * 
   * @param {number} length - The length of the generated token. Defaults to 64.
   * @returns {string} A random access token.
   */
  public static generateAccessToken(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      const randomValue = MathUtil.getRandomFloat(0, chars.length);
      token += chars.charAt(Math.floor(randomValue));
    }
    return token;
  }


  public static getSeed(): string {
    const now = new Date();
    const year = (now.getFullYear()).toString();
    const month = MathUtil.zeroPadding((now.getMonth() + 1));
    const day = MathUtil.zeroPadding(now.getDate());
    const hour = MathUtil.zeroPadding(now.getHours());
    const min = MathUtil.zeroPadding(now.getMinutes());
    const sec = MathUtil.zeroPadding(now.getSeconds());
    const msec = MathUtil.zeroPadding(now.getMilliseconds(), 4);

    return `${year}${month}${day}${hour}${min}${sec}${msec}`;
  }

  public static zeroPadding(num: number, length: number = 2): string {
    return (Array(length).join('0') + num).slice(-length);
  }

  public static scale = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    const result = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

    if (result < outMin) {
      return outMin;
    } else if (result > outMax) {
      return outMax;
    }

    return result;
  };


}
