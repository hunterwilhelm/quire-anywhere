import {US_STATE_ABBREVIATIONS} from "./us.states.js";

// Bandcamp adapter: extract() runs in the page and returns plain data; enrich() turns it into Quire task fields in the background.

const URGENT_PRIORITY = 2;
const URGENT_UNDER_SECONDS = 10 * 60;

// Injected into the page with chrome.scripting, so it must stay self-contained (no references outside this function).
function extractBandcampData() {
  const element = document.querySelector("[data-tralbum]");
  if (!element) {
    return null;
  }
  const tralbum = JSON.parse(element.getAttribute("data-tralbum"));
  return {
    itemType: tralbum.item_type,
    releaseDate: tralbum.current?.release_date ?? tralbum.album_release_date ?? null,
    durations: (tralbum.trackinfo ?? []).map(track => track.duration),
    // Bandcamp lists the artist's location as the last tag
    tags: Array.from(document.querySelectorAll(".tralbum-tags a.tag"), tag => tag.textContent.replace(/[​-‏⁠﻿]/g, "").trim()),
    location: document.querySelector(".location")?.textContent.trim() ?? null,
  };
}

// Due = release date. Once released, Estimate (`etc`, seconds) = total length and Urgent if under 10 minutes. A future release date
// gets the due date only: pre-orders can list durations that aren't real. Tracks with no duration (0, e.g. not streamable on the
// album) are left out of the sum; with none at all there is no estimate.
function enrichBandcampData(data, options, now = new Date()) {
  const fields = {};
  const release = data.releaseDate ? new Date(data.releaseDate) : null;
  if (release && !isNaN(release)) {
    fields.due = release.toISOString().slice(0, 10);
    if (release > now) {
      return fields;
    }
  }
  const known = data.durations.filter(duration => duration > 0);
  if (known.length > 0) {
    fields.etc = Math.round(known.reduce((total, duration) => total + duration, 0));
    if (fields.etc < URGENT_UNDER_SECONDS) {
      fields.priority = URGENT_PRIORITY;
    }
  }
  return fields;
}

// The page's tags in order, minus the trailing location tag, plus location candidates, best first: the whole "City, Region" line
// (for aliases), then its parts, then the state abbreviation.
function bandcampTagCandidates(data) {
  const parts = (data.location ?? "").split(",").map(part => part.trim()).filter(Boolean);
  const tags = [...data.tags];
  const last = tags[tags.length - 1];
  if (last && parts.some(part => part.toLowerCase() === last.toLowerCase())) {
    tags.pop();
  }
  const stateAbbreviation = US_STATE_ABBREVIATIONS[parts[1]?.toLowerCase()];
  const location = [...(parts.length > 1 ? [data.location] : []), ...parts, ...(stateAbbreviation ? [stateAbbreviation] : [])];
  return {location, tags};
}

// Values for the title and custom field templates.
function bandcampValues(data) {
  const release = data.releaseDate ? new Date(data.releaseDate) : null;
  return {year: release && !isNaN(release) ? release.getUTCFullYear() : null};
}

export const BandcampAdapter = {
  id: "bandcamp",
  category: "Music",
  name: "Bandcamp",
  hosts: ["bandcamp.com"],
  extract: extractBandcampData,
  enrich: enrichBandcampData,
  values: bandcampValues,
  variables: ["title", "year"],
  defaultTitle: "{title}",
  defaultIgnoredTags: ["bandcamp", "music"],
  tagCandidates: bandcampTagCandidates,
};
