import {BandcampAdapter} from "./bandcamp.adapter.js";
import {HltbAdapter} from "./hltb.adapter.js";
import {SteamAdapter} from "./steam.adapter.js";
import {SpotifyAdapter} from "./spotify.adapter.js";
import {AdapterSettingsService} from "./adapter.settings.service.js";
import {SiteRulesService} from "./site.rules.service.js";
import {renderTemplate} from "./adapter.utils.js";

// Bundled site adapters only (no remote code). Each has: id, name, hosts (default sites), extract() (runs in the page), enrich(data, options)
// -> task fields (may be async; a `links` array of URLs goes under the page URL in the description instead). Optional: options (settings
// schema: [{key, label, default, choices: [{value, label}]}]; no choices = free text), matchesPage(url) (limits enriching to some pages of
// its sites), values(data, options) -> {year, ...} for the title and custom field templates (variables lists their names, defaultTitle its
// default), defaultFields ([{name, template}] custom field rows), defaultIgnoredTags, tags (fixed tag names to apply), and
// tagCandidates(data) -> {location, tags}; tagCandidates also turns on tag aliases and ignored tags for the adapter in Settings.
const adapters = [BandcampAdapter, HltbAdapter, SteamAdapter, SpotifyAdapter];

const EMPTY = () => ({fields: {}, links: [], customFields: {}, tagCandidates: null, title: null, aliases: [], ignoredTags: []});

export class AdapterRegistry {
  static get adapters() {
    return adapters;
  }

  // {adapter, settings, site} for the enabled adapter that owns the URL's host (its own or a user-added one; the most specific wins).
  static async findSite(url) {
    const hostname = SiteRulesService.normalizeHost(url);
    if (!hostname) {
      return null;
    }
    let best = null;
    for (const adapter of adapters) {
      const settings = await AdapterSettingsService.get(adapter);
      if (!settings.enabled) {
        continue;
      }
      for (const site of settings.sites) {
        if (SiteRulesService.hostMatches(hostname, site.host) && site.host.length > (best?.site.host.length ?? 0)) {
          best = {adapter, settings, site};
        }
      }
    }
    return best;
  }

  // The project chosen for the URL's adapter site, or the Site Rule / default project when none is set.
  static async resolveProjectId(url, defaultProjectId) {
    const found = await AdapterRegistry.findSite(url);
    return SiteRulesService.resolveProjectId(url, defaultProjectId, found?.site.projId);
  }

  // Single-line text custom fields from the settings rows; rows whose template renders empty are skipped.
  static customFields(settings, values) {
    const rows = settings.fields.map(({name, template}) => [name, renderTemplate(template, values)]);
    return Object.fromEntries(rows.filter(([name, text]) => name && text));
  }

  // {fields, links, customFields, tagCandidates, title, aliases, ignoredTags} for the tab's page; empty when no enabled adapter applies or
  // anything fails: enriching must never block adding the task. Needs activeTab, which the context menu click grants.
  static async enrichTab(tab) {
    const found = await AdapterRegistry.findSite(tab.url);
    if (!found || (found.adapter.matchesPage && !found.adapter.matchesPage(tab.url))) {
      return EMPTY();
    }
    const {adapter, settings} = found;
    try {
      const [injection] = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: adapter.extract});
      const data = injection?.result;
      if (!data) {
        return EMPTY();
      }
      const values = {title: tab.title, ...adapter.values?.(data, settings.options)};
      const {links = [], ...fields} = await adapter.enrich(data, settings.options);
      return {
        fields,
        links,
        customFields: AdapterRegistry.customFields(settings, values),
        tagCandidates: adapter.tagCandidates?.(data) ?? (adapter.tags ? {location: [], tags: adapter.tags} : null),
        title: renderTemplate(settings.titleTemplate, values) || null,
        aliases: settings.aliases,
        ignoredTags: settings.ignoredTags,
      };
    } catch (e) {
      console.warn(`${adapter.id} enrichment failed, adding the plain task`, e);
      return EMPTY();
    }
  }
}
