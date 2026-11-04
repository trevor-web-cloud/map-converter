// map-converter coverage-matrix automated tests (COVERAGE_MATRIX.md)
// Loads the page <script> in Node with a fake DOM; the Worker is replaced by fixtures in the real response shape.
// Usage: node test_matrix.cjs [htmlPath]
const fs = require('fs');
const htmlPath = process.argv[2] || 'index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
global.PAGE_HTML = html;
global.FETCH_LOG = [];
global.FETCH_OPTS = [];
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const footer = (html.match(/v\d{4}-\d{2}-\d{2}-fix\d+/) || ['?'])[0];

// ---------- fake DOM ----------
function makeEl(id) {
  return { id, value: '', textContent: '', href: '', hidden: false, open: false, style: {}, _l: {},
    addEventListener(t, f) { (this._l[t] ||= []).push(f); },
    dispatch(t) { (this._l[t] || []).forEach(f => f({ preventDefault() {} })); },
    focus() {} };
}
const registry = new Map();
const detailsAdv = [makeEl('d1'), makeEl('d2')];
const exBtns = ['pluscode', 'shortcode', 'google', 'naver', 'kakao', 'yahoo', 'address'].map(k => { const e = makeEl('ex-' + k); e.dataset = { ex: k }; return e; });
global.document = {
  getElementById(id) { if (!registry.has(id)) registry.set(id, makeEl(id)); return registry.get(id); },
  querySelectorAll(sel) { if (sel === 'details.advanced') return detailsAdv; if (sel === '.ex-btn') return exBtns; return []; },
};
global.window = { setTimeout: global.setTimeout, open() {} };
global.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
global.navigator = {};

// ---------- Worker fixtures (real response shapes) ----------
const NAVER_RESOLVED = 'https://map.naver.com/?lng=126.9851666&version=2&appMenu=location&menu=location&lat=37.5634829&title=%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%901%ED%98%B8%EC%A0%90&pinType=site&pinId=18039088&app=Y';
const LOTTE_RESOLVED = 'https://www.google.com/maps/place/%E6%A8%82%E5%A4%A9%E8%B6%85%E5%B8%82+%E6%BF%9F%E5%B7%9E%E5%BA%97/data=!3m1!4b1!4m4!3m3!1s0x350cfbaa5212613b:0x5bbf0d68a7dc6ce8!16s%2Fg%2F1vc7_kpy!20s8Q58FFJJ%2BXHR?entry=tts';
const SAMRANGJIN_RESOLVED = 'https://www.google.com/maps/search/?api=1&query=%EC%82%BC%EB%9E%91%EC%A7%84%EC%83%9D%ED%83%9C%EB%AC%B8%ED%99%94%EA%B3%B5%EC%9B%90&ftid=0x3568bb1435d6becb%3A0x8aba633314c7db88';
const YAHOO_RESOLVED = 'https://map.yahoo.co.jp/place/?lat=35.633670&lon=139.791520&z=17';
const KAKAO_RESOLVED = 'https://applink.map.kakao.com/place?id=338712143&t_src=share&t_ch=copy_url&t_obj=place';
const NAVER_ID_RESOLVED = 'https://map.naver.com/p/entry/place/1943436990?placePath=%2Fhome';
const NAVER_FULL_RESOLVED = 'https://map.naver.com/?version=2&lat=35.098606&title=Beurosiseu%20HOTEL&lng=129.0309021&app=Y&pinType=site&menu=location&pinId=1533218484&appMenu=location';
const YAHOO_CENTER_RESOLVED = 'https://map.yahoo.co.jp/place/?lat=35.09787&lon=129.03090&z=17&zoom=17&maptype=basic';
const LOCAL_FIXTURES = [
  ['Brosis Hotel', { provider: 'kakao', total: 1, items: [
    { title: '브로시스호텔', address: '부산 중구 남포동4가 5-3', roadAddress: '부산 중구 구덕로48번길 4', mapx: '1290308898', mapy: '350985955', link: 'http://place.map.kakao.com/338712143', category: '여행 > 숙박 > 여관,모텔', telephone: '051-256-5818' }] }],
  ['해동용궁사', { provider: 'kakao', total: 1, items: [
    { title: '해동용궁사', address: '부산 기장군 기장읍 시랑리 416-3', roadAddress: '부산 기장군 기장읍 용궁길 86', mapx: '1292231431', mapy: '351884028', link: 'http://place.map.kakao.com/8606230', category: '문화,예술 > 종교 > 불교 > 절,사찰', telephone: '051-722-7744' }] }],
  ['구덕로48번길', { provider: 'kakao', total: 2, items: [
    { title: '브로시스호텔', address: '부산 중구 남포동4가 5-3', roadAddress: '부산 중구 구덕로48번길 4', mapx: '1290308898', mapy: '350985955', link: 'http://place.map.kakao.com/338712143', category: '여행 > 숙박 > 여관,모텔', telephone: '051-256-5818' },
    { title: '남포정', address: '부산 중구 남포동4가 5-1', roadAddress: '부산 중구 구덕로48번길 4', mapx: '1290308300', mapy: '350986100', link: 'http://place.map.kakao.com/9613055', category: '음식점 > 한식', telephone: '' }] }],
  ['많은', { provider: 'kakao', total: 8, items: [{ title: '많은가게01', address: '서울 중구 테스트로 1', roadAddress: '서울 중구 테스트로 1', mapx: '1269851700', mapy: '375634700', link: 'https://place.map.kakao.com/9001', category: '음식점' }, { title: '많은가게02', address: '서울 중구 테스트로 2', roadAddress: '서울 중구 테스트로 2', mapx: '1269852400', mapy: '375635400', link: 'https://place.map.kakao.com/9002', category: '음식점' }, { title: '많은가게03', address: '서울 중구 테스트로 3', roadAddress: '서울 중구 테스트로 3', mapx: '1269853100', mapy: '375636100', link: 'https://place.map.kakao.com/9003', category: '음식점' }, { title: '많은가게04', address: '서울 중구 테스트로 4', roadAddress: '서울 중구 테스트로 4', mapx: '1269853800', mapy: '375636800', link: 'https://place.map.kakao.com/9004', category: '음식점' }, { title: '많은가게05', address: '서울 중구 테스트로 5', roadAddress: '서울 중구 테스트로 5', mapx: '1269854500', mapy: '375637500', link: 'https://place.map.kakao.com/9005', category: '음식점' }, { title: '많은가게06', address: '서울 중구 테스트로 6', roadAddress: '서울 중구 테스트로 6', mapx: '1269855200', mapy: '375638200', link: 'https://place.map.kakao.com/9006', category: '음식점' }, { title: '많은가게07', address: '서울 중구 테스트로 7', roadAddress: '서울 중구 테스트로 7', mapx: '1269855900', mapy: '375638900', link: 'https://place.map.kakao.com/9007', category: '음식점' }, { title: '많은가게08', address: '서울 중구 테스트로 8', roadAddress: '서울 중구 테스트로 8', mapx: '1269856600', mapy: '375639600', link: 'https://place.map.kakao.com/9008', category: '음식점' }] }],
  ['분점', { provider: 'kakao', total: 1, items: [{ title: '명동교자 분점', address: '서울 중구 명동2가 33-4', roadAddress: '서울 중구 명동10길 8', mapx: '1269851365', mapy: '375634555', link: 'http://place.map.kakao.com/18577297', category: '', telephone: '' }] }],
  ['명동교자', { provider: 'kakao', total: 1, items: [{ title: '명동교자 분점', address: '서울 중구 명동10길 8', roadAddress: '서울 중구 명동10길 8', mapx: '1269851365', mapy: '375634555', link: 'https://place.map.kakao.com/18577297', category: '음식점' }] }],
  ['가야테마', { provider: 'kakao', total: 2, items: [
    { title: '김해가야테마파크', address: '경남 김해시 어방동 964', roadAddress: '경남 김해시 가야테마길 161', mapx: '1288937493', mapy: '352516350', link: '', category: '', telephone: '' },
    { title: '김해가야테마파크 주차장', address: '경남 김해시 어방동 965', roadAddress: '경남 김해시 가야테마길 200', mapx: '1288970000', mapy: '352520000', link: '', category: '', telephone: '' }] }],
  ['삼랑진', { provider: 'kakao', total: 1, items: [{ title: '삼랑진생태문화공원', address: '경남 밀양시 삼랑진읍 송지리 458', roadAddress: '', mapx: '1288347000', mapy: '353994000', link: '', category: '', telephone: '' }] }],
  ['롯데호텔', { provider: 'kakao', total: 1, items: [{ title: '롯데호텔앤리조트 김해', address: '경남 김해시 장유로 505', roadAddress: '경남 김해시 장유로 505', mapx: '1287928000', mapy: '351917000', link: 'http://place.map.kakao.com/27584217', category: '', telephone: '' }] }],
  ['없는가게', { provider: 'kakao', total: 0, items: [] }],
  ['설정안됨', { error: 'not_configured' }],
];
global.fetch = async (url, opts) => {
  const u = String(url);
  global.FETCH_LOG.push(u);
  global.FETCH_OPTS.push(opts && opts.signal ? 'sig' : 'nosig');
  let body = { error: 'no fixture' };
  if (u.includes('/stats')) {
    if (u.includes('sum=month')) body = { date: '2026-10-24', tz: 'kst', month: '2026-10', worker_requests: 900, kakao_keyword: 300, kakao_coord2address: 600, kakao_address: 600, kakao_category: 1500, place_fetch: 200, kakao_total: 30000 };
    else if (u.includes('tz=utc')) body = { date: '2026-10-24', tz: 'utc', worker_requests: 250, kakao_keyword: 0, kakao_coord2address: 0, kakao_address: 0, kakao_category: 0, place_fetch: 0, kakao_total: 0 };
    else body = { date: '2026-10-24', tz: 'kst', worker_requests: 40, kakao_keyword: 100, kakao_coord2address: 200, kakao_address: 300, kakao_category: 500, place_fetch: 60, kakao_total: 1100 };
  } else if (u.includes('/resolve')) {
    const target = decodeURIComponent(u.split('url=')[1] || '');
    if (target.includes('FP8gOoAY')) body = { status: 302, location: NAVER_RESOLVED };
    else if (target.includes('8jUa4Jxcuvq4KEk78')) body = { status: 302, location: LOTTE_RESOLVED };
    else if (target.includes('SAMRANGJIN')) body = { status: 302, location: SAMRANGJIN_RESOLVED };
    else if (target.includes('6aiq7W')) body = { status: 301, location: YAHOO_CENTER_RESOLVED };
    else if (target.includes('yahoo')) body = { status: 302, location: YAHOO_RESOLVED };
    else if (target.includes('qobmRiH')) body = { status: 301, location: KAKAO_RESOLVED, place: { id: '338712143', name: '브로시스호텔', lat: 35.0985955, lng: 129.0308898 } };
    else if (target.includes('JuV3NbSRyw')) body = { status: 301, location: 'https://applink.map.kakao.com/place?id=11334932&t_src=share&t_ch=copy_url&t_obj=place', place: { id: '11334932', name: '제주 파크사이드 호텔', lat: 33.4924038, lng: 126.4907929 } };
    else if (target.includes('52R5JVa5')) body = { status: 307, location: NAVER_ID_RESOLVED };
    else if (target.includes('GcAsfvpu')) body = { status: 307, location: NAVER_FULL_RESOLVED };
  } else if (u.includes('/place?')) {
    if (u.includes('id=338712143')) body = { id: '338712143', name: '브로시스호텔', lat: 35.0985955, lng: 129.0308898 };
    else body = { error: 'not_found' };
  } else if (u.includes('/tt-nearby') && u.includes('lat=25.03')) {
    // fix102 shape retained; fix112 (security audit run-1 remediation): the Pingzhen field-test fixture was replaced with
    // Taipei 101 public-landmark data - no precise non-public points in test data.
    body = { provider: 'tomtom', total: 3, items: [
      { title: '台北市信義區信義路五段7號', address: '110615台北市信義區信義路五段7號', roadAddress: '', kind: 'address', mapx: '1215646040', mapy: '250335240', link: '', category: '', telephone: '' },
      { title: '台北101觀景台', address: '台北市信義區信義路五段7號89樓', roadAddress: '', kind: 'place', mapx: '1215645600', mapy: '250335600', link: '', category: 'Attraction', telephone: '' },
      { title: '台北101購物中心', address: '台北市信義區信義路五段7號', roadAddress: '', kind: 'place', mapx: '1215646000', mapy: '250335500', link: '', category: 'Shopping', telephone: '' }] };
  } else if (u.includes('/tt-nearby') && u.includes('lat=52.51')) {
    // fix102: TomTom Europe (Berlin Brandenburg Gate field-test shape)
    body = { provider: 'tomtom', total: 2, items: [
      { title: 'Pariser Platz 1, 10117 Berlin', address: 'Pariser Platz 1, 10117 Berlin', roadAddress: '', kind: 'address', mapx: '133776000', mapy: '525163000', link: '', category: '', telephone: '' },
      { title: 'Brandenburger Tor', address: 'Pariser Platz, 10117 Berlin', roadAddress: '', kind: 'place', mapx: '133777220', mapy: '525162670', link: '', category: 'Attraction', telephone: '' }] };
  } else if (u.includes('/tt-nearby')) {
    body = { provider: 'tomtom', total: 0, items: [] };
  } else if (u.includes('/tt-search')) {
    const q = decodeURIComponent((u.match(/[?&]q=([^&]*)/) || [])[1] || '');
    if (q.includes('信義路五段') && q.includes('信義區')) body = { provider: 'tomtom', total: 2, items: [
      { title: '7, 信義路五段, 信義區, 台北市 110615', address: '7, 信義路五段, 信義區, 台北市 110615', roadAddress: '', kind: 'address', mapx: '1215646040', mapy: '250335240', link: '', category: '', telephone: '' },
      { title: '信義路五段91巷, 信義區, 台北市', address: '信義路五段91巷, 信義區, 台北市', roadAddress: '', kind: 'address', mapx: '1215709330', mapy: '250337020', link: '', category: '', telephone: '' }] };
    else if (q.includes('信義路')) body = { provider: 'tomtom', total: 1, items: [
      { title: '信義路, 永和區, 新北市', address: '信義路, 永和區, 新北市', roadAddress: '', kind: 'address', mapx: '1215120000', mapy: '249990000', link: '', category: '', telephone: '' }] };
    else if (q.includes('台北車站')) body = { provider: 'tomtom', total: 1, items: [
      { title: '台北車站', address: '100009台北市中正區北平西路3號', roadAddress: '', kind: 'place', mapx: '1215170290', mapy: '250472450', link: '', category: 'Rail Station', telephone: '' }] };
    else body = { provider: 'tomtom', total: 0, items: [] };
  } else if (u.includes('/nearby') && u.includes('37.5666103')) {
    const items = [{ title: '서울특별시 중구 세종대로 110', address: '서울 중구 태평로1가 31', roadAddress: '서울 중구 세종대로 110', kind: 'address', mapx: '1269784000', mapy: '375666200', link: '', category: '', telephone: '' }];
    for (let i = 1; i <= 12; i++) items.push({ title: '시청가게' + String(i).padStart(2, '0'), address: '서울 중구 세종대로 ' + (110 + i), roadAddress: '', kind: 'place', mapx: String(1269783882 + i * 100), mapy: String(375666103 + i * 200), link: '', category: '음식점 > 한식', telephone: '' });
    body = { provider: 'kakao-address', total: items.length, items };
  } else if (u.includes('/nearby') && u.includes('37.4496919')) {
    body = { provider: 'kakao-address', total: 4, items: [
      { title: '인천 연수구 공항로 271', address: '인천 연수구 운서동 2851', roadAddress: '인천 연수구 공항로 271', kind: 'address', mapx: '1264524200', mapy: '374496900', link: '', category: '', telephone: '' },
      { title: '공항카페', address: '인천 연수구 운서동 2851', roadAddress: '인천 연수구 공항로 272', kind: 'place', mapx: '1264525000', mapy: '374497000', link: '', category: '음식점 > 카페', telephone: '' },
      { title: '공항역', address: '인천 연수구 운서동 2850', roadAddress: '인천 연수구 공항로 지하 271', kind: 'place', mapx: '1264526500', mapy: '374497300', link: '', category: '교통,수송 > 지하철 > 지하철역', telephone: '' },
      { title: '공항서점', address: '인천 연수구 운서동 2852', roadAddress: '인천 연수구 공항로 280', kind: 'place', mapx: '1264526800', mapy: '374497100', link: '', category: '음식점 > 카페', telephone: '' }] };
  } else if (u.includes('/nearby') && u.includes('35.1809933')) {
    body = { provider: 'kakao-address', total: 3, items: [
      { title: '경상남도 김해시 장유로 505', address: '경남 김해시 신문동 1411', roadAddress: '경상남도 김해시 장유로 505', kind: 'address', mapx: '1288256231', mapy: '351810692', link: '', category: '', telephone: '' },
      { title: '롯데호텔앤리조트 김해', address: '경남 김해시 신문동 1411', roadAddress: '경남 김해시 장유로 505', kind: 'place', mapx: '1288256188', mapy: '351810612', link: 'http://place.map.kakao.com/945755656', category: '여행 > 숙박 > 호텔', telephone: '055-725-1000' },
      { title: '먼곳가게', address: '경남 김해시 신문동 999', roadAddress: '', kind: 'place', mapx: '1288256200', mapy: '351833000', link: '', category: '음식점 > 한식', telephone: '' }] };
  } else if (u.includes('/nearby')) {
    body = { provider: 'kakao-address', total: 3, items: [
      { title: '부산 중구 구덕로 34번길 5', address: '부산 중구 남포동2가 24-1', roadAddress: '부산 중구 구덕로 34번길 5', kind: 'address', mapx: '1290310500', mapy: '350987000', link: '', category: '', telephone: '' },
      { title: '다이소 부산남포점', address: '부산 중구 남포동2가 24-2', roadAddress: '부산 중구 구덕로 34', kind: 'place', mapx: '1290308000', mapy: '350985200', link: '', category: '쇼핑 > 생활용품할인점 > 다이소', telephone: '' },
      { title: '남포역 부산1호선', address: '부산 중구 남포동1가 11', roadAddress: '부산 중구 중앙대로 지하 240', kind: 'place', mapx: '1290311000', mapy: '350984500', link: '', category: '교통,수송 > 지하철 > 지하철역', telephone: '' },
      { title: '먼곳식당', address: '부산 중구 남포동2가 30', roadAddress: '부산 중구 구덕로 40', kind: 'place', mapx: '1290314000', mapy: '350990000', link: '', category: '음식점 > 한식', telephone: '' }] };
  } else if (u.includes('translate.googleapis.com')) {
    // fix53: the page calls gtx directly; the response shape is a nested array
    const t = decodeURIComponent((u.match(/[?&]q=([^&]*)/) || [])[1] || '').replace(/\+/g, ' ');
    const TR = { '海東龍宮寺': '해동용궁사', '다이소 부산남포점': 'Daiso Busan Nampo Branch', '명동교자 분점': 'Myeongdong Gyoja Branch', '부산 중구 구덕로 34번길 5': '5, Gudeok-ro 34beon-gil, Jung-gu, Busan' };
    body = [[[TR[t] || '', t, null, null, 3]]];
  } else if (u.includes('mymemory')) {
    const t = decodeURIComponent((u.match(/[?&]q=([^&]*)/) || [])[1] || '').replace(/\+/g, ' ');
    const TRM = { '다이소 부산남포점': 'Daiso Busan Nampo', '명동교자 분점': 'Myeongdong Gyoja Branch' };
    body = { responseData: { translatedText: TRM[t] || '' } };
  } else if (u.includes('/local')) {
    const q = decodeURIComponent((u.match(/[?&]q=([^&]*)/) || [])[1] || '');
    for (const [key, val] of LOCAL_FIXTURES) if (q.includes(key)) { body = val; break; }
  }
  return { ok: true, status: 200, json: async () => body };
};

// ---------- load page script + driver in one scope ----------
const driver = `
;(async () => {
  const results = [];
  const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(r => setTimeout(r, 10)); };
  const E = id => document.getElementById(id);
  function row(id, title, fn) { return { id, title, fn }; }
  function check(list, label, cond, detail) { list.push({ label, pass: !!cond, detail: cond ? '' : String(detail ?? '') }); }
  async function pasteAndParse(text) { E('paste').value = text; E('parseBtn').dispatch('click'); await flush(); }
  async function clearAll() { E('clearBtn').dispatch('click'); await flush(); }
  let candCursor = 0;
  function candRows() { const out = []; for (let i = 0; i < 13; i++) { const el = E('candRow' + i); if (el && !el.hidden) out.push(el); } return out; }
  function candAllText() { return E('candidateHead').textContent + '\\n' + candRows().map(r => r.textContent).join('\\n'); }
  function candNext() { candCursor = (candCursor + 1) % Math.max(1, candRows().length); }
  function candYes() { const rows = candRows(); const el = rows[Math.min(candCursor, rows.length - 1)]; if (el) el.dispatch('click'); candCursor = 0; }
  function typeInto(el, text) { el.value = ''; for (const ch of text) { el.value += ch; el.dispatch('input'); } el.dispatch('change'); }
  const rows = [];
`;
const rowsSrc = fs.readFileSync(__dirname + '/test_rows.js', 'utf8');
const tail = `
  for (const r of rows) {
    const list = [];
    try { await r.fn(list); } catch (e) { list.push({ label: 'exception', pass: false, detail: e && e.stack || String(e) }); }
    results.push({ id: r.id, title: r.title, checks: list });
    await clearAll();
  }
  const fails = results.filter(r => r.checks.some(c => !c.pass));
  console.log('FOOTER ' + ${JSON.stringify(footer)});
  for (const r of results) {
    const bad = r.checks.filter(c => !c.pass);
    console.log((bad.length ? 'FAIL ' : 'PASS ') + r.id + ' ' + r.title + ' (' + r.checks.length + ' checks)');
    for (const b of bad) console.log('    ✗ ' + b.label + ' :: ' + b.detail);
  }
  console.log('TOTAL ' + results.length + ' rows, ' + (results.length - fails.length) + ' pass, ' + fails.length + ' fail');
})();
`;
eval(js + driver + rowsSrc + tail);
