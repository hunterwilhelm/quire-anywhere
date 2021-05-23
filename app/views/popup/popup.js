import {StorageService} from "../../modules/storage.service.js";
import {LoginDataService} from "../../modules/login.data.service.js";
import {ApiDataService} from "../../modules/api.data.service.js";
import {TranslationService} from "../../modules/translation.service.js";
import {TranslationConfig} from "../../modules/translation.config.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {Task} from "../../models/task.model.js";
import {AppUtils} from "../../modules/app.utils.js";

function showPopulateDefaultTable() {
  const allProjects = JSON.parse(StorageService.readLocal(StorageConstants.QUIRE.ALL_PROJECTS));
  const defaultProjectId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  if (allProjects && defaultProjectId && allProjects[defaultProjectId]) {
    const defaultProject = allProjects[defaultProjectId];
    const orgName = defaultProject?.organization?.name ?? "None";
    const projName = AppUtils.formatProjectName(defaultProject.oid, defaultProject.name);
    $('#default-org').html(orgName);
    $('#default-proj').html(projName);
    $('#table-container').removeClass('d-none');
    showSetupAddTaskInput();
  } else {
    showChooseProjectContainer();
  }
}

let registeredShowSetupAddTaskInput = false;
function showSetupAddTaskInput() {
  $("#add-task-container").removeClass("d-none");
  const addTaskInput = $("#add-task-container input");
  if (!registeredShowSetupAddTaskInput) {
    $("#add-task-container button").on("click", sendTaskHandler);
    addTaskInput.on('keyup', validateAddTaskInput);
    addTaskInput.on('keyup', function(e) {
      if(e.keyCode === 13) {
        sendTaskHandler();
      }
    });
    registeredShowSetupAddTaskInput = true;
  }
  addTaskInput.select();
}

function sendTaskHandler() {
  const addTaskInput = $("#add-task-container input");
  if (validateAddTaskInput(true)) {
    const projId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
    let task = new Task(addTaskInput.val(), "From: Add Task Box");
    ApiDataService.postTaskIntoProject(task, projId).then((taskSucceeded)=>{
      if (taskSucceeded) {
        resetTaskInput();
      }
    });
  }
}

function resetTaskInput() {
  $("#task-cannot-be-blank-warn").addClass("d-none");
  $("#add-task-container input")
      .removeClass("border border-danger")
      .val("");
  $("#add-task-container button")
      .removeClass("btn-success")
      .addClass("btn-secondary");
}

function validateAddTaskInput(sendEvent) {
  let val = $("#add-task-container input").val();
  if (val && val.trim().length > 0) {
    hideAddTaskFieldRequired();
    return true;
  } else {
    showAddTaskFieldRequired(sendEvent);
    return false;
  }
}

function showAddTaskFieldRequired(sendEvent) {
  if (sendEvent === true) {
    $("#task-cannot-be-blank-warn").removeClass("d-none");
  }
  $("#add-task-container input").addClass("border border-danger");
  $("#add-task-container button")
      .removeClass("btn-success")
      .addClass("btn-secondary");
}

function hideAddTaskFieldRequired() {
  $("#task-cannot-be-blank-warn").addClass("d-none");
  $("#add-task-container input")
      .removeClass("border border-danger");
  $("#add-task-container button")
      .removeClass("btn-secondary")
      .addClass("btn-success");
}

function showLoggedIn() {
  $("#logged-in-container").removeClass('d-none');
  $("#login-container").addClass('d-none');
  $("#loading-container").addClass('d-none');
  $("#open-settings").removeClass('disabled');
  showPopulateDefaultTable();
}

function showLogIn() {
  $("#logged-in-container").addClass('d-none');
  $("#login-container").removeClass('d-none');
  $("#loading-container").addClass('d-none');
  $("#open-settings").addClass('disabled');
}

// try to load login data onload
const loginDataService = new LoginDataService();
function checkIfLoggedIn() {
  loginDataService.isLoggedIn(function (loggedIn) {
    if (loggedIn) {
      console.log("logged in");
      loadQuireData().then(function () {
        showLoggedIn();
        initialize();
      });
    } else {
      showLogIn();
      setTimeout(checkIfLoggedIn, 1000);
    }
  });
}
checkIfLoggedIn();

const getTokenButton = document.querySelector('#get-token');
if (getTokenButton) {
  getTokenButton.addEventListener('click', function () {
    document.querySelector('#access-token').innerHTML = ApiDataService.getToken();
  });
}


document.querySelector('#logout-button').addEventListener('click', loginDataService.logout);
const settingsButton = $('#open-settings');
settingsButton.on('click', function() {
  if (settingsButton.hasClass('disabled')) {
    $("#error-warn-body").html(TranslationService.translateFromKey(TranslationConfig.SETTINGS, "not-signed-in"));
    $("#error-warn").removeClass('d-none');
  } else {
    window.open(chrome.runtime.getURL('/views/settings/settings.html'));
  }
});

document.querySelector("#login-button").addEventListener("click", function () {
  loginDataService.askQuireToGrantAccess();
});

// hide instead of delete warns
$(document).on('click', '.alert-close', function() {
  $(this).parent().addClass('d-none');
});


// PROJECT SETTINGS - this is the reason why I need to move to angular... duplicated code...
$("#edit-project").on('click', function() {
  hideProjectTable();
  showChooseProjectContainer();
});
$("#close-edit-project").on('click', function() {
  showProjectTable();
  hideChooseProjectContainer();
});

// save on quit (add event listener does not work fast enough here)

const projectSelect = $('#proj-select');
projectSelect
    .on('change', hideProjectRequired)
    .on('blur', handleSaveEvent);
const submitButton = $('#submit');
submitButton.on('click', handleSaveEvent);
function handleSaveEvent() {
  const mouseOverButton = $('#close-edit-project').is(':hover') || submitButton.is(':hover');
  const mouseOutsideChooseProjectContainer = !$('#choose-project-container').is(':hover');
  if (mouseOverButton || mouseOutsideChooseProjectContainer) {
    save();
  } else {
    projectSelect.focus();
  }
}
// expedited the save process onblur so chrome doesn't kill the js before it saves
window.onblur = save;
function save() {
  const serializedArray = $('#settings-form').serializeArray();
  ApiDataService.saveProjectAndOrganizationFromSelectMenuAsDefaultIds(serializedArray,
      function () {
        showProjectRequired(true);
      }, function () {
        hideChooseProjectContainer();
        showProjectTable();
        showSuccessAlert();
        showPopulateDefaultTable();
      }
  );
}

async function loadQuireData() {
  const organizationsPromise = new Promise((resolve) => {
    ApiDataService.getAllOrganizations(function(orgs) {
      let allOrgs = {};
      for (let i in orgs) {
        allOrgs[orgs[i].oid] = orgs[i];
      }
      StorageService.saveLocal(StorageConstants.QUIRE.ALL_ORGANIZATIONS, JSON.stringify(allOrgs));
      resolve();
    });
  });
  const projectsPromise = new Promise((resolve, reject) => {
    // load projects
    ApiDataService.getAllProjects(function (projects) {
      if (projects && projects.response) {
        loginDataService.attemptRefreshToken(function(loggedIn) {
          if (!loggedIn) {
            loginDataService.logout(false);
            reject();
          }
        })
      } else {
        ApiDataService.fillSelectMenu(projects, $("#proj-select"));
        resolve();
      }
    });
  });
  return Promise.all([organizationsPromise, projectsPromise]);
}


function initialize() {


  const defaultProjId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  const defaultOrgId = StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);

  if (defaultOrgId && defaultProjId) {
    $("#proj-select").val(`${defaultOrgId}/${defaultProjId}`);
  }
  validateDefaultProjectSelect(!(defaultOrgId || defaultProjId));
}

function validateDefaultProjectSelect(firstTime) {
  let isDefaultOptionSelected = $("#project-settings-options-container select option:selected")[0].disabled;
  if (firstTime || isDefaultOptionSelected) {
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

function hideChooseProjectContainer() {
  $("#choose-project-container").addClass("d-none");
}


function showChooseProjectContainer() {
  $("#choose-project-container").removeClass("d-none");
}

function hideProjectTable() {
  $("#default-project-table").addClass("d-none");
}

function showProjectTable() {
  $("#default-project-table").removeClass("d-none");
}

// register Context Menu again
ChromeService.registerContextMenuItems();

