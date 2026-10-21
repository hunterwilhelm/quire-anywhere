export class AppConfig {
  // static clientId = 'HSP1ENUG8Zm9PK9zOxyLnxfP';
  static clientId = ':HuN2GUupqKNNU0gYQcIPyhzmvHg';

  // static apiUrl = 'https://quire-anywhere.hunterwilhelm.com/api';
  static apiUrl = 'https://quire-anywhere-extension-git-feature-verce-3647df-hunterwilhelm.vercel.app/api';
  // static tokenUrl = `${this.apiUrl}/token`;
  static tokenUrl = `${this.apiUrl}/token?_vercel_share=oU5JTiwlwPXvATSwbzx535cFgY2cw66H`;
  static refreshUrl = `${this.apiUrl}/refresh`;

  static jsonError = {status: "json-error"};
  static httpError = {status: "http-error"};

  static quireAppSettingsUrl = 'https://quire.io/r/setting?tab=app';
}
