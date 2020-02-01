export class TranslationService {
    static _translations = {
        "context-menu": {
          "selection": "selected text",
          "page": "this page",
          "link": "this link",
          "image": "this image",
          "video": "this video",
          "audio": "audio",
          "default": "this page"
        },
        "authentication-response": {
          "access-code.denied": "You denied access, please sign in again",
          "token.success": "You have successfully logged in!",
          "token.denied": "Something went wrong validating the response... try again?",

          "json-error": "Something went wrong reading the response... try again?",
          "http-error": "Something went wrong getting the response... try again?",
          "default": "Unknown error... try again?"
        }
    };
    static translateFromKey(type, key) {
      const translationsType = this._translations[type];
      if (translationsType) {
        const translation = translationsType[key];
        if (translation !== undefined) {
          return translation;
        } else if (this._translations[type]["default"] !== undefined) {
          return this._translations[type]["default"];
        } else {
          console.log(`translation ${type}.${key} not found`);
          return "";
        }
      } else {
        console.log(`type ${type} from ${type}.${key} not found`);
        return "";
      }
    }
  }