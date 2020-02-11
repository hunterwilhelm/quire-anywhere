import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";

let allProjects = {};
let allOrgs = {};

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
    const orgName = allOrgs[orgId].name;
    const projName = allProjects[projId].name;
    StorageService.saveLocal("default_proj_id", projId);
    StorageService.saveLocal("default_proj_name", projName);
    StorageService.saveLocal("default_org_id", orgId);
    StorageService.saveLocal("default_org_name", orgName);
    alert("Saved!");
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
    const orgId = org.oid;
    const orgName = org.name;
    const projId = projects[i].oid;
    const projName = projects[i].name;
    option.text = `${orgName} - ${projName}`;
    option.value = `${orgId}/${projId}`;
    projSelect.append(option);
  }
  projSelect.html(projSelect.find('option').sort(function(x, y) {
    if ($(x).disabled) return -1;
    return $(x).text() > $(y).text() ? 1 : -1;
  }));
});

