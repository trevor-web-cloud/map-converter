# Map Converter — Naver / Kakao / Yahoo JP / Google Maps Link Converter

A single-page tool that converts place links and location text between map providers. Paste a Google Maps, Naver Map, Kakao Map or Yahoo! MAP (Japan) link — or a whole share text, a Plus Code, bare coordinates, or a place name — and the page produces openable links for all four providers (web and app), so a place found in one app can be opened in another with the coordinates intact.

**Live:** https://trevor-web-cloud.github.io/map-converter/

## What it does

- **Parses** Google place/`?q=`/goo.gl links, Naver place/`c=`/naver.me links, Kakao link/map, place and kko.to links, Yahoo `lat/lon` and yahoo.jp links, full and short Plus Codes (short codes are recovered against a reference city), parenthesised or bare `lat, lng` text, EPSG:3857 X/Y pairs, and whole share texts (the name line is extracted automatically).
- **Step 3 — landmark confirmation:** the pasted place is verified once against provider data (Kakao Local for Korea; TomTom for Taiwan, Singapore, Europe, North America and Oceania; an honest "no verification source" message for Japan and other regions). Candidates are shown as a list — address first, then place names grouped by category, each with a Korean→English machine-translated reference line — and tapping a row confirms it. All provider buttons then use the verified coordinates at full native 7-digit precision.
- **Step 4 — open in a map:** Google, Naver, Kakao and Yahoo web/app buttons use each provider's official handoff formats (e.g. Naver `map.naver.com/?lat=&lng=&menu=location`, Kakao `/link/map/{placeID}`, Yahoo `/place/?lat=&lon=`), ID-based opening where an ID exists (Google ftid, Naver pinId, Kakao place ID), plus Uber / Kakao T / k.ride ride-hailing links with the destination prefilled or copied.
- **Trilingual UI** (Traditional Chinese / English / Indonesian, switchable at the top; `?lang=` supported). Conversion and queries always use Korean original names where a provider requires them; candidate reference translations are always Korean→English regardless of the UI language.
- The footer shows today's remaining Kakao query quota (daily only), read from the Worker's public `/stats` endpoint.

## Backend

All provider API calls go through a Cloudflare Worker:

- Endpoint: `https://map-resolve.map-converter.workers.dev` (`/resolve`, `/local`, `/nearby`, `/place`, `/stats`, `/tt-search`, `/tt-nearby`)
- Source: `worker.js` in this repository. Keys (Kakao REST key, TomTom API keys) are held **only as Worker Secrets in Cloudflare — never in this repository** — and usage is counted in a KV namespace bound as `STATS`.

## Testing — the coverage matrix rule

`test_matrix.cjs` + `test_rows.js` run the page's script in Node against a fake DOM and fixture-backed Worker responses, covering every input form, region, provider panel and state transition (94 rows). `COVERAGE_MATRIX.md` documents each row and the full change/test history.

**Rule: on every version change, run the matrix locally before deploy (`node test_matrix.cjs index.html`) and again against the live deployed HTML after deploy. All rows must PASS, and each run is recorded in `COVERAGE_MATRIX.md`.** For a new feature or a new field report, add the row first, then change the code.

## Version

Current page version: **v2026-11-03-fix110** (standalone repository migration, English edition; see `COVERAGE_MATRIX.md` for the fix110 entry and all prior history). Current Worker version: fix97.
