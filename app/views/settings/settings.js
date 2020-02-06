import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";

let allProjects;
let allOrgs;
let currentOrgIndex;
let projectElems = [];
const orgSelect = $('#org-select');

$('#submit').on('click', function () {
  const serializedArray = $('#settings-form').serializeArray();
  // compile into one object
  const formData = [];
  for (const i in serializedArray) {
    formData[serializedArray[i].name] = serializedArray[i].value;
  }
  if (!formData["org-index"] || !formData["proj-index"]) {
    alert("Please choose project");
  } else {
    const projIndex = formData['proj-index'];
    const orgIndex = formData['org-index'];
    StorageService.saveLocal("default_proj_id", allProjects[projIndex].oid);
    StorageService.saveLocal("default_proj_name", allProjects[projIndex].name);
    StorageService.saveLocal("default_org_id", allOrgs[orgIndex].oid);
    StorageService.saveLocal("default_org_name", allOrgs[orgIndex].name);
    alert("Saved!");
  }

});

// load organizations
ApiDataService.getAllOrganizations(function(orgs) {
  console.log(orgs);
  allOrgs = orgs;
  const orgSelect = document.querySelector("#org-select");
  for (const i in orgs) {
    const option = document.createElement("option");
    option.text = orgs[i].name;
    option.value = i;
    orgSelect.add(option);
  }
});

// load projects
ApiDataService.getAllProjects(function(projects) {
  console.log(projects);
  allProjects = projects;
  const projSelect = document.querySelector("#proj-select");
  for (const i in projects) {
    const option = document.createElement("option");
    option.text = projects[i].name;
    option.value = i;
    option.parentOid = projects[i].organization;
    option.style.display = "none";
    projSelect.add(option);
    projectElems.push(option);
  }
});

orgSelect.on('change', function () {
  const orgSelectElemDOM = orgSelect.get(0);
  const orgElem = orgSelectElemDOM.options[orgSelectElemDOM.selectedIndex];
  currentOrgIndex = orgElem.value;

  // show projects under this org
  for (const i in projectElems) {
    const project = projectElems[i];
    if (project.parentOid === allOrgs[currentOrgIndex].oid) {
      project.style.display = "";
    } else {
      project.style.display = "none";
      if (project.selected) {
        document.querySelector("#proj-select").selectedIndex = 0;
      }
    }
  }
});

