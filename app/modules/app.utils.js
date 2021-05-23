export class AppUtils {
  static getRandomString(length) {
    if (!length) {
      length = 100;
    }
    return Math.random().toString(36).substring(0, length);
  }


  // for some reason the My Tasks is Named "Inbox" from the API, this helps resolve confusion
  static formatProjectName(projId, projName) {
    return AppUtils.isProjectOidMyTasks(projId) ? `My Tasks / ${projName}` : projName
  }

  // for some reason, My Tasks always starts with a ':'
  static isProjectOidMyTasks(oid) {
    return oid?.length >= 1 && oid[0] === ":";
  }
}
