export class AppConfig {
  static clientId = ':888HSP1ENUG8Zm9PK9zOxyLnxfP';
  static clientSecret = 'pf6alxeqt9covuyj7o5ume9pb6cnymbedmwoglzp';

  static redirectURI = 'http://zicy.net/quire-anywhere/callback.php';
  static postUrl = 'http://zicy.net/quire-anywhere/callback.php';

  static jsonError = {type: "JSONerror"};

  static authorizationUrl = 'https://quire.io/oauth?client_id={client-id}&redirect_uri={redirect-uri}&state={state}';
  static tokenUrl = 'https://quire.io/oauth/token';
  static apiUrl = 'https://quire.io/api';
}