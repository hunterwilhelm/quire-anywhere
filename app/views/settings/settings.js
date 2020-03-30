import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeService} from "../../modules/chrome.service.js";


$('#version').text(chrome.runtime.getManifest().version_name);

$('#proj-select').on('change', function () {
  hideProjectRequired();
});

$('#submit').on('click', function () {
  const serializedArray = $('#settings-form').serializeArray();
  console.log(serializedArray);
  console.log(ApiDataService.getProjectFromSelectMenuAndSave);
  ApiDataService.getProjectFromSelectMenuAndSave(serializedArray,
      function () {
    showProjectRequired(true);
  }, function () {
    showSuccessAlert();
  });

});

// load organizations
ApiDataService.getAllOrganizations(function(orgs) {
  let allOrgs = {};
  for (let i in orgs) {
    allOrgs[orgs[i].oid] = orgs[i];
  }
  StorageService.saveLocal(StorageConstants.QUIRE.ALL_ORGANIZATIONS, JSON.stringify(allOrgs));
});

// load projects
ApiDataService.getAllProjects(function (projects) {
  ApiDataService.fillSelectMenu(projects, $("#proj-select"));
  initialize();
});

function initialize() {


  const defaultProjId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  const defaultOrgId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);

  if (defaultOrgId && defaultProjId) {
    $("#proj-select").val(`${defaultOrgId}/${defaultProjId}`);
  }
  showDefaultProjectSelect();
  validateDefaultProjectSelect();
}

function showDefaultProjectSelect() {
  $("#loading-container").addClass("d-none");
  $("#project-settings-options-container").removeClass("d-none");
}

function validateDefaultProjectSelect() {
  let isDefaultOptionSelected = $("#project-settings-options-container select option:selected")[0].disabled;
  if (isDefaultOptionSelected) {
    showProjectRequired();
    return false;
  } else {
    hideProjectRequired();
    return true;
  }
}

function showProjectRequired(buttonClicked) {
  $("#project-description").addClass('d-none');
  $("#project-required").removeClass('d-none');
  if (buttonClicked) {
    markButtonAsError();
  } else {
    markButtonAsInvalid();
  }
}

function hideProjectRequired() {
  $("#project-description").removeClass('d-none');
  $("#project-required").addClass('d-none');
  markButtonAsPrimary();
}

function markButtonAsError() {
  $("#submit")
      .addClass("btn-outline-danger")
      .removeClass("btn-outline-secondary")
      .removeClass("btn-outline-primary");
}

function markButtonAsInvalid() {
  $("#submit")
      .removeClass("btn-outline-danger")
      .addClass("btn-outline-secondary")
      .removeClass("btn-outline-primary");
}

function markButtonAsPrimary() {
  $("#submit")
      .removeClass("btn-outline-danger")
      .removeClass("btn-outline-secondary")
      .addClass("btn-outline-primary");
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
