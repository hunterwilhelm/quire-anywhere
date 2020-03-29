import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeService} from "../../modules/chrome.service.js";

let allProjects = {};
let allOrgs = {};

$('#proj-select').on('change', function () {
  hideProjectRequired();
});

$('#submit').on('click', function () {
  const serializedArray = $('#settings-form').serializeArray();
  console.log(serializedArray);
  // compile into one object
  let formData = [];
  for (const i in serializedArray) {
    formData[serializedArray[i].name] = serializedArray[i].value;
  }
  if (!formData["org-id/proj-id"]) {
    alert("Please choose project");
  } else {
    const orgIdProjId = formData['org-id/proj-id'].split('/');
    const orgId = orgIdProjId[0];
    const projId = orgIdProjId[1];
    const orgName = allOrgs[orgId] ? allOrgs[orgId].name : null;
    const projName = allProjects[projId].name;
    const projUrl = allProjects[projId].url;
    StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID, projId);
    StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_NAME, projName);
    StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_URL, projUrl);
    StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID, orgId);
    if (orgName) {
      StorageService.saveLocal(StorageConstants.SETTINGS.DEFAULT_ORG_NAME, orgName);
    }
    showSuccessAlert();
  }

});

// load organizations
ApiDataService.getAllOrganizations(function(orgs) {
  for (let i in orgs) {
    allOrgs[orgs[i].oid] = orgs[i];
  }
  console.log(allOrgs, orgs);
});

// load projects
ApiDataService.getAllProjects(function(projects) {
  for (let i in projects) {
    allProjects[projects[i].oid] = projects[i];
  }
  console.log(allProjects, projects);
  const projSelect = $("#proj-select");
  for (const i in projects) {
    const option = document.createElement("option");
    const org = allOrgs[projects[i].organization];
    const projId = projects[i].oid;
    const projName = projects[i].name;
    if (org) {
      const orgId = org.oid;
      const orgName = org.name;
      option.text = `${orgName} - ${projName}`;
      option.value = `${orgId}/${projId}`;
      projSelect.append(option);
    } else if (projId && projName) {
      const orgId = projects[i].organization;
      option.text = `${projName}`;
      option.value = `${orgId}/${projId}`;
      projSelect.append(option);
    } else {
      alert("Could not load any projects, please sign in!");
    }
  }
  projSelect.html(projSelect.find('option').sort(function(x, y) {
    if ($(x).disabled) return -1;
    return $(x).text() > $(y).text() ? 1 : -1;
  }));

  initialize();
});

function initialize() {


  const defaultProjId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  const defaultOrgId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);

  if (defaultOrgId && defaultProjId) {
    $("#proj-select").val(`${defaultOrgId}/${defaultProjId}`);
    hideProjectRequired();
  } else {
    showProjectRequired();
  }
  showResults();
}

function showResults() {
  $("#loading-container").addClass("d-none");
  $("#project-settings-options-container").removeClass("d-none");
}

function showProjectRequired() {
  $("#project-description").addClass('d-none');
  $("#project-required").removeClass('d-none');
}

function hideProjectRequired() {
  $("#project-description").removeClass('d-none');
  $("#project-required").addClass('d-none');
}

function showSuccessAlert() {
  const successAlert = $("#success-alert");
  successAlert.removeClass('d-none');
  successAlert.fadeTo(2000, 500).slideUp(500, function() {
    successAlert.slideUp(500);
  });
}

ChromeService.registerStorageListener(quireLoggedInHandler, StorageConstants.QUIRE.LOGGED_IN);
function quireLoggedInHandler(loggedIn) {
  if (loggedIn === StorageConstants.FALSE) {
    window.close();
  }
}
