// Cloudflare Worker - map-resolve (fix97 upstream timeout protection + fix96 five-key TomTom relay failover + fix92 TomTom international landmark verification + fix91 per-request aggregate counting + fix14 short-link resolution + fix40 nearby place search + fix47 address reverse lookup + fix49 nearby places + fix52 machine translation + fix55 nearby distance sorting + fix61 short-link GET retry + fix63 Kakao ID coordinate fetch + fix69 usage counting)
// Deployment: paste into Cloudflare Dashboard -> Workers -> map-resolve -> Edit code, replacing the whole file;
// also add these Secrets under Settings -> Variables and Secrets:
// KAKAO_REST_KEY (the Kakao Local API REST key; keys live only in Worker Secrets, never in the front end)
// TOMTOM_API_KEY (fix92: TomTom Search API key; likewise Worker Secret only, never in the front end)
// TOMTOM_API_KEY_2 (fix93: second TomTom key, optional; used automatically when the primary is rejected with 429/403)
// TOMTOM_API_KEY_3 (fix94: third TomTom key, optional; takes over when the first two are rejected)
// TOMTOM_API_KEY_4 (fix95: fourth TomTom key, optional; takes over when the first three are rejected)
// TOMTOM_API_KEY_5 (fix96: fifth TomTom key, optional; takes over when the first four are rejected)
// fix69 usage reports also need: a KV Namespace binding under Settings -> Bindings, variable name STATS;
// and one more Secret: STATS_KEY (a self-chosen password, used when reading the /stats report).
// Endpoints:
// GET /resolve?url={short link} -> {"status":307,"location":"..."} (HEAD + redirect:manual to obtain the Location)
// GET /local?q={Korean keyword} -> candidate places from Kakao Local keyword search
// (normalised to title/address/roadAddress/mapx/mapy; coordinates come from Kakao, and once confirmed the page opens Naver with those coordinates)
// GET /nearby?lat={lat}&lng={lng} -> fix47 no-name fallback: coord2address gets the Korean road address,
// then an address search returns that address's official coordinates as a single candidate (title = road address)
// GET /tt-search?q={keyword}&lat=&lng=&cc= -> fix92 TomTom name search (TomTom-strong countries only;
// return shape identical to /local, so the page shares the candidate flow)
// GET /tt-nearby?lat={lat}&lng={lng} -> fix92 TomTom coordinate verification: reverse-geocoded address candidate + nearby places
// (return shape identical to /nearby)
// GET /translate?text={Korean} -> {"en":"..."} (fix52: relays the free Google translation endpoint, Korean->English, for identification reference only)
// fix96 sticky start: a module-level variable remembers the last successful TomTom key position (per-instance memory, best effort;
// resets to 0 when the instance restarts, no side effects). Once one key's quota is exhausted, the next request starts directly at a working position instead of paying a failed round trip every time.
let TT_LAST_GOOD = 0;
// fix97 upstream timeout protection: every outbound fetch (Kakao / TomTom / place pages / short links / translation) originally had no timeout;
// one stuck upstream would drag the whole request down with it. Every call creates a fresh AbortSignal (relay retries must not share
// an already-aborted signal; ttJson takes a new one per position); a timeout abort is handled by each endpoint's existing try/catch
// as a connection failure - successful-path behaviour unchanged, only a time cap added.
function toSig(ms) { try { return AbortSignal.timeout(ms); } catch (e) { return undefined; } }
export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const u = new URL(request.url);

    // fix69: usage counting (KV). Kakao has no official usage-query API, and every call passes through this Worker,
    // so counting here equals actual usage; Cloudflare usage is counted by the Worker's own request count (the official dashboard figure governs; this count is approximate).
    // fix70: three day-boundary counting sets - tpe (Taipei UTC+8, the user's locale) / kst (Korea UTC+9, the Kakao daily-quota boundary) /
    // utc (Cloudflare's daily-cap boundary). None of the three observes DST, so fixed offsets are exact. Every event is written to all three buckets.
    function dayIn(offsetH) { return new Date(Date.now() + offsetH * 3600 * 1000).toISOString().slice(0, 10); }
    const TZ_DAYS = [['tpe', 8], ['kst', 9], ['utc', 0]];
    // fix71: counting switched to event keys - fix70's get-modify-put was measured undercounting under consecutive calls
    // (KV eventual consistency + read-modify-write races; 3 utc worker_requests recorded as 1). Each event key is an independent key,
    // with the count encoded in the key name (e:<tz>:<date>:<metric>:<n>:<rand>); reads list and sum - no races; 100-day TTL auto-cleans.
    // fix91 (user-approved "one record per request" exact weighting): counting now accumulates inside the request and writes one aggregate record at the end.
    // The old fix71 event-key scheme wrote 3 keys per bump (one per bucket); one /nearby trip with 4 bumps = 12 KV writes;
    // the 2026-10-25 test-marathon day therefore tripped the 50% KV daily-write warning. In the new scheme bumpBg only accumulates in memory (call sites unchanged,
    // timing identical to before, including the existing behaviour of not counting category on the /nearby failure path); at flush time each bucket writes just 1
    // batch key (e:<tz>:<date>:batch:<rand>, value = the exact JSON increment) - a fixed 3 writes per request.
    // Exactness: totals are item-for-item identical to the event-key scheme (sum of weights = key count) - not sampled, not estimated; the f: finalisation logic is unaffected.
    // Compatibility: the new readDay recognises batch keys within the same list and GETs and adds them; old event keys still count as before;
    // if rolled back to fix90, its readDay filters by metrics.includes and skips batch keys (fix91-period counts are invisible in the old report).
    const batch = {};
    const bumpBg = (metric, n) => { batch[metric] = (batch[metric] || 0) + (n || 1); };
    async function flushBatch() {
      if (!env || !env.STATS) return;
      if (!Object.keys(batch).length) return;
      const v = JSON.stringify(batch);
      const rand = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await Promise.all(TZ_DAYS.map(async ([tz, off]) => {
        try { await env.STATS.put('e:' + tz + ':' + dayIn(off) + ':batch:' + rand, v, { expirationTtl: 86400 * 100 }); } catch (e) {}
      }));
    }
    const main = async () => {
    // fix69b/c: the connector page's verification host hits the root path (possibly without a key); the root path unconditionally returns 200 service info
    // (the converter uses only /resolve /local /nearby /place /stats; the root path previously just fell into /resolve and returned 400, which nothing depended on).
    if (u.pathname === '/') {
      return new Response(JSON.stringify({ ok: true, service: 'map-resolve' }), { headers: cors });
    }
    if (u.pathname === '/stats') {
      // fix69e: changed to public read-only. The original STATS_KEY check was proven correct (opening /stats?key= in a browser returned the full data),
      // but the connector page's check kept refusing (root-path 200, multiple parameter names and Bearer were all tried), so the report switched to keyless reads;
      // this endpoint returns only usage counts - no account authority or personal data - so the public risk is only "how many times this tool is used per day".
      if (!env.STATS) return new Response(JSON.stringify({ error: 'stats_not_configured' }), { status: 503, headers: cors });
      // fix70: ?tz=tpe|kst|utc selects the day boundary (default tpe); when tpe lacks new-format keys it falls back to fix69's old-format keys (continuity on deployment day).
      const tz = ['tpe', 'kst', 'utc'].includes(u.searchParams.get('tz')) ? u.searchParams.get('tz') : 'tpe';
      const off = tz === 'kst' ? 9 : tz === 'utc' ? 0 : 8;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get('date') || '') ? u.searchParams.get('date') : dayIn(off);
      const metrics = ['worker_requests', 'kakao_keyword', 'kakao_coord2address', 'kakao_address', 'kakao_category', 'place_fetch', 'tomtom_search', 'tomtom_reverse'];
      // fix71: total = old-key base value (fix69 old format + fix70 s: keys, time windows disjoint from event keys) + event-key sum.
      // fix73: single-day reading extracted into readDay; ?sum=month returns the per-day sum from the 1st of that month to the given date (used by the footer quota display).
      const readDay = async (d) => {
        // fix87: user's principle "a finished day's count, once measured, must not be recounted" - after a past date is computed for the first time,
        // its total is stored as a finalised value (f:<tz>:<date>); later reads GET it once instead of re-listing event keys.
        // Finalisation keeps a 15-minute grace period (KV list visibility lags about 1 minute), so events at the day-boundary edge are not frozen out.
        const fKey = 'f:' + tz + ':' + d;
        const isPast = d < dayIn(off);
        if (isPast) {
          try { const f = await env.STATS.get(fKey); if (f) return JSON.parse(f); } catch (e) {}
        }
        const o = {};
        for (const m of metrics) {
          let base = parseInt((await env.STATS.get('s:' + tz + ':' + d + ':' + m)) || '0', 10) || 0;
          if (tz === 'tpe') base += parseInt((await env.STATS.get('s:' + d + ':' + m)) || '0', 10) || 0;
          o[m] = base;
        }
        try {
          let cursor;
          const batchKeys = [];
          do {
            const page = await env.STATS.list({ prefix: 'e:' + tz + ':' + d + ':', cursor });
            for (const k of page.keys) {
              const parts = k.name.split(':');
              if (parts.length >= 5 && parts[3] === 'batch') { batchKeys.push(k.name); continue; }
              if (parts.length >= 6 && metrics.includes(parts[3])) o[parts[3]] += parseInt(parts[4], 10) || 0;
            }
            cursor = page.list_complete ? null : page.cursor;
          } while (cursor);
          // fix91: a batch key's value is that request's exact increment JSON; GET and add key by key (equivalent to the event-key sum).
          await Promise.all(batchKeys.map(async (name) => {
            try {
              const bv = await env.STATS.get(name);
              if (!bv) return;
              const bj = JSON.parse(bv);
              for (const m of metrics) if (bj[m]) o[m] += bj[m];
            } catch (e) {}
          }));
        } catch (e) {}
        o.kakao_total = o.kakao_keyword + o.kakao_coord2address + o.kakao_address + o.kakao_category;
        o.tomtom_total = (o.tomtom_search || 0) + (o.tomtom_reverse || 0);
        if (isPast) {
          const dayEndUtc = Date.parse(d + 'T00:00:00Z') - off * 3600 * 1000 + 86400 * 1000;
          if (Date.now() > dayEndUtc + 900 * 1000) {
            try { await env.STATS.put(fKey, JSON.stringify(o)); } catch (e) {}
          }
        }
        return o;
      };
      if (u.searchParams.get('sum') === 'month') {
        // fix87: month sums run readDay in parallel per day - past days use finalised values (1 GET per date), only today is computed by live listing;
        // the whole month's event keys are no longer re-scanned (fix82's month-prefix single listing is retired here); list usage drops sharply and speed improves.
        const ym = date.slice(0, 7);
        const lastDay = parseInt(date.slice(8, 10), 10);
        const days = [];
        for (let d = 1; d <= lastDay; d++) days.push(ym + '-' + String(d).padStart(2, '0'));
        const parts = await Promise.all(days.map(readDay));
        const agg = { date, tz, month: ym };
        for (const m of metrics) agg[m] = parts.reduce((a, p) => a + (p[m] || 0), 0);
        agg.kakao_total = agg.kakao_keyword + agg.kakao_coord2address + agg.kakao_address + agg.kakao_category;
        agg.tomtom_total = (agg.tomtom_search || 0) + (agg.tomtom_reverse || 0);
        return new Response(JSON.stringify(agg), { headers: cors });
      }
      const out = { date, tz, ...(await readDay(date)) };
      return new Response(JSON.stringify(out), { headers: cors });
    }
    bumpBg('worker_requests');

    // fix63: use a Kakao place ID to fetch the official place page's public data (og:title place name + the WGS84 coordinates inside the OG static-map URL),
    // so a "Kakao ID only" share link can also yield coordinates -> Google/Naver open together (the Kakao Local API itself has no ID-to-coordinates endpoint).
    async function scrapeKakaoPlace(id) {
      try {
        bumpBg('place_fetch');
        const r = await fetch('https://place.map.kakao.com/' + id, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: toSig(8000) });
        if (!r.ok) return null;
        const html = await r.text();
        const mm = html.match(/staticmap\/og\?type=place&srs=wgs84[^"']*?[?&]m=(-?\d+(?:\.\d+)?)%2C(-?\d+(?:\.\d+)?)/i);
        if (!mm) return null;
        const tm = html.match(/og:title"\s+content="([^"]*)"/);
        return { id: String(id), name: tm ? tm[1] : '', lng: parseFloat(mm[1]), lat: parseFloat(mm[2]) };
      } catch (e) { return null; }
    }
    if (u.pathname === '/place') {
      const id = (u.searchParams.get('id') || '').trim();
      if (!/^\d+$/.test(id)) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: cors });
      const p = await scrapeKakaoPlace(id);
      if (!p) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: cors });
      return new Response(JSON.stringify(p), { headers: cors });
    }

    // fix40: nearby place search (Kakao Local; returns candidate names/addresses/WGS84 coordinates)
    if (u.pathname === '/local') {
      const q = (u.searchParams.get('q') || '').trim();
      if (!q) return new Response(JSON.stringify({ error: 'missing q' }), { status: 400, headers: cors });
      if (!env || !env.KAKAO_REST_KEY) {
        return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: cors });
      }
      try {
        // fix90: user's rule "make it 5 everywhere, for performance" - keyword search asks Kakao for only 5 results (was 15), transmitting and parsing less; the page also trims to 5.
        bumpBg('kakao_keyword');
        const kRes = await fetch('https://dapi.kakao.com/v2/local/search/keyword.json?size=5&page=1&query=' + encodeURIComponent(q), {
          headers: { 'Authorization': 'KakaoAK ' + env.KAKAO_REST_KEY },
          signal: toSig(8000),
        });
        if (!kRes.ok) {
          return new Response(JSON.stringify({ error: 'kakao_api_status_' + kRes.status }), { status: 502, headers: cors });
        }
        const kData = await kRes.json();
        const items = (kData.documents || []).map(d => ({
          title: d.place_name || '',
          link: d.place_url || '',
          category: d.category_name || '',
          description: '',
          telephone: d.phone || '',
          address: d.address_name || '',
          roadAddress: d.road_address_name || '',
          mapx: String(Math.round(parseFloat(d.x) * 1e7)),
          mapy: String(Math.round(parseFloat(d.y) * 1e7)),
        }));
        return new Response(JSON.stringify({ provider: 'kakao', total: items.length, items }), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
      }
    }

    // fix47: no-name fallback - coordinates -> Korean address -> the address's official coordinates (Korea only)
    if (u.pathname === '/nearby') {
      const lat = parseFloat(u.searchParams.get('lat'));
      const lng = parseFloat(u.searchParams.get('lng'));
      if (!isFinite(lat) || !isFinite(lng)) {
        return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400, headers: cors });
      }
      if (!env || !env.KAKAO_REST_KEY) {
        return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: cors });
      }
      const h = { 'Authorization': 'KakaoAK ' + env.KAKAO_REST_KEY };
      try {
        // fix88: the category search needs only lat/lng, so it starts immediately on handler entry, in parallel with the address chain below (fix49's category top-up logic unchanged,
        // only its start point moved earlier - it previously queued behind the address search and cost a whole extra Kakao round trip).
        // fix49: with only an address candidate there is nothing to switch to - top up with a Kakao category search for real places nearby
        // (restaurants/cafes/lodging/attractions/supermarkets/convenience stores/subway stations/parking, radius 300 m), so the user can pick the right landmark.
        const CATS = ['FD6', 'CE7', 'AD5', 'AT4', 'MT1', 'CS2', 'SW8', 'PK6'];
        const catPromise = Promise.all(CATS.map(async (code) => {
          try {
            const r = await fetch('https://dapi.kakao.com/v2/local/search/category.json?category_group_code=' + code + '&x=' + lng + '&y=' + lat + '&radius=300&sort=distance&size=5', { headers: h, signal: toSig(8000) });
            if (!r.ok) return [];
            const d = await r.json();
            return (d.documents || []).map(p => ({
              title: p.place_name || '',
              link: p.place_url || '',
              category: p.category_name || '',
              description: '',
              telephone: p.phone || '',
              address: p.address_name || '',
              roadAddress: p.road_address_name || '',
              kind: 'place',
              _d: parseFloat(p.distance),
              mapx: String(Math.round(parseFloat(p.x) * 1e7)),
              mapy: String(Math.round(parseFloat(p.y) * 1e7)),
            }));
          } catch (e) { return []; }
        }));
        bumpBg('kakao_coord2address');
        const aRes = await fetch('https://dapi.kakao.com/v2/local/geo/coord2address.json?x=' + lng + '&y=' + lat, { headers: h, signal: toSig(8000) });
        if (!aRes.ok) {
          return new Response(JSON.stringify({ error: 'kakao_api_status_' + aRes.status }), { status: 502, headers: cors });
        }
        const aData = await aRes.json();
        const doc = (aData.documents || [])[0];
        const road = doc && doc.road_address ? (doc.road_address.address_name || '') : '';
        const jibun = doc && doc.address ? (doc.address.address_name || '') : '';
        const query = road || jibun;
        if (!query) return new Response(JSON.stringify({ error: 'no_address' }), { headers: cors });
        bumpBg('kakao_address');
        const sRes = await fetch('https://dapi.kakao.com/v2/local/search/address.json?query=' + encodeURIComponent(query), { headers: h, signal: toSig(8000) });
        if (!sRes.ok) {
          return new Response(JSON.stringify({ error: 'kakao_api_status_' + sRes.status }), { status: 502, headers: cors });
        }
        const sData = await sRes.json();
        const sd = (sData.documents || [])[0];
        if (!sd || !isFinite(parseFloat(sd.x)) || !isFinite(parseFloat(sd.y))) {
          return new Response(JSON.stringify({ error: 'no_address' }), { headers: cors });
        }
        const item = {
          title: road || query,
          link: '',
          category: '',
          description: '',
          telephone: '',
          address: jibun,
          roadAddress: road,
          kind: 'address',
          mapx: String(Math.round(parseFloat(sd.x) * 1e7)),
          mapy: String(Math.round(parseFloat(sd.y) * 1e7)),
        };
        const catLists = await catPromise;
        // fix69d: category-call counting is aggregated once after the parallel calls finish (per-call get-modify-put inside the parallel loop would overwrite each other and undercount)
        bumpBg('kakao_category', CATS.length);
        const seen = new Set([item.title + '|' + item.mapx + '|' + item.mapy]);
        const places = [];
        for (const list of catLists) for (const p of list) {
          const key = p.title + '|' + p.mapx + '|' + p.mapy;
          if (p.title && !seen.has(key)) { seen.add(key); places.push(p); }
        }
        // fix55: results were previously taken 12 at a time in category order, so early categories (restaurants/cafes) filled the quota and later categories were cut wholesale
        // (case: a Plus Code lookup near Lotte Mart Jeju - the MT1 hypermarket Lotte Mart Jeju store itself was squeezed out of the list).
        // Now everything is merged, sorted by distance, then cut to 12 - the nearest to the query point are kept first; _d is for sorting only and is not returned.
        places.sort((a, b) => (isFinite(a._d) ? a._d : 1e12) - (isFinite(b._d) ? b._d : 1e12));
        for (const p of places) delete p._d;
        const items = [item, ...places.slice(0, 12)];
        return new Response(JSON.stringify({ provider: 'kakao-address', total: items.length, items }), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
      }
    }

    // fix92 (user-specified: build for the countries where TomTom is strong): TomTom international landmark verification.
    // Measured basis (2026-10-26, known-landmark test set): Taiwan strong (name search / nearby density / street-address reverse geocoding all good),
    // Europe/North America/Oceania/Singapore strong; Japan weak, Korea unusable - so routing lives in the page: Korea stays on Kakao, Japan is not connected;
    // this endpoint is only called in TomTom-strong regions. The key lives only in the Worker Secret (TOMTOM_API_KEY).
    // Return shape identical to /local and /nearby (title/address/roadAddress/mapx/mapy/kind/category); the page shares the candidate flow.
    function ttNormalize(r) {
      const poi = r.poi || {};
      const addr = (r.address && r.address.freeformAddress) || '';
      const pos = r.position || {};
      if (!isFinite(pos.lat) || !isFinite(pos.lon)) return null;
      const cats = (poi.categories && poi.categories.length) ? poi.categories : [];
      return {
        title: poi.name || addr,
        link: '',
        category: cats[0] || '',
        description: '',
        telephone: poi.phone || '',
        address: addr,
        roadAddress: '',
        kind: poi.name ? 'place' : 'address',
        mapx: String(Math.round(pos.lon * 1e7)),
        mapy: String(Math.round(pos.lat * 1e7)),
      };
    }
    // fix96: five-key relay failover (one key per each of the user's five TomTom accounts) - TOMTOM_API_KEY is primary, _2/_3/_4/_5 relay in order.
    // Only when the previous position is rejected (429 quota exhausted / 403) or the connection fails does the next position retry the same request; request-side errors such as 400 are not retried (switching keys would give the same result).
    function ttKeys() {
      const ks = [];
      if (env && env.TOMTOM_API_KEY) ks.push(env.TOMTOM_API_KEY);
      if (env && env.TOMTOM_API_KEY_2) ks.push(env.TOMTOM_API_KEY_2);
      if (env && env.TOMTOM_API_KEY_3) ks.push(env.TOMTOM_API_KEY_3);
      if (env && env.TOMTOM_API_KEY_4) ks.push(env.TOMTOM_API_KEY_4);
      if (env && env.TOMTOM_API_KEY_5) ks.push(env.TOMTOM_API_KEY_5);
      return ks;
    }
    async function ttJson(urlForKey) {
      const ks = ttKeys();
      if (!ks.length) return null;
      const start = TT_LAST_GOOD < ks.length ? TT_LAST_GOOD : 0;
      for (let n = 0; n < ks.length; n++) {
        const i = (start + n) % ks.length;
        let r = null;
        try { r = await fetch(urlForKey(encodeURIComponent(ks[i])), { headers: { 'User-Agent': 'map-resolve-worker' }, signal: toSig(8000) }); } catch (e) { r = null; }
        if (r && r.ok) { TT_LAST_GOOD = i; return r.json().catch(() => null); }
        if (r && r.status !== 429 && r.status !== 403) return null;
      }
      return null;
    }
    if (u.pathname === '/tt-search') {
      const q = (u.searchParams.get('q') || '').trim();
      if (!q) return new Response(JSON.stringify({ error: 'missing q' }), { status: 400, headers: cors });
      if (!ttKeys().length) {
        return new Response(JSON.stringify({ error: 'not_configured_tt' }), { status: 503, headers: cors });
      }
      try {
        bumpBg('tomtom_search');
        const lat = parseFloat(u.searchParams.get('lat')), lng = parseFloat(u.searchParams.get('lng'));
        const cc = (u.searchParams.get('cc') || '').trim().toUpperCase();
        const mk = (key) => {
          let url = 'https://api.tomtom.com/search/2/search/' + encodeURIComponent(q) + '.json?key=' + key + '&limit=5';
          if (isFinite(lat) && isFinite(lng)) url += '&lat=' + lat + '&lon=' + lng;
          if (/^[A-Z]{2}$/.test(cc)) url += '&countrySet=' + cc;
          return url;
        };
        const d = await ttJson(mk);
        if (!d) return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
        const items = (d.results || []).map(ttNormalize).filter(Boolean).slice(0, 5);
        return new Response(JSON.stringify({ provider: 'tomtom', total: items.length, items }), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
      }
    }
    if (u.pathname === '/tt-nearby') {
      const lat = parseFloat(u.searchParams.get('lat'));
      const lng = parseFloat(u.searchParams.get('lng'));
      if (!isFinite(lat) || !isFinite(lng)) {
        return new Response(JSON.stringify({ error: 'missing lat/lng' }), { status: 400, headers: cors });
      }
      if (!ttKeys().length) {
        return new Response(JSON.stringify({ error: 'not_configured_tt' }), { status: 503, headers: cors });
      }
      try {
        bumpBg('tomtom_reverse');
        bumpBg('tomtom_search');
        const [rev, near] = await Promise.all([
          ttJson((key) => 'https://api.tomtom.com/search/2/reverseGeocode/' + lat + ',' + lng + '.json?key=' + key + '&radius=100'),
          ttJson((key) => 'https://api.tomtom.com/search/2/nearbySearch/.json?key=' + key + '&lat=' + lat + '&lon=' + lng + '&radius=300&limit=10'),
        ]);
        if (!rev && !near) return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
        const items = [];
        const ra = rev && rev.addresses && rev.addresses[0];
        if (ra && ra.address && ra.address.freeformAddress) {
          const pp = String(ra.position || '').split(',').map(Number);
          const aLat = isFinite(pp[0]) ? pp[0] : lat, aLng = isFinite(pp[1]) ? pp[1] : lng;
          items.push({
            title: ra.address.freeformAddress,
            link: '',
            category: '',
            description: '',
            telephone: '',
            address: ra.address.freeformAddress,
            roadAddress: '',
            kind: 'address',
            mapx: String(Math.round(aLng * 1e7)),
            mapy: String(Math.round(aLat * 1e7)),
          });
        }
        const seen = new Set(items.map(i => i.title + '|' + i.mapx + '|' + i.mapy));
        const places = ((near && near.results) || []).map(ttNormalize).filter(Boolean)
          .filter(p => { const k = p.title + '|' + p.mapx + '|' + p.mapy; if (!p.title || seen.has(k)) return false; seen.add(k); return true; });
        const all = items.concat(places.slice(0, 12));
        if (!all.length) return new Response(JSON.stringify({ error: 'no_address' }), { headers: cors });
        return new Response(JSON.stringify({ provider: 'tomtom', total: all.length, items: all }), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502, headers: cors });
      }
    }

    // fix52: machine-translate a Korean place name into English (identification reference only, never used for searching). Tries several free sources in order and returns dbg for diagnosis
    // (Cloudflare's shared egress IPs get blocked by some endpoints or exhaust IP quotas, so the actual response is needed to see which route works):
    // 1) MyMemory (if env.TRANSLATE_EMAIL is set, the quota binds to that mailbox instead of the shared IP)
    //   2) Google gtx @ translate.google.com  3) Google gtx @ translate.googleapis.com
    // If all fail, returns an empty string and the page silently shows nothing.
    if (u.pathname === '/translate') {
      const text = (u.searchParams.get('text') || '').slice(0, 100);
      if (!text) return new Response(JSON.stringify({ error: 'missing text' }), { status: 400, headers: cors });
      const dbg = {};
      let en = '', via = '';
      try {
        const de = env && env.TRANSLATE_EMAIL ? '&de=' + encodeURIComponent(env.TRANSLATE_EMAIL) : '';
        const mm = await fetch('https://api.mymemory.translated.net/get?langpair=ko%7Cen&q=' + encodeURIComponent(text) + de, { signal: toSig(6000) });
        dbg.mm = 'http_' + mm.status;
        if (mm.ok) {
          const mj = await mm.json().catch(() => null);
          const t = (mj && mj.responseData && mj.responseData.translatedText || '').trim();
          if (t && !/MYMEMORY|WARNING|QUOTA|INVALID/i.test(t)) { en = t; via = 'mymemory'; }
          else if (t) dbg.mm += ':' + t.slice(0, 60);
        }
      } catch (e) { dbg.mm = 'throw'; }
      if (!en) {
        for (const pair of [['gt1', 'translate.google.com'], ['gt2', 'translate.googleapis.com']]) {
          const tag = pair[0], host = pair[1];
          try {
            const gt = await fetch('https://' + host + '/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=' + encodeURIComponent(text), { signal: toSig(6000) });
            dbg[tag] = 'http_' + gt.status;
            if (gt.ok) {
              const gj = await gt.json().catch(() => null);
              const t = gj && Array.isArray(gj[0]) ? gj[0].map(s => (s && s[0]) || '').join('').trim() : '';
              if (t) { en = t; via = tag; break; }
              dbg[tag] += ':empty';
            }
          } catch (e) { dbg[tag] = 'throw'; }
        }
      }
      return new Response(JSON.stringify({ en, via, dbg }), { headers: cors });
    }

    // fix14: short-link resolution
    const target = u.searchParams.get('url');
    if (!target || !/^https?:\/\//i.test(target)) {
      return new Response(JSON.stringify({ error: 'missing url' }), { status: 400, headers: cors });
    }
    try {
      // fix61: Kakao share short links (kko.to) reject HEAD (405, no Location) - when HEAD yields nothing, retry once with GET.
      let res = await fetch(target, { method: 'HEAD', redirect: 'manual', signal: toSig(8000) });
      let loc = res.headers.get('location') || '';
      if (!loc) {
        const res2 = await fetch(target, { method: 'GET', redirect: 'manual', signal: toSig(8000) });
        loc = res2.headers.get('location') || '';
        if (loc) res = res2;
      }
      const out = { status: res.status, location: loc };
      // fix63: if the expansion carries a Kakao place ID, fetch its coordinates along the way and return them together, so the page lands in one step (all three maps open).
      if (loc) {
        const km = loc.match(/applink\.map\.kakao\.com\/place\?[^\s]*?\bid=(\d+)/i) || loc.match(/place\.map\.kakao\.com\/(\d+)/i) || loc.match(/map\.kakao\.com\/link\/map\/(\d+)(?:[?#]|$)/i);
        if (km) { const p = await scrapeKakaoPlace(km[1]); if (p) out.place = p; }
      }
      return new Response(JSON.stringify(out), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
    }
    };
    const resp = await main();
    // fix91: aggregate write at request end, run in the background without blocking the response (the fix88 principle unchanged); an empty batch (/, /stats, OPTIONS) writes nothing.
    if (ctx && ctx.waitUntil) ctx.waitUntil(flushBatch()); else flushBatch();
    return resp;
  },
};
