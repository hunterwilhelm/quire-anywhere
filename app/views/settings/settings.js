import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";

$('#submit').on('click', function () {
  const serializedArray = $('#settings').serializeArray();
  // compile into one object
  const formData = [];
  for (const i in serializedArray) {
    formData[serializedArray[i].name] = serializedArray[i].value;
  }
  if (!formData["org-id"] || !formData["proj-id"]) {
    alert("Please choose project");
  } else {
    StorageService.saveLocal("default_proj_id", formData['proj-id']);
    StorageService.saveLocal("default_org_id", formData['org-id']);
    alert("Saved!");
  }

});

let currentOrg;
let projectElems = [];
function updateProjectsShown() {
  // show projects under this org
  for (const i in projectElems) {
    const project = projectElems[i];
    if (project.parentOid === currentOrg) {
      project.style.display = "";
    } else {
      project.style.display = "none";
      if (project.selected) {
        document.querySelector("#proj-select").selectedIndex = 0;
      }
    }
  }
}

// load organizations
ApiDataService.getAllOrganizations(function(orgs) {
  console.log(orgs);
  const orgSelect = document.querySelector("#org-select");
  for (const i in orgs) {
    const option = document.createElement("option");
    option.text = orgs[i].name;
    option.value = orgs[i].oid;
    orgSelect.add(option);
  }
});

// load projects
ApiDataService.getAllProjects(function(projects) {
  console.log(projects);
  const projSelect = document.querySelector("#proj-select");
  for (const i in projects) {
    const option = document.createElement("option");
    option.text = projects[i].name;
    option.value = projects[i].oid;
    option.parentOid = projects[i].organization;
    option.style.display = "none";
    projSelect.add(option);
    projectElems.push(option);
  }
});

const orgSelect = $('#org-select');
orgSelect.on('change', function () {
  const orgSelectElem = orgSelect.get(0);
  const orgElem = orgSelectElem.options[orgSelectElem.selectedIndex];
  currentOrg = orgElem.value;
  updateProjectsShown();
});

