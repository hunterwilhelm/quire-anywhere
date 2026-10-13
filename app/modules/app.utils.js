export class AppUtils {
  static getRandomString(length = 40) {
    const bytes = new Uint8Array(Math.ceil(length * 0.75));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
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
