export class TimeUtil {
  public static getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const sec = now.getSeconds().toString().padStart(2, '0');
    const msec = now.getMilliseconds().toString().padStart(4, '0');

    return `${year}/${month}/${day} ${hour}:${min}:${sec}.${msec}`;
  }
}
