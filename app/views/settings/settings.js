import {ApiDataService} from "../../modules/api.data.service.js";
import {StorageService} from "../../modules/storage.service.js";
import {StorageConstants} from "../../modules/storage.constants.js";
import {ChromeService} from "../../modules/chrome.service.js";
import {SiteRulesService} from "../../modules/site.rules.service.js";
import {AdapterRegistry} from "../../modules/adapter.registry.js";
import {AdapterSettingsService} from "../../modules/adapter.settings.service.js";


$('#version').text(ChromeService.getVersionName());

$('#proj-select').on('change', function () {
  hideProjectRequired();
});

$('#submit').on('click', function () {
  const serializedArray = $('#settings-form').serializeArray();
  console.log(serializedArray);
  console.log(ApiDataService.saveProjectAndOrganizationFromSelectMenuAsDefaultIds);
  ApiDataService.saveProjectAndOrganizationFromSelectMenuAsDefaultIds(serializedArray,
      function () {
    showProjectRequired(true);
  }, function () {
    showSuccessAlert();
    validateDefaultProjectSelect();
  });

});

// load organizations
ApiDataService.getAllOrganizations(async function(orgs) {
  let allOrgs = {};
  for (let i in orgs) {
    allOrgs[orgs[i].oid] = orgs[i];
  }
  await StorageService.saveLocal(StorageConstants.QUIRE.ALL_ORGANIZATIONS, JSON.stringify(allOrgs));
});

// load projects
ApiDataService.getAllProjects(async function (projects) {
  await ApiDataService.fillSelectMenu(projects, $("#proj-select"));
  await initialize();
});

async function initialize() {


  const defaultProjId = await StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_PROJ_ID);
  const defaultOrgId = await StorageService.readLocal(StorageConstants.SETTINGS.DEFAULT_ORG_ID);

  if (defaultOrgId && defaultProjId) {
    $("#proj-select").val(`${defaultOrgId}/${defaultProjId}`);
  }
  showDefaultProjectSelect();
  await initializeSiteRules();
  await renderAdapters();
  validateDefaultProjectSelect(!(defaultOrgId || defaultProjId));
}

function showDefaultProjectSelect() {
  $("#loading-container").addClass("d-none");
  $("#project-settings-options-container").removeClass("d-none");
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

ChromeService.registerStorageListener(quireLoggedInHandler, StorageConstants.QUIRE.LOGGED_IN);
function quireLoggedInHandler(loggedIn) {
  if (loggedIn === StorageConstants.FALSE) {
    window.close();
  }
}

// SITE RULES
async function initializeSiteRules() {
  const ruleProjectSelect = $("#rule-proj");
  $("#proj-select option").not(":disabled").each(function () {
    ruleProjectSelect.append(new Option($(this).text(), $(this).val().split("/")[1]));
  });
  $("#site-rules-container").removeClass("d-none");
  await renderSiteRules();
}

async function renderSiteRules() {
  const list = $("#site-rules-list").empty();
  for (const rule of await SiteRulesService.getRules()) {
    const projName = $(`#rule-proj option[value="${CSS.escape(rule.projId)}"]`).text() || "(project unavailable)";
    const removeButton = $('<button type="button" class="btn btn-sm btn-outline-secondary">Remove</button>')
        .on("click", () => removeSiteRule(rule.host));
    list.append($("<tr>")
        .append($("<td>").text(rule.host))
        .append($("<td>").text(projName))
        .append($('<td class="text-right">').append(removeButton)));
  }
}

$("#rule-add").on("click", async function () {
  const host = SiteRulesService.normalizeHost($("#rule-host").val());
  const projId = $("#rule-proj").val();
  if (!host || !projId) {
    $("#rule-invalid").removeClass("d-none");
    return;
  }
  $("#rule-invalid").addClass("d-none");
  const rules = (await SiteRulesService.getRules()).filter(rule => rule.host !== host);
  rules.push({host, projId});
  await SiteRulesService.saveRules(rules);
  $("#rule-host").val("");
  await renderSiteRules();
});

async function removeSiteRule(host) {
  await SiteRulesService.saveRules((await SiteRulesService.getRules()).filter(rule => rule.host !== host));
  await renderSiteRules();
}

// SITE ADAPTERS
async function renderAdapters() {
  const list = $("#adapters-list").empty();
  const categories = new Map();
  for (const adapter of AdapterRegistry.adapters) {
    const category = adapter.category ?? "Other";
    categories.set(category, [...(categories.get(category) ?? []), adapter]);
  }
  let index = 0;
  for (const [category, adapters] of categories) {
    list.append(await buildCategorySection(category, adapters, index++));
  }
  $("#adapters-container").removeClass("d-none");
}

// A collapsible group of adapter cards, collapsed at first. The cards are indented under a left rule so they read as part of the group.
async function buildCategorySection(category, adapters, index) {
  const inner = $('<div class="border-left ml-3 pl-3 pt-3">');
  for (const adapter of adapters) {
    inner.append(await buildAdapterCard(adapter));
  }
  const header = $(`<button type="button" class="btn btn-light btn-block text-left font-weight-bold" data-toggle="collapse" ` +
      `data-target="#adapter-category-${index}" aria-expanded="false">`)
      .text(`${category} (${adapters.length})`);
  return $('<div class="mb-2">')
      .append(header)
      .append($(`<div class="collapse" id="adapter-category-${index}">`).append(inner));
}

async function updateAdapterSettings(adapter, change) {
  const settings = await AdapterSettingsService.get(adapter);
  change(settings);
  await AdapterSettingsService.save(adapter, settings);
}

// Everything but the on/off switch stays hidden until the adapter is enabled.
async function buildAdapterCard(adapter) {
  const settings = await AdapterSettingsService.get(adapter);
  const body = $('<div class="card-body border-top">').toggleClass("d-none", !settings.enabled);
  const toggle = $(`<input type="checkbox" class="custom-control-input" id="adapter-${adapter.id}">`).prop("checked", settings.enabled);
  toggle.on("change", async function () {
    const enabled = this.checked;
    body.toggleClass("d-none", !enabled);
    await updateAdapterSettings(adapter, s => s.enabled = enabled);
  });
  body.append(buildSitesEditor(adapter));
  body.append(buildTitleEditor(adapter, settings));
  body.append(buildFieldsEditor(adapter));
  for (const option of adapter.options ?? []) {
    body.append(buildAdapterOption(adapter, option, settings.options[option.key]));
  }
  if (adapter.tags) {
    body.append($('<p class="small text-muted">').text(`All tasks are tagged ${adapter.tags.join(", ")}, if the task's project has a tag with that name.`));
  }
  if (adapter.tagCandidates) {
    body.append(buildIgnoredTagsEditor(adapter, settings));
    body.append(await buildAliasEditor(adapter));
  }
  return $('<div class="card mb-3">')
      .append($('<div class="card-header custom-control custom-switch ml-3 border-0 bg-transparent">')
          .append(toggle)
          .append($(`<label class="custom-control-label font-weight-bold" for="adapter-${adapter.id}">`).text(adapter.name)))
      .append(body);
}

// A project <select> with "Default" first, using the same projects as the Site Rules form.
function buildProjectSelect(projId) {
  const select = $('<select class="custom-select custom-select-sm">').append(new Option("Default", ""));
  $("#rule-proj option").each(function () {
    select.append(new Option($(this).text(), $(this).val()));
  });
  return select.val(projId);
}

// The adapter's own sites (locked) and user-added ones, each with a project that starts as "Default".
function buildSitesEditor(adapter) {
  const rows = $("<tbody>");
  const hostInput = $('<input type="text" class="form-control" placeholder="e.g. example.com">');
  const invalid = $('<div class="alert alert-danger small d-none" role="alert">Enter a site like example.com.</div>');

  async function render() {
    rows.empty();
    for (const site of (await AdapterSettingsService.get(adapter)).sites) {
      const select = buildProjectSelect(site.projId).on("change", () => updateAdapterSettings(adapter, s => {
        s.sites.find(other => other.host === site.host).projId = select.val();
      }));
      const locked = adapter.hosts.includes(site.host);
      const removeButton = locked ? "" : $('<button type="button" class="btn btn-sm btn-outline-secondary">Remove</button>')
          .on("click", async () => {
            await updateAdapterSettings(adapter, s => s.sites = s.sites.filter(other => other.host !== site.host));
            await render();
          });
      rows.append($("<tr>")
          .append($("<td>").text(site.host))
          .append($("<td>").append(select))
          .append($('<td class="text-right">').append(removeButton)));
    }
  }

  const addButton = $('<button type="button" class="btn btn-outline-primary">Add</button>').on("click", async () => {
    const host = SiteRulesService.normalizeHost(hostInput.val());
    invalid.toggleClass("d-none", !!host);
    if (!host) {
      return;
    }
    await updateAdapterSettings(adapter, s => {
      if (!s.sites.some(site => site.host === host)) {
        s.sites.push({host, projId: ""});
      }
    });
    hostInput.val("");
    await render();
  });

  render();
  return $('<div class="mb-3">')
      .append($("<h6>Sites</h6>"))
      .append($('<p class="small text-muted">Tasks from these sites go to the chosen project. "Default" uses a matching Site Rule, ' +
          'or else the default project, so none of these need to be added to Site Rules.</p>'))
      .append($('<table class="table table-sm">').append(rows))
      .append($('<div class="input-group">').append(hostInput).append($('<div class="input-group-append">').append(addButton)))
      .append(invalid);
}

function placeholderHint(adapter) {
  return `Available: ${adapter.variables.map(name => `{${name}}`).join(" ")}. A placeholder with no value is left out, with its brackets.`;
}

function buildTitleEditor(adapter, settings) {
  const input = $('<input type="text" class="form-control">').val(settings.titleTemplate)
      .on("change", () => updateAdapterSettings(adapter, s => s.titleTemplate = input.val().trim() || adapter.defaultTitle));
  return $('<div class="form-group">')
      .append($("<label>Task title</label>"))
      .append(input)
      .append($('<small class="form-text text-muted">').text(placeholderHint(adapter)));
}

// Text custom fields: the field's name in the project and a template for its value. Projects without that field fall back to no fields.
function buildFieldsEditor(adapter) {
  const rows = $("<tbody>");
  const nameInput = $('<input type="text" class="form-control" placeholder="Field name, e.g. Year">');
  const templateInput = $('<input type="text" class="form-control" placeholder="Value, e.g. {year}">');

  async function render() {
    rows.empty();
    for (const field of (await AdapterSettingsService.get(adapter)).fields) {
      const removeButton = $('<button type="button" class="btn btn-sm btn-outline-secondary">Remove</button>').on("click", async () => {
        await updateAdapterSettings(adapter, s => s.fields = s.fields.filter(other => other.name !== field.name));
        await render();
      });
      rows.append($("<tr>")
          .append($("<td>").text(field.name))
          .append($("<td>").text(field.template))
          .append($('<td class="text-right">').append(removeButton)));
    }
  }

  const addButton = $('<button type="button" class="btn btn-outline-primary">Add</button>').on("click", async () => {
    const name = nameInput.val().trim();
    const template = templateInput.val().trim();
    if (!name || !template) {
      return;
    }
    await updateAdapterSettings(adapter, s => {
      s.fields = s.fields.filter(field => field.name !== name);
      s.fields.push({name, template});
    });
    nameInput.val("");
    templateInput.val("");
    await render();
  });

  render();
  return $('<div class="mb-3">')
      .append($("<h6>Custom Fields</h6>"))
      .append($('<p class="small text-muted">').text("Single-line text fields to fill in, matched by the field's name in the task's project. " +
          placeholderHint(adapter)))
      .append($('<table class="table table-sm">').append(rows))
      .append($('<div class="input-group">').append(nameInput).append(templateInput)
          .append($('<div class="input-group-append">').append(addButton)));
}

function buildAdapterOption(adapter, option, value) {
  if (!option.choices) {
    // A free text option; empty goes back to the default
    const input = $('<input type="text" class="form-control">').val(value).attr("placeholder", option.default)
        .on("change", () => updateAdapterSettings(adapter, s => s.options[option.key] = input.val().trim() || option.default));
    return $('<div class="form-group">').append($("<label>").text(option.label)).append(input);
  }
  const select = $('<select class="custom-select">');
  for (const choice of option.choices) {
    select.append(new Option(choice.label, choice.value));
  }
  select.val(value).on("change", () => updateAdapterSettings(adapter, s => s.options[option.key] = select.val()));
  return $('<div class="form-group">').append($("<label>").text(option.label)).append(select);
}

function buildIgnoredTagsEditor(adapter, settings) {
  const input = $('<input type="text" class="form-control" placeholder="e.g. music, album">').val(settings.ignoredTags.join(", "))
      .on("change", () => updateAdapterSettings(adapter, s => {
        s.ignoredTags = input.val().split(",").map(tag => tag.trim()).filter(Boolean);
      }));
  return $('<div class="form-group">')
      .append($("<label>Ignored Tags</label>"))
      .append(input)
      .append($('<small class="form-text text-muted">').text("Page tags to skip entirely (comma separated, not case sensitive). " +
          "They are neither applied nor listed under \"Tags:\" in the description."));
}

async function buildAliasEditor(adapter) {
  const rows = $("<tbody>");
  const textInput = $('<input type="text" class="form-control" placeholder="e.g. Los Angeles, California">');
  const tagInput = $('<input type="text" class="form-control" placeholder="e.g. L.A.">');
  const invalid = $('<div class="alert alert-danger small d-none" role="alert">Enter both the page text and your tag.</div>');

  async function render() {
    rows.empty();
    for (const alias of (await AdapterSettingsService.get(adapter)).aliases) {
      const removeButton = $('<button type="button" class="btn btn-sm btn-outline-secondary">Remove</button>').on("click", async () => {
        await updateAdapterSettings(adapter, s => s.aliases = s.aliases.filter(other => other.text !== alias.text));
        await render();
      });
      rows.append($("<tr>")
          .append($("<td>").text(alias.text))
          .append($("<td>").text(alias.tag))
          .append($('<td class="text-right">').append(removeButton)));
    }
  }

  const addButton = $('<button type="button" class="btn btn-outline-primary">Add</button>').on("click", async () => {
    const text = textInput.val().trim();
    const tag = tagInput.val().trim();
    invalid.toggleClass("d-none", !!(text && tag));
    if (!text || !tag) {
      return;
    }
    await updateAdapterSettings(adapter, s => {
      s.aliases = s.aliases.filter(alias => alias.text.toLowerCase() !== text.toLowerCase());
      s.aliases.push({text, tag});
    });
    textInput.val("");
    tagInput.val("");
    await render();
  });

  await render();
  return $("<div>")
      .append($("<h6>Tag Aliases</h6>"))
      .append($("<p class=\"small text-muted\">When a page's tag or location matches the text on the left (not case sensitive), " +
          "your tag on the right is used instead.</p>"))
      .append($('<table class="table table-sm">').append(rows))
      .append($('<div class="input-group mb-3">').append(textInput).append(tagInput)
          .append($('<div class="input-group-append">').append(addButton)))
      .append(invalid);
}
