# Chrome Extension: Quire Anywhere

The source code for [Quire Anywhere](https://chrome.google.com/webstore/detail/quire-anywhere/nojpnnfpfaepolalpokjlblonedknfgf), a chrome extension that easily allows you to add tasks from around the web easily. 


Settings has Site Rules: tasks added from a site (e.g. bandcamp.com) go to the project you choose instead of the default.

Settings has Site Adapters (off until enabled), grouped into collapsible categories (Music, Games). Enabling one covers its sites (e.g. bandcamp.com) without a Site Rule: each starts on "Default" and can be given its own project, and you can add more sites. Each adapter also has a task title format (e.g. "{name} [{year}]") and Text (single-line) custom field rows (e.g. Year = "{year}", none by default). Bandcamp fills due date, estimate, priority, the year (if you add a field row for it) and tags (with your tag aliases, minus tags you ignore); HowLongToBeat game pages set the title ("Game [year]") and Estimate (Main Story, Main + Extras, Completionist or All Styles). Steam app pages set the title ("Game [year]"), Estimate (HowLongToBeat time via Augmented Steam's API; Main Story, Main + Extras or Completionist) plus the HowLongToBeat link under the Steam URL in the description, the Steam tag (if the project has one) and the custom fields Platform = Windows and Own on = Steam (editable). Spotify album and playlist pages set the title ("1:36 Artist – Album [year]"; a duration of 1 hr 36 min shows as 1:36, 42 min 10 sec as 42:10), due date (the release date, if the page shows it) and Estimate (the total length). A playlist is titled "Playlist – Name" (no year or due date; "Playlist" is a setting).

`tools/batch-enrich-bandcamp.mjs` is a standalone Node script (not part of the extension) that moves Bandcamp tasks from an inbox project into your Bandcamp project and enriches them like the extension does. It is a dry run unless given `--apply`; see the comments at the top of the file.

## OAuth relay deployment

`quire-anywhere/` contains the TypeScript Vercel Functions for OAuth code exchange and token refresh. The extension uses
`chrome.identity.launchWebAuthFlow` and validates OAuth `state` locally; the API keeps no login session or handoff data. Set the Vercel
project root to this directory and configure:

- `QUIRE_CLIENT_SECRET`: the Quire OAuth app client secret.
- `QUIRE_REDIRECT_URI`: the exact Chrome identity redirect URL, `https://<extension-id>.chromiumapp.org/`.
- `ALLOWED_EXTENSION_ORIGIN`: the extension origin, `chrome-extension://<extension-id>`.

Register the redirect URL in the Quire OAuth app. Use the published extension ID for production; unpacked installs may have a different
ID and therefore require a matching OAuth redirect and CORS origin. If you deploy the API elsewhere, update `app/modules/app.config.js`
and its host permission in `app/manifest.json`. Run `npm install` and `npm run typecheck` in `quire-anywhere/`. The extension source remains
JavaScript and has no build step. Never commit environment values.
