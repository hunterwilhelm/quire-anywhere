import {AppStatusKeys} from "./app.status.keys.js";
import {AppConfig} from "./app.config.js";

export class ApiHttpService {
  static getFromQuire(url, token, responseFunction) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          const responseObject = JSON.parse(xhr.responseText);
          try {
            responseFunction(responseObject);
          } catch (e) {
            console.log(e);
          }
        } catch (error) {
          responseFunction({response:AppStatusKeys.JSON_ERROR});
        }
      } else if (xhr.status === 429) {
        responseFunction({response:AppStatusKeys.TOO_MANY_REQUESTS});
      } else {
        responseFunction({response:AppStatusKeys.HTTP_ERROR});
      }
    };
    xhr.send();
  }

  static postToQuire(url, token, grant_type, json, responseFunction) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `${grant_type} ${token}`);
    xhr.send(json);
    xhr.onload = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          const json = JSON.parse(xhr.responseText);
          responseFunction(json);
        } catch (error) {
          responseFunction(AppConfig.jsonError);
        }
      } else {
        responseFunction(AppConfig.httpError);
      }
    }
  }

  static async deleteToQuire(url, token) {
    const params = {
      "headers": {
        "Authorization": `Bearer ${token}`
      },
      "method": "DELETE"
    };
    return fetch(url, params);
  }
}
