// One-off: move Bandcamp tasks from an inbox project into the Bandcamp adapter's project and enrich them like the extension does.
// Dry run by default. Usage: node tools/batch-enrich-bandcamp.mjs [--apply] [--limit N] [--delay MS] [--inbox NAME]
// Reads the token from tmp/.quire-token and the adapter settings (paste of storage.sync `adapter_settings`) from tmp/adapter-settings.json.
import fs from "node:fs";
import {BandcampAdapter} from "../app/modules/bandcamp.adapter.js";
import {TagMatcher} from "../app/modules/tag.matcher.js";
import {renderTemplate} from "../app/modules/adapter.utils.js";

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const option = (name, fallback) => args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback;
const apply = flag("apply");
const limit = Number(option("limit", Infinity));
const delay = Number(option("delay", 1500));
const inboxName = option("inbox", "!incoming");

const token = fs.readFileSync("tmp/.quire-token", "utf8").trim();
const settings = JSON.parse(fs.readFileSync("tmp/adapter-settings.json", "utf8")).bandcamp;
const targetOid = settings.sites.find(site => site.host === "bandcamp.com").projId;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function quire(method, path, body) {
  const response = await fetch(`https://quire.io/api${path}`, {
    method,
    headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : {};
}

const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
// Also drops zero-width characters, which some Bandcamp tags carry and which would break tag matching.
const strip = html => decode(html.replace(/<[^>]*>/g, "")).replace(/[​-‏⁠﻿]/g, "").trim();

// String version of extractBandcampData, which reads the live DOM.
function extractFromHtml(html) {
  const attribute = html.match(/data-tralbum="([^"]*)"/);
  if (!attribute) {
    return null;
  }
  const tralbum = JSON.parse(decode(attribute[1]));
  return {
    itemType: tralbum.item_type,
    releaseDate: tralbum.current?.release_date ?? tralbum.album_release_date ?? null,
    durations: (tralbum.trackinfo ?? []).map(track => track.duration),
    tags: [...html.matchAll(/<a\s+class="tag"[^>]*>([\s\S]*?)<\/a>/g)].map(match => strip(match[1])),
    location: strip(html.match(/class="location[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "") || null,
  };
}

const projects = await quire("GET", "/project/list");
const inbox = projects.filter(project => project.name === inboxName);
if (inbox.length !== 1) {
  throw new Error(`Expected one project named ${inboxName}, found ${inbox.length}`);
}
const libraryTags = await quire("GET", `/tag/list/${targetOid}`);
const tasks = await quire("GET", `/task/list/${inbox[0].oid}`);
const urlPattern = /https?:\/\/[^\s)\]>"']*bandcamp\.com[^\s)\]>"']*/i;
const work = tasks.filter(task => task.status.value === 0 && urlPattern.test(`${task.name} ${task.description ?? ""}`)).slice(0, limit);
console.log(`${apply ? "APPLY" : "DRY RUN"}: ${work.length} Bandcamp tasks of ${tasks.length} in ${inboxName}`);

let done = 0;
const failures = [];
for (const task of work) {
  const url = `${task.name} ${task.description ?? ""}`.match(urlPattern)[0];
  try {
    const html = await (await fetch(url, {headers: {"User-Agent": "Mozilla/5.0 (quire-anywhere batch)"}})).text();
    const data = extractFromHtml(html);
    if (!data) {
      throw new Error("no data-tralbum on page");
    }
    const fields = BandcampAdapter.enrich(data);
    const values = {title: task.name, ...BandcampAdapter.values(data)};
    const customFields = Object.fromEntries(
        settings.fields.map(({name, template}) => [name, renderTemplate(template, values)]).filter(([name, text]) => name && text));
    const {oids, unmatched} = TagMatcher.match(BandcampAdapter.tagCandidates(data), libraryTags, settings.aliases, settings.ignoredTags);
    if (oids.length > 0) {
      fields.tags = oids;
    }
    let description = task.description ?? url;
    if (unmatched.length > 0) {
      description += `\n\nTags: ${unmatched.join(", ")}`;
    }
    const tagNames = oids.map(oid => libraryTags.find(tag => tag.oid === oid).name);
    console.log(`\n${task.name}\n  fields ${JSON.stringify({...fields, tags: undefined, ...customFields})} tags [${tagNames}] unmatched [${unmatched}]`);
    if (apply) {
      await quire("PUT", `/task/transfer/${task.oid}?project=${encodeURIComponent(targetOid)}`);
      const attempts = [{description, ...fields, ...customFields}, {description, ...fields}, {description: task.description ?? url}];
      for (const attempt of attempts) {
        try {
          await quire("PUT", `/task/${task.oid}`, attempt);
          break;
        } catch (e) {
          console.warn(`  retrying with fewer fields: ${e.message}`);
        }
      }
      console.log("  moved and updated");
    }
    done++;
  } catch (e) {
    console.error(`  FAILED ${task.name}: ${e.message}`);
    failures.push(task.name);
  }
  await sleep(delay);
}
console.log(`\n${done} ok, ${failures.length} failed`);
failures.forEach(name => console.log(`  ${name}`));
