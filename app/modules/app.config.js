export class AppConfig {
  static clientId = ':888HSP1ENUG8Zm9PK9zOxyLnxfP';

  static redirectUri = 'http://zicy.net/quire-anywhere/callback.php';
  static postUrl = 'http://zicy.net/quire-anywhere/callback.php';

  static jsonError = {status: "json-error"};
  static httpError = {status: "http-error"};

  static authorizationUrl = 'https://quire.io/oauth?client_id={client-id}&redirect_uri={redirect-uri}&state={state}';
  static apiUrl = 'https://quire.io/api';
}