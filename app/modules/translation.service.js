import {TranslationConfig} from "./translation.config.js";

export class TranslationService extends TranslationConfig {
    static translateFromKey(type, key) {
      const translationsType = this.english_translations[type];
      if (translationsType) {
        const translation = translationsType[key];
        if (translation !== undefined) {
          return translation;
        } else if (this.english_translations[type]["default"] !== undefined) {
          return this.english_translations[type]["default"];
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
