export class AppUtils {
  static getRandomString(length) {
    if (!length) {
      length = 100;
    }
    return Math.random().toString(36).substring(0, length);
  }
}