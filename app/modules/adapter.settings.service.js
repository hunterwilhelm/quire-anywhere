import {StorageService} from "./storage.service.js";
import {StorageConstants} from "./storage.constants.js";

// Per-adapter settings in storage.sync: {<adapterId>: {enabled, sites: [{host, projId}], titleTemplate, fields: [{name, template}],
// aliases: [{text, tag}], ignoredTags: [page tag text], options: {<key>: value}}}.
// Adapters are off until enabled. An enabled adapter owns its default hosts plus the user's extra `sites`; each site's `projId` picks the
// project (empty = "Default": a matching Site Rule, else the default project). Aliases map page text -> project tag name,
// e.g. {text: "psychedelic", tag: "psych"}. titleTemplate and the Text custom `fields` use {placeholders} from the adapter's values().
export class AdapterSettingsService {
  static async getAll() {
    const stored = await StorageService.readSync(StorageConstants.SETTINGS.ADAPTERS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Aliases used to be one global list, and only Bandcamp used them
    const legacy = await StorageService.readSync(StorageConstants.SETTINGS.TAG_ALIASES);
    const all = legacy ? {bandcamp: {aliases: JSON.parse(legacy)}} : {};
    if (legacy) {
      await AdapterSettingsService.saveAll(all);
      await StorageService.removeSync(StorageConstants.SETTINGS.TAG_ALIASES);
    }
    return all;
  }

  static async saveAll(all) {
    await StorageService.saveSync(StorageConstants.SETTINGS.ADAPTERS, JSON.stringify(all));
  }

  // The adapter's settings with defaults filled in, so callers never see missing keys.
  static async get(adapter) {
    const saved = (await AdapterSettingsService.getAll())[adapter.id] ?? {};
    const options = Object.fromEntries((adapter.options ?? []).map(option => [option.key, option.default]));
    // The adapter's own hosts are always listed (project "" = default); saved entries override their project and add custom hosts
    const savedSites = saved.sites ?? [];
    const builtIn = (adapter.hosts ?? []).map(host => savedSites.find(site => site.host === host) ?? {host, projId: ""});
    return {
      enabled: saved.enabled === true,
      sites: [...builtIn, ...savedSites.filter(site => !(adapter.hosts ?? []).includes(site.host))],
      titleTemplate: saved.titleTemplate ?? adapter.defaultTitle ?? "{title}",
      fields: saved.fields ?? adapter.defaultFields ?? [],
      aliases: saved.aliases ?? [],
      ignoredTags: saved.ignoredTags ?? adapter.defaultIgnoredTags ?? [],
      options: {...options, ...saved.options},
    };
  }

  static async save(adapter, settings) {
    const all = await AdapterSettingsService.getAll();
    all[adapter.id] = settings;
    await AdapterSettingsService.saveAll(all);
  }
}
