export class AppConfig {
  static clientId = 'HSP1ENUG8Zm9PK9zOxyLnxfP';

  static apiUrl = 'https://quire-anywhere.hunterwilhelm.com/api';
  static tokenUrl = `${this.apiUrl}/token`;
  static refreshUrl = `${this.apiUrl}/refresh`;

  static jsonError = {status: "json-error"};
  static httpError = {status: "http-error"};

  static quireAppSettingsUrl = 'https://quire.io/r/setting?tab=app';
}
