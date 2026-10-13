// Steam adapter: store app pages (/app/<id>/...) show the game's name and release date in the page itself.

// Injected into the page with chrome.scripting, so it must stay self-contained (no references outside this function).
function extractSteamData() {
  // Sale pages title the tab "Save 50% on GRID on Steam", so prefer the page's own app name
  const rawName = document.getElementById("appHubAppName")?.textContent
      ?? document.title.replace(/^Save \d+% on /, "").replace(/ on Steam$/, "");
  // Drop trademark symbols like Game™ and Game®
  const name = rawName.replace(/[™®©℠]/g, "").replace(/\s+/g, " ").trim();
  const released = document.querySelector(".release_date .date")?.textContent.trim() ?? null;
  const appId = location.pathname.match(/^\/app\/(\d+)/)?.[1];
  return name ? {name, released, appId} : null;
}

// Estimate (`etc`, seconds) = HowLongToBeat's time for the flavor chosen in Settings, via Augmented Steam's public API (minutes there),
// and the HowLongToBeat page as a `links` line for the description. Any failure or missing time means none of it: enriching must never
// block adding the task.
async function enrichSteamData(data, options) {
  try {
    // The signal also covers reading the body, so a stalled API can't hold up adding the task
    const response = await fetch(`https://api.augmentedsteam.com/app/${data.appId}/v2`, {signal: AbortSignal.timeout(5000)});
    const hltb = (await response.json()).hltb;
    const minutes = hltb?.[options.estimate];
    return {...(minutes > 0 && {etc: Math.round(minutes * 60)}), ...(hltb?.url && {links: [hltb.url]})};
  } catch (e) {
    console.warn("HowLongToBeat lookup via Augmented Steam failed", e);
    return {};
  }
}

// Values for the title and custom field templates; the release date reads like "26 Feb, 2019" (or "Coming soon" with no year).
function steamValues(data) {
  const year = Number(data.released?.match(/\b(\d{4})\b/)?.[1]);
  return {name: data.name, year: year > 0 ? year : null};
}

export const SteamAdapter = {
  id: "steam",
  category: "Games",
  name: "Steam",
  hosts: ["store.steampowered.com"],
  matchesPage(url) {
    try {
      return /^\/app\/\d+/.test(new URL(url).pathname);
    } catch (e) {
      return false;
    }
  },
  options: [{
    key: "estimate",
    label: "Estimate from",
    default: "complete",
    choices: [
      {value: "story", label: "Main Story"},
      {value: "extras", label: "Main + Extras"},
      {value: "complete", label: "Completionist"},
    ],
  }],
  extract: extractSteamData,
  values: steamValues,
  variables: ["title", "name", "year"],
  defaultTitle: "{name} [{year}]",
  defaultFields: [{name: "Platform", template: "Windows"}, {name: "Own on", template: "Steam"}],
  tags: ["Steam"],
  enrich: enrichSteamData,
};
