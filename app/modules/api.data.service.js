import {StorageService} from "./storage.service.js";
import {ApiConfig} from "./api.config.js";
import {ApiHttpService} from "./api.http.service.js";
import {Task} from "../models/task.model.js";

export class ApiDataService {
  constructor() {}

  // GET FROM STORAGE
  static getToken() {
    return StorageService.readLocal('quire_access_token')
  }
  
  static getDefaultProjectId() {
    return StorageService.readLocal("default_proj_id");
  }
  
  static getDefaultOrganizationId() {
    return StorageService.readLocal("default_org_id");
  }

  // GET FROM QUIRE
  static getProjectsByOrganization(organizationId, projectsFunction) {
    // Currently broken, 404 error
    const url = ApiConfig.getProjectsByOrganizationUrl.replace("{organizationOid}", organizationId);
    console.log(url);
    ApiHttpService.getFromQuire(url, this.getToken(), function(response) {
      projectsFunction(response);
    });
  }

  static getAllOrganizations(orgsFunction) {
    ApiHttpService.getFromQuire(ApiConfig.getAllOrganizationsUrl, this.getToken(), function(response) {
      orgsFunction(response);
    });
  }

  static getAllProjects(projectsFunction) {
    const url = ApiConfig.getAllProjectsUrl;
    console.log(url);
    ApiHttpService.getFromQuire(url, this.getToken(), function(response) {
      projectsFunction(response);
    });
  }

  // POST TO QUIRE
  static postTaskIntoProject(task, project_id) {
    const url = ApiConfig.postNewTaskUrl.replace("{projectId}", project_id);
    // const defaultOrgName = StorageService.readLocal('default_org_name');
    const defaultProjName = StorageService.readLocal('default_proj_name');
    ApiHttpService.postToQuire(url, this.getToken(), "Bearer", task.toJSON(),function(response) {
      alert(`New task #${response.id} added to ${defaultProjName}`);
    });
  }
  // ADD (and then post)
  static addPageTask(info, tab) {
    console.log("Adding page to Quire...");
    const proj_id = this.getDefaultProjectId();
    let task = new Task(tab.title, tab.url);
    ApiDataService.postTaskIntoProject(task, proj_id);
    // debug
    console.log(`Page url: ${info.pageUrl}`);
    console.log(`Page title: ${tab.title}`);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + this.getDefaultOrganizationId());
    console.log(`proj_id: ${proj_id}`);
  }

  static addSelectionTask(info, tab) {
    console.log("Adding selection to Quire...");

    const proj_id = this.getDefaultProjectId();
    let task = new Task(info.selectionText, "From: " + tab.url);
    ApiDataService.postTaskIntoProject(task, proj_id);
    // debug
    console.log("Text: " + info.selectionText);
    console.log("From: " + info.pageUrl);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + this.getDefaultOrganizationId());
    console.log(`proj_id: ${proj_id}`);
  }

  static addLinkTask(info, tab) {
    console.log("Adding link to Quire...");

    const proj_id = this.getDefaultProjectId();
    let task = new Task(info.linkUrl, "From: " + tab.url);
    ApiDataService.postTaskIntoProject(task, proj_id);
    // debug
    console.log("Link: " + info.linkUrl);
    console.log("From: " + info.pageUrl);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + this.getDefaultOrganizationId());
    console.log(`proj_id: ${proj_id}`);
  }

  static getExpireInAsDateString(expires_in) {
    if (Number.isInteger(expires_in)) {
      var dt = new Date();
      dt.setSeconds( dt.getSeconds() + expires_in);
      return dt.toString();
    } else {
      console.throw(`Expected expires_in ${expires_in} to be an Integer`);
      return null;
    }
  }
}
