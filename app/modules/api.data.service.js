import {StorageService} from "./storage.service.js";
import {ApiConfig} from "./api.config.js";
import {ApiHttpService} from "./api.http.service.js";
import {Task} from "../models/task.model.js";
import {StorageConstants} from "./storage.constants.js";
import {ChromeService} from "./chrome.service.js";
import {AppUtils} from "./app.utils.js";
import {AdapterRegistry} from "./adapter.registry.js";
import {TagMatcher} from "./tag.matcher.js";

export class ApiDataService {
  constructor() {}

  // GET FROM STORAGE
  static getToken() {
    return StorageService.readLocal(StorageConstants.QUIRE.ACCESS_TOKEN)
  }
  
  static getDefaultProjectId() {
    return StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  }
  
  static getDefaultOrganizationId() {
    return StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);
  }

  // GET FROM QUIRE
  static async getProjectsByOrganization(organizationId, projectsFunction) {
    // Currently broken, 404 error
    const url = ApiConfig.getProjectsByOrganizationUrl.replace("{organizationOid}", organizationId);
    ApiHttpService.getFromQuire(url, await this.getToken(), function(response) {
      projectsFunction(response);
    });
  }

  static async getAllOrganizations(orgsFunction) {
    ApiHttpService.getFromQuire(ApiConfig.getAllOrganizationsUrl, await this.getToken(), function(response) {
      orgsFunction(response);
    });
  }

  // The project's tags as [{oid, name}], or null if they couldn't be loaded
  static async getProjectTags(projectId) {
    const url = ApiConfig.getProjectTagsUrl.replace("{projectOid}", projectId);
    const token = await this.getToken();
    return new Promise(resolve => {
      ApiHttpService.getFromQuire(url, token, response => resolve(Array.isArray(response) ? response : null));
    });
  }

  static async getAllProjects(projectsFunction) {
    const url = ApiConfig.getAllProjectsUrl;
    ApiHttpService.getFromQuire(url, await this.getToken(), function(response) {
      projectsFunction(response);
    });
  }

  // POST TO QUIRE
  static async postTaskIntoProject(task, project_id) {
    const url = ApiConfig.postNewTaskUrl.replace("{projectId}", project_id);
    const allProjects = JSON.parse(await StorageService.readLocal(StorageConstants.QUIRE.ALL_PROJECTS));
    const defaultProjName = allProjects[project_id].name;
    const token = await this.getToken();
    return new Promise((resolve) => {
      ApiHttpService.postToQuire(url, token, "Bearer", task.toJSON(), async function(created) {
        if (!created?.oid) {
          console.warn("Quire did not create the task", created);
          resolve(false);
          return;
        }
        await StorageService.addTaskToHistory(created);
        ChromeService.createNotification(
            created.oid,
            `Task added`,
            `to ${defaultProjName}\nClick to open`
        );
        resolve(true);
      });
    });
  }

  static async deleteTaskByOid(taskOid) {
    const url = ApiConfig.deleteTaskByOidUrl.replace("{taskOid}", taskOid);
    const token = await this.getToken();
    const response = await ApiHttpService.deleteToQuire(url, token);
    if (!response.ok) {
      console.warn(`Failed to delete task by OID: ${taskOid}`)
      throw response;
    }
  }

  // ADD (and then post)
  static async addPageTask(tab) {
    console.log("Adding page to Quire...");
    const defaultProjId = await this.getDefaultProjectId();
    const proj_id = await AdapterRegistry.resolveProjectId(tab.url, defaultProjId);
    const {fields, links, customFields, tagCandidates, title, aliases, ignoredTags} = await AdapterRegistry.enrichTab(tab);
    let description = [tab.url, ...links].join("\n");
    if (tagCandidates) {
      const projectTags = await this.getProjectTags(proj_id);
      if (projectTags) {
        const {oids, unmatched} = TagMatcher.match(tagCandidates, projectTags, aliases, ignoredTags);
        if (oids.length > 0) {
          fields.tags = oids;
        }
        if (unmatched.length > 0) {
          description += `\n\nTags: ${unmatched.join(", ")}`;
        }
      }
    }
    // Quire rejects the whole task for a field the project doesn't have, so fall back to less rather than lose the task
    const attempts = [
      {description, fields: {...fields, ...customFields}},
      {description, fields},
      {description: [tab.url, ...links].join("\n"), fields: {}},
    ].filter((attempt, i, all) => i === all.findIndex(other => JSON.stringify(other) === JSON.stringify(attempt)));
    for (const attempt of attempts) {
      const task = new Task(title ?? tab.title, attempt.description);
      task.addFields(attempt.fields);
      if (await ApiDataService.postTaskIntoProject(task, proj_id)) {
        break;
      }
      console.warn("Retrying with fewer fields");
    }
    // debug
    console.log(`Page url: ${tab.url}`);
    console.log(`Page title: ${tab.title}`);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + await this.getDefaultOrganizationId());
    console.log(`proj_id: ${proj_id}`);
  }

  static async addSelectionTask(info, tab) {
    console.log("Adding selection to Quire...");

    const proj_id = await AdapterRegistry.resolveProjectId(tab.url, await this.getDefaultProjectId());
    let task = new Task(info.selectionText, `From: ${tab.title} - ${tab.url}`);
    ApiDataService.postTaskIntoProject(task, proj_id);
    // debug
    console.log("Text: " + info.selectionText);
    console.log("From: " + tab.url);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + await this.getDefaultOrganizationId());
    console.log(`proj_id: ${proj_id}`);
  }

  static async addLinkTask(info, tab) {
    console.log("Adding link to Quire...");

    const proj_id = await AdapterRegistry.resolveProjectId(tab.url, await this.getDefaultProjectId());
    let task = new Task(
        info.linkUrl,
        `From: ${tab.title} - ${tab.url}`
    );
    ApiDataService.postTaskIntoProject(task, proj_id);
    // debug
    console.log("Link: " + info.linkUrl);
    console.log("From: " + tab.url);
    console.log(`Access token: ${this._accessToken}`);
    console.log("org_id" + await this.getDefaultOrganizationId());
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

  // HTML INJECTION
  static async fillSelectMenu(projects, projSelect) {
    let allProjects = {};
    for (const p of projects) {
      allProjects[p.oid] = p;
    }
    for (const p of projects) {
      const option = document.createElement("option");
      const org = p.organization;
      const projId = p.oid;
      const projName = AppUtils.formatProjectName(projId, p.name);
      if (org) {
        const orgId = org.oid;
        const orgName = org.name;
        option.text = `${orgName} - ${projName}`;
        option.value = `${orgId}/${projId}`;
        projSelect.append(option);
      } else if (projId && projName) {
        option.text = `${projName}`;
        option.value = `/${projId}`;
        projSelect.append(option);
      } else {
        alert("Could not load any projects, please sign in!");
      }
    }
    projSelect.html(projSelect.find('option').sort(function(x, y) {
      if ($(x).disabled) return -1;
      if (AppUtils.isProjectOidMyTasks($(x).val().split("/")[1])) return -1;
      return $(x).text().toLowerCase() > $(y).text().toLowerCase() ? 1 : -1;
    }));


    await StorageService.saveLocal(StorageConstants.QUIRE.ALL_PROJECTS, JSON.stringify(allProjects));
  }

  static async saveProjectAndOrganizationFromSelectMenuAsDefaultIds(serializedArray, projectRequiredCallback, successCallback) {
    // compile into one object
    let formData = [];
    for (const i in serializedArray) {
      formData[serializedArray[i].name] = serializedArray[i].value;
    }
    if (!formData["org-id/proj-id"]) {
      projectRequiredCallback(true);
    } else {
      const orgIdProjId = formData['org-id/proj-id'].split('/');
      const orgId = orgIdProjId[0];
      const projId = orgIdProjId[1];
      // issued together: the popup can close mid-save (window.onblur)
      await Promise.all([
        StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID, projId),
        StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID, orgId),
      ]);
      successCallback();
    }
  }
}

