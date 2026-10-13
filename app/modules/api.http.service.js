import {AppStatusKeys} from "./app.status.keys.js";
import {AppConfig} from "./app.config.js";

export class ApiHttpService {
  static async getFromQuire(url, token, responseFunction) {
    let response;
    try {
      response = await fetch(url, {headers: {"Authorization": `Bearer ${token}`}});
    } catch (error) {
      responseFunction({response:AppStatusKeys.HTTP_ERROR});
      return;
    }
    if (response.status === 200) {
      let responseObject;
      try {
        responseObject = await response.json();
      } catch (error) {
        responseFunction({response:AppStatusKeys.JSON_ERROR});
        return;
      }
      try {
        responseFunction(responseObject);
      } catch (e) {
        console.log(e);
      }
    } else if (response.status === 429) {
      responseFunction({response:AppStatusKeys.TOO_MANY_REQUESTS});
    } else {
      responseFunction({response:AppStatusKeys.HTTP_ERROR});
    }
  }

  static async postToQuire(url, token, grant_type, json, responseFunction) {
    let response;
    try {
      response = await fetch(url, {method: "POST", headers: {"Authorization": `${grant_type} ${token}`}, body: json});
    } catch (error) {
      responseFunction(AppConfig.httpError);
      return;
    }
    if (response.status === 200) {
      let result;
      try {
        result = await response.json();
      } catch (error) {
        responseFunction(AppConfig.jsonError);
        return;
      }
      responseFunction(result);
    } else {
      responseFunction(AppConfig.httpError);
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
