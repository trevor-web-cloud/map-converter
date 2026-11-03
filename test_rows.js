// Matrix rows for test_matrix.cjs — runs in the same scope as the page script.
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const latV = () => parseFloat(E('lat').value), lngV = () => parseFloat(E('lng').value);
const st = () => E('parseStatus').textContent;

rows.push(row('G1', 'Google /place/ name + @coords (KR)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90/@37.5634829,126.9851666,17z');
  check(c, 'coords', near(latV(), 37.5634829, 1e-6) && near(lngV(), 126.9851666, 1e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'naver pin href', E('naverOpen').href === 'https://map.naver.com/?lat=' + E('lat').value + '&lng=' + E('lng').value + '&menu=location', E('naverOpen').href);
  check(c, 'google coord href', E('googleOpen').href.includes('api=1&query=' + encodeURIComponent(E('lat').value + ',' + E('lng').value)), E('googleOpen').href);
  check(c, 'yahoo href', E('yahooOpen').href === 'https://map.yahoo.co.jp/place/?lat=' + E('lat').value + '&lon=' + E('lng').value + '&z=17', E('yahooOpen').href);
}));
rows.push(row('G2', 'Google api=1&query=lat,lng（KR）', async (c) => {
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.5634375,126.9850625');
  check(c, 'coords', near(latV(), 37.5634375, 1e-6) && near(lngV(), 126.9850625, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('G3', 'Google ?q=lat,lng（JP）', async (c) => {
  await pasteAndParse('https://www.google.com/maps?q=35.676200,139.650300');
  check(c, 'coords', near(latV(), 35.6762, 1e-6) && near(lngV(), 139.6503, 1e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'yahoo href', E('yahooOpen').href.includes('lat=35.6762&lon=139.6503'), E('yahooOpen').href);
}));
rows.push(row('G4', 'Google ?q=name only (KR)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('명동교자'));
  check(c, 'name only', E('name').value.includes('명동교자') && E('lat').value === '', E('name').value + '|' + E('lat').value);
  check(c, 'google ID not found', E('googleOpen').href === '#' && E('googleOpen').textContent.includes('ID 未找到'), E('googleOpen').textContent);
  check(c, 'naver ID not found', E('naverOpen').href === '#' && E('naverOpen').textContent.includes('ID 未找到'), E('naverOpen').textContent);
  check(c, 'name fallback shown', E('googleNameFallback').style.display === '', E('googleNameFallback').style.display);
}));
rows.push(row('G5', 'goo.gl short link (Lotte Mart, fixture)', async (c) => {
  await pasteAndParse('https://maps.app.goo.gl/8jUa4Jxcuvq4KEk78');
  check(c, 'name', E('name').value.includes('樂天超市'), E('name').value);
  check(c, 'plus-code coords', near(latV(), 33.4824875, 2e-6) && near(lngV(), 126.4813906, 2e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'google coord pin', E('googleOpen').textContent.includes('座標圖釘'), E('googleOpen').textContent);
  check(c, 'naver pin href', E('naverOpen').href.startsWith('https://map.naver.com/?lat=33.4824'), E('naverOpen').href);
}));
rows.push(row('G6', 'goo.gl text + ftid only (fixture)', async (c) => {
  await pasteAndParse('https://maps.app.goo.gl/SAMRANGJIN');
  check(c, 'name', E('name').value.includes('삼랑진'), E('name').value);
  check(c, 'no coords', E('lat').value === '', E('lat').value);
  check(c, 'google ftid href', E('googleOpen').href === 'https://maps.google.com/?ftid=' + encodeURIComponent('0x3568bb1435d6becb:0x8aba633314c7db88'), E('googleOpen').href);
}));
rows.push(row('G7', 'maps.google.com/?ftid= link', async (c) => {
  await pasteAndParse('https://maps.google.com/?ftid=0x3568bb1435d6becb:0x8aba633314c7db88');
  check(c, 'google ftid href', E('googleOpen').href.includes('ftid='), E('googleOpen').href);
  check(c, 'no coords', E('lat').value === '', E('lat').value);
}));
rows.push(row('G8', 'Google !3d!4d exact coords take priority', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/test/@37.560000,126.980000,17z/data=!3d37.5634829!4d126.9851666');
  check(c, 'exact coords', near(latV(), 37.5634829, 1e-6) && near(lngV(), 126.9851666, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('N1', 'naver.me short link (fixture)', async (c) => {
  await pasteAndParse('https://naver.me/FP8gOoAY');
  check(c, 'coords', near(latV(), 37.5634829, 1e-6) && near(lngV(), 126.9851666, 1e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'pinId in text', E('naverLink').textContent.includes('18039088'), E('naverLink').textContent.slice(0, 80));
  check(c, 'naver pin href', E('naverOpen').href.startsWith('https://map.naver.com/?lat=37.5634'), E('naverOpen').href);
}));
rows.push(row('N2', 'Naver place ID bare link', async (c) => {
  await pasteAndParse('https://map.naver.com/p/entry/place/15491493');
  check(c, 'no coords', E('lat').value === '', E('lat').value);
  check(c, 'place href', E('naverOpen').href === 'https://map.naver.com/p/entry/place/15491493', E('naverOpen').href);
}));
rows.push(row('N3', 'Naver c=X,Y link (Gimhae Gaya)', async (c) => {
  await pasteAndParse('https://map.naver.com/v5/?c=14348386.54,4198130.13,15,0,0,0,dh');
  check(c, 'coords', near(latV(), 35.251635, 2e-6) && near(lngV(), 128.8937493, 2e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('N4', 'Naver /p/search/ Korean place name', async (c) => {
  await pasteAndParse('https://map.naver.com/p/search/' + encodeURIComponent('김해가야테마파크'));
  check(c, 'name only', E('name').value.includes('김해가야테마파크') && E('lat').value === '', E('name').value + '|' + E('lat').value);
}));
rows.push(row('N5', 'Naver redirect lat/lng/title', async (c) => {
  await pasteAndParse('https://map.naver.com/?appMenu=location&lat=35.251635&lng=128.893749&title=' + encodeURIComponent('김해가야테마파크'));
  check(c, 'coords', near(latV(), 35.251635, 1e-6) && near(lngV(), 128.893749, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('Y1', 'Yahoo ?lat=&lon=（JP）', async (c) => {
  await pasteAndParse('https://map.yahoo.co.jp/?lat=35.633670&lon=139.791520&z=17');
  check(c, 'coords', near(latV(), 35.63367, 1e-6) && near(lngV(), 139.79152, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('Y2', 'yahoo.jp short link (fixture)', async (c) => {
  await pasteAndParse('https://yahoo.jp/RfPMtY');
  check(c, 'coords', near(latV(), 35.63367, 1e-5) && near(lngV(), 139.79152, 1e-5), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('P1', 'Full Plus Code, 10 chars (Jeju)', async (c) => {
  await pasteAndParse('8Q58FFRR+X8');
  check(c, 'centre', E('lat').value === '33.4924375' && E('lng').value === '126.4908125', E('lat').value + ',' + E('lng').value);
  check(c, 'precision note', E('readyText').textContent.includes('8Q58FFRR+X8') && E('readyText').textContent.includes('公尺'), E('readyText').textContent.slice(0, 60));
}));
rows.push(row('P2', 'Full Plus Code, 11 chars (Lotte)', async (c) => {
  await pasteAndParse('8Q58FFJJ+XHR');
  check(c, 'centre', E('lat').value === '33.4824875' && E('lng').value === '126.4813906', E('lat').value + ',' + E('lng').value);
}));
rows.push(row('P3', 'Full Plus Code (JP)', async (c) => {
  await pasteAndParse('8Q7XJQJW+VX');
  check(c, 'centre', near(latV(), 35.6321875, 1e-6) && near(lngV(), 139.7974375, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('P4', 'Short code + TW city recovery', async (c) => {
  await pasteAndParse('2HM7+CR 桃園市平鎮區');
  check(c, 'recovered', near(latV(), 25.0335625, 1e-6) && near(lngV(), 121.5645625, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('P5', 'Short code + JP city recovery', async (c) => {
  await pasteAndParse('JQJW+VX 江東區 日本東京都');
  check(c, 'recovered', near(latV(), 35.6321875, 1e-6) && near(lngV(), 139.7974375, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('P6', 'Plus Code rejection path: short code without reference + invalid code character (orig. P6+P7)', async (c) => {
  await pasteAndParse('FFRR+X8');
  check(c, 'short code no reference rejected', E('lat').value === '', E('lat').value + '|' + st().slice(0, 40));
  await pasteAndParse('8Q58FFRR+X1');
  check(c, 'invalid char not decoded', E('lat').value === '', E('lat').value);
}));
rows.push(row('S1', 'Naver share full text + mismatched Plus Code (fix39)', async (c) => {
  await pasteAndParse('명동교자 1호점\n서울 중구 명동10길 29\nhttps://naver.me/FP8gOoAY\nHX7P+92 서울');
  check(c, 'exact coords used', near(latV(), 37.5634829, 1e-6), E('lat').value);
  check(c, 'mismatch warning', st().includes('Plus Code') && st().includes('以連結的精確座標為準'), st().slice(0, 80));
}));
rows.push(row('C1', 'Bare coordinate text', async (c) => {
  await pasteAndParse('37.5634829, 126.9851666');
  check(c, 'coords', near(latV(), 37.5634829, 1e-6) && near(lngV(), 126.9851666, 1e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('C2', 'Parenthesised coordinates (TW)', async (c) => {
  await pasteAndParse('(25.033524, 121.564604)');
  check(c, 'coords', near(latV(), 25.033524, 1e-6) && near(lngV(), 121.564604, 1e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'X/Y', near(parseFloat(E('mx').value), 13532509.82, 1) && near(parseFloat(E('my').value), 2879862.85, 1), E('mx').value + ',' + E('my').value);
}));
rows.push(row('C3', 'Out-of-range coordinates -> rejected', async (c) => {
  await pasteAndParse('999,999');
  check(c, 'rejected', E('lat').value === '', E('lat').value);
}));
rows.push(row('T1', 'Clear/reset', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/x/@37.5634829,126.9851666,17z');
  detailsAdv[0].open = true;
  await clearAll();
  check(c, 'fields empty', E('lat').value === '' && E('name').value === '' && E('paste').value === '', E('lat').value);
  check(c, 'buttons reset', E('naverOpen').href === '#' && E('googleOpen').href === '#', E('naverOpen').href + '|' + E('googleOpen').href);
  check(c, 'advanced collapsed', detailsAdv[0].open === false, String(detailsAdv[0].open));
  check(c, 'candidate hidden', E('candidateBox').hidden === true, String(E('candidateBox').hidden));
}));
rows.push(row('T2', 'Rename invalidates coords (fix13)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/x/@37.5634829,126.9851666,17z');
  E('name').value = '다른이름'; E('name').dispatch('input'); await flush();
  check(c, 'google falls to ID not found', E('googleOpen').textContent.includes('ID 未找到'), E('googleOpen').textContent);
}));
rows.push(row('T3', 'Manual char-by-char lat/lng and X/Y input is never rewritten (fix41, orig. T3+T4)', async (c) => {
  typeInto(E('lat'), '37.5634829'); typeInto(E('lng'), '126.9851666'); await flush();
  check(c, 'final lat/lng', E('lat').value === '37.5634829' && E('lng').value === '126.9851666', E('lat').value + ',' + E('lng').value);
  check(c, 'X synced', near(parseFloat(E('mx').value), 14135924.08, 1), E('mx').value);
  typeInto(E('mx'), '14135924.08'); typeInto(E('my'), '4517942.80'); await flush();
  check(c, 'X/Y intact', E('mx').value === '14135924.08' && E('my').value === '4517942.80', E('mx').value + ',' + E('my').value);
  check(c, 'lat/lng derived', near(latV(), 37.5634829, 2e-6) && near(lngV(), 126.9851666, 2e-6), E('lat').value + ',' + E('lng').value);
}));
rows.push(row('T5', 'Coords present, then paste a bare place name -> coords cleared', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/x/@37.5634829,126.9851666,17z');
  await pasteAndParse('명동교자 본점');
  check(c, 'coords cleared', E('lat').value === '', E('lat').value + '|' + E('name').value);
}));
rows.push(row('K1', 'Candidate flow (1 fixture result) + list click-to-confirm (fix77)', async (c) => {
  E('name').value = '명동교자 분점';
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.5634375,126.9850625');
  check(c, 'find btn visible', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'candidate box', E('candidateBox').hidden === false, String(E('candidateBox').hidden));
  check(c, 'list head counts', E('candidateHead').textContent.includes('找到 1 個候選'), E('candidateHead').textContent.slice(0, 60));
  check(c, 'one row title+dist', candRows().length === 1 && candRows()[0].textContent.includes('명동교자 분점') && candRows()[0].textContent.includes('7 公尺'), candAllText().slice(0, 120));
  candYes(); await flush();
  check(c, 'override label', E('naverOpen').textContent.includes('已確認地點'), E('naverOpen').textContent);
  check(c, 'override href (place → name page, fix50)', E('naverOpen').href === 'https://map.naver.com/p/search/' + encodeURIComponent('명동교자 분점'), E('naverOpen').href);
}));
rows.push(row('K2', 'Candidate list: 2 rows side by side + far-distance warning (fix77)', async (c) => {
  E('name').value = '김해가야테마파크';
  await pasteAndParse('https://map.naver.com/v5/?c=14348386.54,4198130.13,15,0,0,0,dh');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'two rows listed', candRows().length === 2, String(candRows().length));
  check(c, 'first row park', candRows()[0].textContent.includes('김해가야테마파크') && !candRows()[0].textContent.includes('주차장'), candRows()[0].textContent.slice(0, 60));
  check(c, 'second row parking + warn', candRows()[1].textContent.includes('주차장') && candRows()[1].textContent.includes('⚠'), candRows()[1].textContent.slice(0, 90));
}));
rows.push(row('K3', 'Chinese place name -> address fallback produces candidates (fix47, replacing the fix45 Korean dead end)', async (c) => {
  await pasteAndParse('https://maps.app.goo.gl/8jUa4Jxcuvq4KEk78');
  check(c, 'find btn visible', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'address candidate box', E('candidateBox').hidden === false, String(E('candidateBox').hidden));
  check(c, 'address candidate listed', candAllText().includes('부산'), candAllText().slice(0, 90));
}));
rows.push(row('K4', 'Search returns no results (fixture)', async (c) => {
  await pasteAndParse('37.5634829, 126.9851666');
  E('name').value = '없는가게';
  E('findBtn').dispatch('click'); await flush();
  check(c, 'not found status', st().includes('找不到'), st().slice(0, 60));
}));
rows.push(row('N6', 'Naver web coordinate link must use the official handoff format (not /p/search/ coords, fix47)', async (c) => {
  await pasteAndParse('35.098562, 129.030938');
  const href = E('naverOpen').href;
  check(c, 'menu=location format', href === 'https://map.naver.com/?lat=35.098562&lng=129.030938&menu=location', href);
  check(c, 'not search format', !href.includes('/p/search/'), href);
}));
rows.push(row('N7', 'Naver App pin name rules: no coordinate string as name when nameless + Chinese name cannot be used as name (fix48 field report, incl. orig. N8)', async (c) => {
  await pasteAndParse('8Q7F32XJ+C9');
  check(c, 'name field empty', E('name').value === '', E('name').value);
  let href = E('naverAppOpen') ? E('naverAppOpen').href : '';
  let m = href.match(/[?&]name=([^&]*)/);
  let nm = m ? decodeURIComponent(m[1]) : '';
  check(c, 'app name not coord string', !!nm && !/^\d+\.\d+,\d+\.\d+$/.test(nm), href.slice(0, 90));
  await pasteAndParse('https://maps.app.goo.gl/8jUa4Jxcuvq4KEk78');
  href = E('naverAppOpen').href;
  m = href.match(/[?&]name=([^&]*)/);
  nm = m ? decodeURIComponent(m[1]) : '';
  check(c, 'chinese name → neutral label', nm === '좌표 위치', href.slice(0, 110));
  check(c, 'coords in app href', href.includes('lat=33.4824'), href.slice(0, 110));
}));
rows.push(row('N9', 'After confirming a nearby place, the Naver web button opens the place-name page (fix50 field report)', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  candNext(); candYes(); await flush();
  check(c, 'naver href is place page', E('naverOpen').href === 'https://map.naver.com/p/search/' + encodeURIComponent('다이소 부산남포점'), E('naverOpen').href);
  check(c, 'google uses candidate coords', E('googleOpen').href.includes('35.09852'), E('googleOpen').href.slice(0, 80));
}));
rows.push(row('K9', 'Candidate list carries the original-name reference line (fix51: English-name link -> address-mode candidates)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/Brosis+Hotel/@35.0986,129.0309,17z');
  check(c, 'place name parsed with @coords', E('name').value === 'Brosis Hotel', E('name').value);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'ref line in head', E('candidateHead').textContent.includes('你原本查的是：Brosis Hotel'), E('candidateHead').textContent.slice(0, 60));
  check(c, 'place rows listed', candAllText().includes('다이소 부산남포점'), candAllText().slice(0, 60));
}));
rows.push(row('K10', 'Place rows and address rows both carry dual-source machine-translated English reference lines (fix52/54/75/77)', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'address row has translation (fix75)', candRows()[0].textContent.includes('英文參考（Google 機翻，非官方名）：5, Gudeok-ro 34beon-gil'), candRows()[0].textContent.slice(-120));
  check(c, 'google translation line', candRows()[1].textContent.includes('英文參考（Google 機翻，非官方名）：Daiso Busan Nampo Branch'), candRows()[1].textContent.slice(-120));
  check(c, 'mymemory translation line (differs → also shown)', candRows()[1].textContent.includes('英文參考（MyMemory 機翻，非官方名）：Daiso Busan Nampo'), candRows()[1].textContent.slice(-120));
}));
rows.push(row('M1', 'Kakao panel: three-button format in coordinate state (fix56)', async (c) => {
  await pasteAndParse('(35.098562, 129.030938)');
  check(c, 'web link/map coords', E('kakaoOpen').href === 'https://map.kakao.com/link/map/35.098562,129.030938', E('kakaoOpen').href);
  check(c, 'iphone scheme', E('kakaoAppOpen').href === 'kakaomap://look?p=35.098562,129.030938', E('kakaoAppOpen').href);
  check(c, 'android intent', E('kakaoAppAndroid').href === 'intent://look?p=35.098562,129.030938#Intent;scheme=kakaomap;package=net.daum.android.map;end', E('kakaoAppAndroid').href);
}));
rows.push(row('M2', 'Kakao panel: confirmed place opens the place ID page (fix56)', async (c) => {
  E('name').value = '명동교자 분점';
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.5634375,126.9850625');
  E('findBtn').dispatch('click'); await flush();
  candYes(); await flush();
  check(c, 'web place id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/18577297', E('kakaoOpen').href);
  check(c, 'web label confirmed', E('kakaoOpen').textContent.includes('已確認地點'), E('kakaoOpen').textContent);
  check(c, 'app uses candidate coords', E('kakaoAppOpen').href === 'kakaomap://look?p=37.5634555,126.9851365', E('kakaoAppOpen').href);
}));
rows.push(row('K11', 'Kakao link input: link/map coordinates (fix57)', async (c) => {
  await pasteAndParse('https://map.kakao.com/link/map/37.563483,126.985167');
  check(c, 'coords parsed', E('lat').value === '37.563483' && E('lng').value === '126.985167', E('lat').value + ',' + E('lng').value);
  check(c, 'naver converts', E('naverOpen').href.includes('lat=37.563483') && E('naverOpen').href.includes('lng=126.985167'), E('naverOpen').href);
  check(c, 'kakao web echoes link/map', E('kakaoOpen').href === 'https://map.kakao.com/link/map/37.563483,126.985167', E('kakaoOpen').href);
}));
rows.push(row('K12', 'Kakao link input: link/map name + coordinates (fix57)', async (c) => {
  await pasteAndParse('https://map.kakao.com/link/map/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90,37.563483,126.985167');
  check(c, 'name parsed', E('name').value === '명동교자', E('name').value);
  check(c, 'coords parsed', E('lat').value === '37.563483', E('lat').value);
  check(c, 'google converts', E('googleOpen').href.includes('37.563483'), E('googleOpen').href.slice(0, 70));
}));
rows.push(row('K13', 'Kakao link input: place ID only (fix57)', async (c) => {
  await pasteAndParse('https://place.map.kakao.com/18577297');
  check(c, 'kakao opens id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/18577297', E('kakaoOpen').href);
  check(c, 'status mentions kakao id', E('parseStatus').textContent.includes('Kakao ID 18577297'), E('parseStatus').textContent.slice(0, 60));
}));
rows.push(row('M3', 'Landmark confirmation as its own section: search once + list confirm, Naver/Kakao in sync (fix59/77)', async (c) => {
  E('name').value = '명동교자 분점';
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.5634375,126.9850625');
  check(c, 'find visible', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'candidate shown', E('candidateBox').hidden === false, String(E('candidateBox').hidden));
  check(c, 'candidate row', candRows().length === 1 && candRows()[0].textContent.includes('명동교자 분점'), candAllText().slice(0, 60));
  candYes(); await flush();
  check(c, 'kakao place page after yes', E('kakaoOpen').href === 'https://map.kakao.com/link/map/18577297', E('kakaoOpen').href);
  check(c, 'naver place page too', E('naverOpen').href === 'https://map.naver.com/p/search/' + encodeURIComponent('명동교자 분점'), E('naverOpen').href.slice(0, 80));
}));
rows.push(row('M4', 'Find-landmark button hides after confirmation (search only once, fix59)', async (c) => {
  E('name').value = '명동교자 분점';
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.5634375,126.9850625');
  E('findBtn').dispatch('click'); await flush();
  candYes(); await flush();
  check(c, 'find hidden after confirm', E('findBtn').style.display === 'none', E('findBtn').style.display);
  check(c, 'candidate box hidden', E('candidateBox').hidden === true, String(E('candidateBox').hidden));
}));
rows.push(row('K14', 'Kakao share text: kko.to expansion + applink ID + coordinate fill-in (fix61/63)', async (c) => {
  await pasteAndParse('[KakaoMap] BROSIS HOTEL https://kko.to/qobmRiH-bl');
  await flush(); await flush();
  check(c, 'name upgraded to korean', E('name').value === '브로시스호텔', E('name').value);
  check(c, 'coords filled', Math.abs(parseFloat(E('lat').value) - 35.0985955) < 0.00001, E('lat').value);
  check(c, 'kakao id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/338712143', E('kakaoOpen').href);
}));
rows.push(row('X1', 'Interop: Google input -> Naver + Kakao open', async (c) => {
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=37.563437,126.985063');
  check(c, 'google pin', E('googleOpen').href.includes('37.563437'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens', E('naverOpen').href.includes('lat=37.563437') && E('naverOpen').href.includes('menu=location'), E('naverOpen').href.slice(0, 90));
  check(c, 'kakao opens', E('kakaoOpen').href === 'https://map.kakao.com/link/map/37.563437,126.985063', E('kakaoOpen').href);
}));
rows.push(row('X2', 'Interop: Naver input -> Google + Kakao open', async (c) => {
  await pasteAndParse('https://map.naver.com/v5/?c=14348386.54,4198130.13,15,0,0,0,dh');
  check(c, 'google opens', E('googleOpen').href.includes('35.251635'), E('googleOpen').href.slice(0, 80));
  check(c, 'kakao opens', E('kakaoOpen').href === 'https://map.kakao.com/link/map/35.251635,128.8937493', E('kakaoOpen').href);
  check(c, 'naver opens', E('naverOpen').href.includes('lat=35.251635'), E('naverOpen').href.slice(0, 90));
}));
rows.push(row('X3', 'Interop: Kakao input (coords) -> Google + Naver open', async (c) => {
  await pasteAndParse('https://map.kakao.com/link/map/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90,37.563483,126.985167');
  check(c, 'google opens', E('googleOpen').href.includes('37.563483'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens', E('naverOpen').href.includes('lat=37.563483') && E('naverOpen').href.includes('menu=location'), E('naverOpen').href.slice(0, 90));
  check(c, 'kakao opens', E('kakaoOpen').href.includes('37.563483'), E('kakaoOpen').href);
}));
rows.push(row('X4', 'Interop: Kakao share (ID only) -> coords filled, Google + Naver open (fix63)', async (c) => {
  await pasteAndParse('[KakaoMap] BROSIS HOTEL https://kko.to/qobmRiH-bl');
  await flush(); await flush();
  check(c, 'google opens', E('googleOpen').href.includes('35.09859'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens', E('naverOpen').href.includes('lat=35.09859'), E('naverOpen').href.slice(0, 90));
  check(c, 'kakao id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/338712143', E('kakaoOpen').href);
}));
rows.push(row('X5', 'Interop: direct Kakao place link paste -> coords filled, all three open (fix63)', async (c) => {
  await pasteAndParse('https://place.map.kakao.com/338712143');
  await flush(); await flush();
  check(c, 'coords filled', Math.abs(parseFloat(E('lat').value) - 35.0985955) < 0.00001, E('lat').value);
  check(c, 'google opens', E('googleOpen').href.includes('35.09859'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens', E('naverOpen').href.includes('lat=35.09859'), E('naverOpen').href.slice(0, 90));
  check(c, 'kakao id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/338712143', E('kakaoOpen').href);
}));
rows.push(row('X6', 'Interop: Google ftid + Korean name (no coords) -> find landmark -> all three open (fix64)', async (c) => {
  await pasteAndParse('https://maps.app.goo.gl/SAMRANGJIN');
  check(c, 'find visible without coords', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'candidate by name', candAllText().includes('삼랑진생태문화공원'), candAllText().slice(0, 60));
  candYes(); await flush();
  check(c, 'google opens', E('googleOpen').href.includes('35.3994'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens (place page)', E('naverOpen').href === 'https://map.naver.com/p/search/' + encodeURIComponent('삼랑진생태문화공원'), E('naverOpen').href.slice(0, 90));
  check(c, 'kakao opens', E('kakaoOpen').href.includes('35.3994'), E('kakaoOpen').href);
}));
rows.push(row('X7', 'Interop: Naver ID only -> enter Korean name -> find landmark -> all three open (fix64)', async (c) => {
  await pasteAndParse('https://map.naver.com/p/entry/place/1943436990');
  check(c, 'guidance shown', E('parseStatus').textContent.includes('韓文原名'), E('parseStatus').textContent.slice(0, 80));
  typeInto(E('name'), '롯데호텔앤리조트 김해'); await flush();
  check(c, 'find visible after name', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'candidate by name', candAllText().includes('롯데호텔앤리조트 김해'), candAllText().slice(0, 60));
  candYes(); await flush();
  check(c, 'google opens', E('googleOpen').href.includes('35.1917'), E('googleOpen').href.slice(0, 80));
  check(c, 'kakao place page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/27584217', E('kakaoOpen').href);
}));
rows.push(row('X8', 'Interop: naver.me ID only (real-case shape) -> Naver opens + guidance to add the name (fix64)', async (c) => {
  await pasteAndParse('https://naver.me/52R5JVa5');
  await flush();
  check(c, 'naver place link', E('naverOpen').href === 'https://map.naver.com/p/entry/place/1943436990', E('naverOpen').href);
  check(c, 'guidance shown', E('parseStatus').textContent.includes('韓文原名'), E('parseStatus').textContent.slice(0, 80));
  check(c, 'find hidden without name', E('findBtn').style.display === 'none', E('findBtn').style.display);
}));
rows.push(row('E1', 'Step 1 example links (fix65+fix108): Google/Naver/Kakao = Incheon Airport Terminal 1, Yahoo = Tokyo Big Sight', async (c) => {
  for(const sys of ['google','naver','kakao']){
    await clearAll();
    [...document.querySelectorAll('.ex-btn')].find(b => b.dataset.ex === sys).dispatch('click'); await flush();
    check(c, sys + ' coords full precision', E('lat').value === '37.4496919' && E('lng').value === '126.4524038', sys + ' lat=' + E('lat').value + ' lng=' + E('lng').value);
    check(c, sys + ' google opens', E('googleOpen').href.includes('37.4496919'), E('googleOpen').href.slice(0, 70));
    check(c, sys + ' naver opens', E('naverOpen').href.includes('37.4496919'), E('naverOpen').href.slice(0, 80));
    check(c, sys + ' kakao opens', E('kakaoOpen').href.includes('37.4496919'), E('kakaoOpen').href.slice(0, 80));
    check(c, sys + ' yahoo opens', E('yahooOpen').href.includes('37.4496919'), E('yahooOpen').href.slice(0, 80));
  }
  await clearAll();
  [...document.querySelectorAll('.ex-btn')].find(b => b.dataset.ex === 'yahoo').dispatch('click'); await flush();
  check(c, 'yahoo coords = tokyo big sight', E('lat').value === '35.62972' && E('lng').value === '139.79417', 'lat=' + E('lat').value + ' lng=' + E('lng').value);
  check(c, 'yahoo google opens', E('googleOpen').href.includes('35.62972'), E('googleOpen').href.slice(0, 70));
  check(c, 'yahoo naver opens', E('naverOpen').href.includes('35.62972'), E('naverOpen').href.slice(0, 80));
  check(c, 'yahoo kakao opens', E('kakaoOpen').href.includes('35.62972'), E('kakaoOpen').href.slice(0, 80));
  check(c, 'yahoo yahoo opens', E('yahooOpen').href.includes('35.62972'), E('yahooOpen').href.slice(0, 80));
}));
rows.push(row('X9', 'Field report: full-form Naver share (coords + pinId) -> Kakao must carry coordinates (fix66)', async (c) => {
  await pasteAndParse('[NAVER Maps]\nBeurosiseu HOTEL\n釜山广域市 中区 南浦洞四街 5-3\nhttps://naver.me/GcAsfvpu');
  await flush();
  check(c, 'coords parsed', E('lat').value === '35.098606' && E('lng').value === '129.0309021', E('lat').value + ',' + E('lng').value);
  check(c, 'kakao web has coords', E('kakaoOpen').href === 'https://map.kakao.com/link/map/35.098606,129.0309021', E('kakaoOpen').href);
  check(c, 'kakao web label shows coords', E('kakaoOpen').textContent.includes('座標'), E('kakaoOpen').textContent);
  check(c, 'kakao app has coords', E('kakaoAppOpen').href === 'kakaomap://look?p=35.098606,129.0309021', E('kakaoAppOpen').href);
  check(c, 'kakao badge ok', E('kakaoBadge').textContent === '座標 OK', E('kakaoBadge').textContent);
  check(c, 'yahoo badge ok', E('yahooBadge').textContent === '座標 OK', E('yahooBadge').textContent);
  check(c, 'yahoo place pin link (fix67)', E('yahooOpen').href === 'https://map.yahoo.co.jp/place/?lat=35.098606&lon=129.0309021&z=17', E('yahooOpen').href);
}));
rows.push(row('Y4', 'Yahoo mobile share link -> parse + deviation warning (fix68)', async (c) => {
  await pasteAndParse('https://yahoo.jp/6aiq7W');
  await flush();
  check(c, 'coords parsed', E('lat').value === '35.09787' && E('lng').value === '129.0309', E('lat').value + ',' + E('lng').value);
  check(c, 'deviation note in status', E('parseStatus').textContent.includes('地圖中心'), E('parseStatus').textContent.slice(0, 100));
}));
rows.push(row('K6', 'No place name (Plus Code only) -> find-place uses the address fallback (fixture)', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  check(c, 'coords decoded', Math.abs(parseFloat(E('lat').value) - 35.0985625) < 0.001, E('lat').value);
  check(c, 'find btn visible', E('findBtn').style.display === '', E('findBtn').style.display);
  E('findBtn').dispatch('click'); await flush();
  check(c, 'address candidate box', E('candidateBox').hidden === false, String(E('candidateBox').hidden));
  check(c, 'address candidate text', candAllText().includes('부산'), candAllText().slice(0, 90));
}));
rows.push(row('K8', 'Address-mode list: address row first + place rows listed + list structure and category tags (fix49/77, incl. orig. K11)', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'three rows', candRows().length === 3, String(candRows().length));
  check(c, 'head counts', E('candidateHead').textContent.includes('找到 3 個候選'), E('candidateHead').textContent.slice(0, 60));
  check(c, 'sections visible', E('candSecAddr').hidden === false && E('candSecPlaces').hidden === false, '');
  check(c, 'first row is address', candRows()[0].textContent.includes('구덕로'), candRows()[0].textContent.slice(0, 60));
  check(c, 'second row daiso', candRows()[1].textContent.includes('다이소'), candRows()[1].textContent.slice(0, 60));
  check(c, 'daiso category gloss', candRows()[1].textContent.includes('分類：購物'), candRows()[1].textContent.slice(0, 90));
  check(c, 'third row station', candRows()[2].textContent.includes('남포역'), candRows()[2].textContent.slice(0, 60));
  check(c, 'station category gloss', candRows()[2].textContent.includes('分類：地鐵站'), candRows()[2].textContent.slice(0, 90));
}));
rows.push(row('K7', 'Confirm an address candidate -> all panels switch to the confirmed coords', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  candYes(); await flush();
  check(c, 'lat field upgraded', Math.abs(parseFloat(E('lat').value) - 35.0987) < 1e-6, E('lat').value);
  check(c, 'google href upgraded', E('googleOpen').href.includes('35.0987'), E('googleOpen').href.slice(0, 90));
  check(c, 'naver href upgraded', E('naverOpen').href.includes('35.0987'), E('naverOpen').href.slice(0, 90));
}));
rows.push(row('L1', 'UI language defaults to Chinese: buttons and ready hint in Chinese (fix72)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90/@37.5634829,126.9851666,17z');
  check(c, 'naver zh label', E('naverOpen').textContent.includes('在 Naver 開啟 (座標)'), E('naverOpen').textContent);
  check(c, 'google zh label', E('googleOpen').textContent.includes('座標圖釘'), E('googleOpen').textContent);
  check(c, 'ready zh', E('readyText').textContent.includes('第 4 步'), E('readyText').textContent);
}));
rows.push(row('L2', 'Switch to English: all buttons and badges turn English, hrefs unchanged; switch back to Chinese (fix72)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90/@37.5634829,126.9851666,17z');
  const naverHref = E('naverOpen').href, googleHref = E('googleOpen').href;
  E('langEn').dispatch('click'); await flush();
  check(c, 'naver en', E('naverOpen').textContent === 'Open in Naver (coordinates)', E('naverOpen').textContent);
  check(c, 'google en', E('googleOpen').textContent === 'Open in Google Maps (coordinate pin)', E('googleOpen').textContent);
  check(c, 'kakao en', E('kakaoOpen').textContent === 'Open in Kakao (coordinates)', E('kakaoOpen').textContent);
  check(c, 'yahoo en', E('yahooOpen').textContent === 'Open in Yahoo! MAP (coordinates)', E('yahooOpen').textContent);
  check(c, 'badge en', E('kakaoBadge').textContent === 'Coordinates OK', E('kakaoBadge').textContent);
  check(c, 'ready en', E('readyText').textContent.includes('Step 4'), E('readyText').textContent);
  check(c, 'hrefs unchanged', E('naverOpen').href === naverHref && E('googleOpen').href === googleHref, E('naverOpen').href);
  E('langZh').dispatch('click'); await flush();
  check(c, 'back to zh', E('naverOpen').textContent.includes('在 Naver 開啟 (座標)'), E('naverOpen').textContent);
}));
rows.push(row('L3', 'Full flow in English mode: Plus Code -> find landmark (English list) -> confirm (fix72/77)', async (c) => {
  E('langEn').dispatch('click'); await flush();
  await pasteAndParse('32XJ+C9 釜山 南韓');
  check(c, 'coords decoded en', Math.abs(parseFloat(E('lat').value) - 35.0985625) < 0.001, E('lat').value);
  check(c, 'ready en plus', E('readyText').textContent.includes('approximate location'), E('readyText').textContent.slice(0, 80));
  E('findBtn').dispatch('click'); await flush();
  check(c, 'list head en + addr row', E('candidateHead').textContent.includes('Found 3 candidates') && candRows()[0].textContent.includes('구덕로'), (E('candidateHead').textContent + candRows()[0].textContent).slice(0, 90));
  check(c, 'place row en category', candRows()[1].textContent.includes('Category: Shopping') && candRows()[1].textContent.includes('다이소'), candRows()[1].textContent.slice(0, 90));
  candNext(); candYes(); await flush();
  check(c, 'confirmed status en', st().includes('Place confirmed:'), st().slice(0, 60));
  E('langZh').dispatch('click'); await flush();
}));
rows.push(row('L4', 'English mode: ID-not-found and fallback (fix72)', async (c) => {
  E('langEn').dispatch('click'); await flush();
  await pasteAndParse('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('명동교자'));
  check(c, 'google id not found en', E('googleOpen').textContent === 'ID not found', E('googleOpen').textContent);
  check(c, 'status en (auto-search found, fix92)', st().includes('Found 1 candidates'), st().slice(0, 80));
  check(c, 'app fallback en', E('googleAppIOS').textContent === 'iPhone App (name search fallback)', E('googleAppIOS').textContent);
  E('langZh').dispatch('click'); await flush();
  check(c, 'restored zh', E('googleOpen').textContent.includes('ID 未找到'), E('googleOpen').textContent);
}));
rows.push(row('L5', 'Footer quota remaining percentage (today only, fix73/85 final) + switch to English re-renders', async (c) => {
  await flush();
  check(c, 'quota visible', E('quotaLine').hidden === false, String(E('quotaLine').hidden));
  check(c, 'daily pct (max type 500/100000)', E('quotaLine').textContent.includes('99.50'), E('quotaLine').textContent);
  check(c, 'no monthly on page (fix83)', !E('quotaLine').textContent.includes('99.00') && !E('quotaLine').textContent.includes('本月'), E('quotaLine').textContent);
  check(c, 'no system info on page', !E('quotaLine').textContent.includes('UTC') && !E('quotaLine').textContent.includes('系統'), E('quotaLine').textContent);
  check(c, 'quota cached to localStorage (fix82)', (localStorage.getItem('mcQuota') || '').includes('"d":"99.50"'), localStorage.getItem('mcQuota') || 'null');
  check(c, 'page never calls monthly endpoint (fix83/85)', !FETCH_LOG.some(u => u.includes('sum=month')), FETCH_LOG.filter(u => u.includes('sum')).join(',') || 'none');
  E('langEn').dispatch('click'); await flush();
  check(c, 'quota en', E('quotaLine').textContent.includes('Query quota remaining'), E('quotaLine').textContent);
  E('langZh').dispatch('click'); await flush();
}));
rows.push(row('L6', 'Switch to Indonesian: Indonesian labels + hrefs unchanged + quota line in Indonesian; switch back to Chinese (fix74)', async (c) => {
  await pasteAndParse('https://www.google.com/maps/place/%EB%AA%85%EB%8F%99%EA%B5%90%EC%9E%90/@37.5634829,126.9851666,17z');
  const naverHref = E('naverOpen').href;
  E('langId').dispatch('click'); await flush();
  check(c, 'naver id', E('naverOpen').textContent === 'Buka di Naver (koordinat)', E('naverOpen').textContent);
  check(c, 'google id', E('googleOpen').textContent === 'Buka di Google Maps (pin koordinat)', E('googleOpen').textContent);
  check(c, 'kakao id', E('kakaoOpen').textContent === 'Buka di Kakao (koordinat)', E('kakaoOpen').textContent);
  check(c, 'ready id', E('readyText').textContent.includes('Langkah 4'), E('readyText').textContent);
  check(c, 'quota id', E('quotaLine').textContent.includes('Sisa kuota pencarian'), E('quotaLine').textContent);
  check(c, 'href unchanged id', E('naverOpen').href === naverHref, E('naverOpen').href);
  E('langZh').dispatch('click'); await flush();
  check(c, 'back to zh', E('naverOpen').textContent.includes('在 Naver 開啟 (座標)'), E('naverOpen').textContent);
}));
rows.push(row('K15', 'Address rows also carry the English MT reference line (fix75/77); translation stays English under the Indonesian UI', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'address row', candRows()[0].textContent.includes('구덕로'), candRows()[0].textContent.slice(0, 60));
  check(c, 'en line present (zh ui)', candRows()[0].textContent.includes('英文參考（Google 機翻，非官方名）：5, Gudeok-ro 34beon-gil'), candRows()[0].textContent.slice(-120));
  E('langId').dispatch('click'); await flush();
  check(c, 'id label, en text kept', candRows()[0].textContent.includes('Referensi Inggris (terjemahan mesin Google') && candRows()[0].textContent.includes('5, Gudeok-ro 34beon-gil'), candRows()[0].textContent.slice(-140));
  E('langZh').dispatch('click'); await flush();
}));
rows.push(row('K16', 'Place candidates grouped by category: same category adjacent, group order by nearest distance (fix77)', async (c) => {
  await pasteAndParse('37.4496919, 126.4524038');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'four rows', candRows().length === 4, String(candRows().length));
  check(c, 'row1 cafe near', candRows()[1].textContent.includes('공항카페'), candRows()[1].textContent.slice(0, 50));
  check(c, 'row2 same cafe group', candRows()[2].textContent.includes('공항서점'), candRows()[2].textContent.slice(0, 50));
  check(c, 'row3 station last despite nearer', candRows()[3].textContent.includes('공항역'), candRows()[3].textContent.slice(0, 50));
  check(c, 'cafe gloss zh', candRows()[1].textContent.includes('分類：咖啡廳'), candRows()[1].textContent.slice(0, 80));
}));
rows.push(row('K17', 'Hint at the bottom of the list: if your place is missing, tap the address row (fix78) + status text uses list wording', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'status uses list wording', st().includes('清單點一個確認') && !st().includes('換一家'), st().slice(0, 60));
  check(c, 'foot hint visible', E('candidateFoot').hidden === false && E('candidateFoot').textContent.includes('找不到你要找的地點'), E('candidateFoot').textContent.slice(0, 40));
}));
rows.push(row('X10', 'Interop: Kakao share (Jeju Parkside case) -> coords + ID filled, all three open (fix63)', async (c) => {
  await pasteAndParse('[KakaoMap] Jeju Park Side Hotel https://kko.to/JuV3NbSRyw');
  await flush(); await flush();
  check(c, 'name upgraded to korean', E('name').value === '제주 파크사이드 호텔', E('name').value);
  check(c, 'coords filled', Math.abs(parseFloat(E('lat').value) - 33.4924038) < 0.00001, E('lat').value);
  check(c, 'kakao id page', E('kakaoOpen').href === 'https://map.kakao.com/link/map/11334932', E('kakaoOpen').href);
  check(c, 'google opens', E('googleOpen').href.includes('33.4924'), E('googleOpen').href.slice(0, 80));
  check(c, 'naver opens', E('naverOpen').href.includes('lat=33.4924'), E('naverOpen').href.slice(0, 90));
}));
rows.push(row('K18', 'Place-candidate rule: within 30 m + at most 5 (fix79/89)', async (c) => {
  await pasteAndParse('32XJ+C9 釜山 南韓');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'far place filtered (>30m)', !candAllText().includes('먼곳식당'), candAllText().slice(0, 80));
  check(c, 'rule note in head', E('candidateHead').textContent.includes('30 公尺內、最多 5 家'), E('candidateHead').textContent.slice(0, 80));
  check(c, 'near places kept (addr+2)', candRows().length === 3, String(candRows().length));
  await clearAll();
  await pasteAndParse('37.5666103, 126.9783882');
  E('findBtn').dispatch('click'); await flush();
  check(c, 'capped at 5 places + address', candRows().length === 6, String(candRows().length));
  check(c, '5th present, 6th absent', candAllText().includes('시청가게05') && !candAllText().includes('시청가게06') && !candAllText().includes('시청가게10'), candAllText().slice(-60));
}));

rows.push(row('K19', 'Name-mode cap of 5 places (fix90)', async (c) => {
  await pasteAndParse('https://www.google.com/maps?q=' + encodeURIComponent('많은가게'));
  E('findBtn').dispatch('click'); await flush();
  check(c, 'capped at 5', candRows().length === 5, String(candRows().length));
  check(c, 'first kept, 6th absent', candAllText().includes('많은가게01') && !candAllText().includes('많은가게06'), candAllText().slice(0, 60));
}));

rows.push(row('L7', 'Step 3 waiting note (fix91/92/97): trilingual strings + shown before a search, hidden while the list is open', async (c) => {
  check(c, 'source has note zh', PAGE_HTML.includes('地標搜尋約需 2–5 秒'), 'missing');
  check(c, 'source has note en', PAGE_HTML.includes('The landmark search takes about 2–5 seconds'), 'missing');
  await pasteAndParse('https://naver.me/52R5JVa5'); await flush();
  check(c, 'note hidden without findBtn', E('findWaitNote').style.display === 'none', String(E('findWaitNote').style.display));
  await clearAll();
  E('name').value = '롯데호텔 김해'; E('name').dispatch('input'); await flush();
  check(c, 'note visible with findBtn (pre-search)', E('findWaitNote').style.display !== 'none', String(E('findWaitNote').style.display));
  E('findBtn').dispatch('click'); await flush();
  check(c, 'note hidden after results (retry mode)', E('findWaitNote').style.display === 'none', String(E('findWaitNote').style.display));
}));

rows.push(row('K20', 'Auto-start Step 3 search when parsing completes (fix92); not triggered when a pinId exists', async (c) => {
  await pasteAndParse('8Q7F32XJ+C9'); await flush();
  check(c, 'auto search opened candidates', E('candidateBox').hidden === false && candRows().length >= 2, 'hidden=' + E('candidateBox').hidden + ' rows=' + candRows().length);
  await clearAll();
  await pasteAndParse('https://map.naver.com/p/entry/place/1943436990'); await flush();
  check(c, 'pinId link: no auto search', E('candidateBox').hidden === true, 'hidden=' + E('candidateBox').hidden);
}));

rows.push(row('K21', 'ID-only: typing a Korean name auto-starts the search without a button tap (fix93)', async (c) => {
  await pasteAndParse('https://naver.me/52R5JVa5'); await flush();
  check(c, 'no auto before name', E('candidateBox').hidden === true, 'hidden=' + E('candidateBox').hidden);
  E('name').value = '롯데호텔 김해'; E('name').dispatch('input');
  await new Promise(r2 => setTimeout(r2, 950));
  check(c, 'auto after name typed', E('candidateBox').hidden === false && candRows().length >= 1, 'hidden=' + E('candidateBox').hidden + ' rows=' + candRows().length);
}));

rows.push(row('K22', 'Full Naver share (coords + pinId + Chinese name) also auto-produces the candidate list (fix94, x4lws2zw case)', async (c) => {
  await pasteAndParse(NAVER_FULL_RESOLVED); await flush();
  check(c, 'auto candidates despite pinId', E('candidateBox').hidden === false && candRows().length >= 1, 'hidden=' + E('candidateBox').hidden + ' rows=' + candRows().length);
  check(c, 'find btn visible', E('findBtn').style.display !== 'none', E('findBtn').style.display);
}));

rows.push(row('K23', 'No places within 30 m -> widen to 100 m (fix95, Gimhae Lotte 50 m case) + no visible blank rows', async (c) => {
  await pasteAndParse('35.1809933, 128.8250727'); await flush();
  const rows = candRows();
  check(c, 'hotel appears via widening', rows.some(x => x.textContent.includes('롯데호텔앤리조트 김해')), rows.map(x => x.textContent.slice(0, 20)).join('|'));
  check(c, 'widened note in head', E('candidateHead').textContent.includes('放寬'), E('candidateHead').textContent.slice(-60));
  check(c, 'far place excluded', !rows.some(x => x.textContent.includes('먼곳가게')), 'far present');
  check(c, 'no visible blank row', rows.every(x => x.hidden || x.textContent.trim().length > 0), 'blank visible row');
  check(c, 'css hidden guard', PAGE_HTML.includes('[hidden]{display:none!important}'), 'css guard missing');
}));

rows.push(row('K24', 'Google App share ?q=English name + Korean address -> road-address segment extracted, place auto-found (fix96)', async (c) => {
  await pasteAndParse('https://maps.google.com/?q=Brosis+Hotel%2C+%EA%B5%AC%EB%8D%95%EB%A1%9C48%EB%B2%88%EA%B8%B8+4%2C+%EB%82%A8%ED%8F%AC%2C+%EB%B6%80%EC%82%B0&ftid=0x3568e953d7884ff3:0xd69fabe03e7ddf9d');
  await flush();
  const rows = candRows();
  check(c, 'auto candidates', E('candidateBox').hidden === false && rows.some(x => x.textContent.includes('브로시스호텔')), rows.map(x => x.textContent.slice(0, 16)).join('|'));
  const localCall = FETCH_LOG.find(u => u.includes('/local') && decodeURIComponent(u).includes('구덕로48번길'));
  check(c, 'query is road segment', !!localCall && decodeURIComponent(localCall).includes('q=구덕로48번길 4'), localCall || 'no road-segment /local call');
}));

rows.push(row('K25', 'While the list is open, the find button becomes a small "re-search" + waiting note hides (fix97)', async (c) => {
  await pasteAndParse('35.098606, 129.0309021'); await flush();
  check(c, 'retry label', E('findBtn').textContent.includes('重新搜尋'), E('findBtn').textContent);
  check(c, 'retry style', E('findBtn').style.background === '#eef1f4', E('findBtn').style.background);
  check(c, 'note hidden with results', E('findWaitNote').style.display === 'none', E('findWaitNote').style.display);
  E('clearBtn').dispatch('click'); await flush();
  check(c, 'primary restored after clear', E('findBtn').textContent.includes('找地標並確認'), E('findBtn').textContent);
}));

rows.push(row('K26', 'Google share with Chinese name + romanised address -> MT to Korean auto-finds the place (fix98, Haedong Yonggungsa case)', async (c) => {
  await pasteAndParse('https://maps.google.com/?q=%E6%B5%B7%E6%9D%B1%E9%BE%8D%E5%AE%AE%E5%AF%BA86+Yonggung-gil%2C+Gijang-gun%2C+Busan%2C+%E5%8D%97%E9%9F%93&ftid=0x35688c1bbbdea6c1:0xa141406d6f112e5c');
  await flush();
  const rows = candRows();
  check(c, 'auto candidates via MT', E('candidateBox').hidden === false && rows.some(x => x.textContent.includes('해동용궁사')), rows.map(x => x.textContent.slice(0, 16)).join('|'));
  const localCall = FETCH_LOG.find(u => u.includes('/local') && decodeURIComponent(u).includes('해동용궁사'));
  check(c, 'query is translated Korean name', !!localCall, localCall || 'no /local call with Korean name');
}));

rows.push(row('K27', 'English-UI share (English name + romanised address) -> English name queries Kakao directly (fix99)', async (c) => {
  await pasteAndParse('https://maps.google.com/?q=Brosis+Hotel%2C+4+Gudeok-ro+48beon-gil%2C+Busan%2C+South+Korea&ftid=0x3568e953d7884ff3:0xd69fabe03e7ddf9d');
  await flush();
  const rows = candRows();
  check(c, 'auto candidates via English name', E('candidateBox').hidden === false && rows.some(x => x.textContent.includes('브로시스호텔')), rows.map(x => x.textContent.slice(0, 16)).join('|'));
  const localCall = FETCH_LOG.find(u => u.includes('/local') && decodeURIComponent(u).includes('q=Brosis Hotel'));
  check(c, 'query is English first segment', !!localCall, localCall || 'no /local call with English name');
}));

rows.push(row('U1', 'Uber panel: destination prefilled universal link (fix100)', async (c) => {
  await pasteAndParse('https://kko.to/qobmRiH-bl'); await flush();
  const h = E('uberOpen').href || '';
  check(c, 'dropoff coords', h.includes('m.uber.com/ul/?action=setPickup') && h.includes('dropoff[latitude]=35.0985955') && h.includes('dropoff[longitude]=129.0308898'), h.slice(0, 120));
  check(c, 'dropoff nickname Korean', decodeURIComponent(h).includes('dropoff[nickname]=브로시스호텔'), decodeURIComponent(h).slice(0, 160));
  await clearAll();
  check(c, 'disabled without coords', (E('uberOpen').href || '#') === '#', String(E('uberOpen').href));
}));

rows.push(row('U2', 'Ride-hailing in one block: Kakao T / k.ride open-app + copy destination (fix101)', async (c) => {
  await pasteAndParse('https://kko.to/qobmRiH-bl'); await flush();
  check(c, 'dest = Korean name pre-confirm', (E('rideDest').textContent || '').includes('브로시스호텔'), E('rideDest').textContent);
  check(c, 'kakaoT android intent pkg (static markup)', PAGE_HTML.includes('intent://t.kakao.com/#Intent;scheme=https;package=com.kakao.taxi'), 'markup');
  check(c, 'kride ios universal link (static markup)', PAGE_HTML.includes('href="https://kride.kakaomobility.com/link"'), 'markup');
  const rowEl = candRows().find(x => x.textContent.includes('브로시스호텔'));
  check(c, 'candidate offered', !!rowEl, candRows().length + ' rows');
  if(rowEl) rowEl.dispatch('click'); await flush();
  check(c, 'dest upgraded with road address', (E('rideDest').textContent || '').includes('구덕로48번길 4'), E('rideDest').textContent);
  check(c, 'uber still in same flow', (E('uberOpen').href || '').includes('m.uber.com/ul/'), (E('uberOpen').href || '').slice(0, 60));
  await clearAll();
  check(c, 'dest cleared', E('rideDest').textContent === '—', E('rideDest').textContent);
}));

rows.push(row('W1', 'Taiwan coords -> TomTom verification (fix102, Pingzhen field-test shape)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('25.033524, 121.564604'); await flush();
  const log = FETCH_LOG.slice(log0);
  check(c, 'tt-nearby called', log.some(u => u.includes('/tt-nearby') && u.includes('lat=25.033524')), log.join(' | ').slice(0, 140));
  check(c, 'kakao nearby NOT called', !log.some(u => u.includes('/nearby?lat=25.033524')), 'kakao nearby called');
  check(c, 'candidates open', E('candidateBox').hidden === false && candRows().length >= 2, 'hidden=' + E('candidateBox').hidden + ' rows=' + candRows().length);
  check(c, 'address row first', !!(candRows()[0] && candRows()[0].textContent.includes('信義路五段7號')), candRows().map(r => r.textContent.slice(0, 14)).join('|'));
  check(c, 'nearby place listed', candRows().some(x => x.textContent.includes('遠傳桃園平鎮南勢直營門市')), candAllText().slice(0, 80));
  candYes(); await flush();
  check(c, 'confirmed address coords', near(latV(), 25.033524, 1e-6) && near(lngV(), 121.564604, 1e-6), E('lat').value + ',' + E('lng').value);
  check(c, 'status confirmed', st().includes('已確認地點'), st().slice(0, 40));
}));

rows.push(row('W2', 'Chinese name without coords -> TomTom fallback when Kakao has no candidates (fix102, Taipei Station)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('https://maps.google.com/?q=%E5%8F%B0%E5%8C%97%E8%BB%8A%E7%AB%99&ftid=0x3442fa7ecce7c1b9:0x12779fb177b58b02'); await flush();
  const log = FETCH_LOG.slice(log0);
  check(c, 'kakao tried first', log.some(u => u.includes('/local')), log.join('|').slice(0, 100));
  const tt = log.find(u => u.includes('/tt-search'));
  check(c, 'tt-search fallback fired', !!tt && decodeURIComponent(tt).includes('q=台北車站'), tt || 'no tt call');
  check(c, 'candidates from tomtom', E('candidateBox').hidden === false && candRows().some(x => x.textContent.includes('台北車站')), candAllText().slice(0, 60));
  const rowEl = candRows().find(x => x.textContent.includes('台北車站'));
  if(rowEl) rowEl.dispatch('click'); await flush();
  check(c, 'confirmed coords = tomtom pin', near(latV(), 25.047245, 1e-6) && near(lngV(), 121.517029, 1e-6), E('lat').value + ',' + E('lng').value);
}));

rows.push(row('W3', 'Japan coords -> no verification source (fix102, honest message, no API calls)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('35.681236, 139.767125'); await flush();
  const log = FETCH_LOG.slice(log0);
  check(c, 'no-source status', st().includes('沒有地標查證資料'), st().slice(0, 60));
  check(c, 'no provider calls', !log.some(u => u.includes('/nearby') || u.includes('/local') || u.includes('/tt-')), log.join('|').slice(0, 100));
  check(c, 'candidate box hidden', E('candidateBox').hidden === true, 'hidden=' + E('candidateBox').hidden);
}));

rows.push(row('W4', 'Europe coords -> TomTom verification + non-Korean titles do not use the Naver name page (fix102, Berlin)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('52.516267, 13.377722'); await flush();
  const log = FETCH_LOG.slice(log0);
  check(c, 'tt-nearby called', log.some(u => u.includes('/tt-nearby') && u.includes('lat=52.516267')), log.join('|').slice(0, 100));
  const rowEl = candRows().find(x => x.textContent.includes('Brandenburger Tor'));
  check(c, 'landmark listed', !!rowEl, candAllText().slice(0, 80));
  if(rowEl) rowEl.dispatch('click'); await flush();
  check(c, 'naver uses coord link not name search', (E('naverOpen').href || '').includes('map.naver.com/?lat=52.516267') && !(E('naverOpen').href || '').includes('/p/search/'), E('naverOpen').href);
}));

rows.push(row('W5', 'Korean Chinese name -> Kakao hit means no TomTom fallback (fix102, Haedong Yonggungsa)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('https://maps.google.com/?q=%E6%B5%B7%E6%9D%B1%E9%BE%8D%E5%AE%AE%E5%AF%BA86+Yonggung-gil%2C+Gijang-gun%2C+Busan%2C+%E5%8D%97%E9%9F%93&ftid=0x35688c1bbbdea6c1:0xa141406d6f112e5c'); await flush();
  const log = FETCH_LOG.slice(log0);
  check(c, 'kakao candidates', candRows().some(x => x.textContent.includes('해동용궁사')), candAllText().slice(0, 60));
  check(c, 'no tt-search', !log.some(u => u.includes('/tt-search')), log.filter(u => u.includes('tt-')).join('|') || 'none');
}));

rows.push(row('W6', 'Region without a verification source -> Google Plus Code helper button (fix104, Tokyo)', async (c) => {
  await pasteAndParse('35.681236, 139.767125'); await flush();
  check(c, 'button visible in JP', E('plusHelpBtn').style.display !== 'none', String(E('plusHelpBtn').style.display));
  check(c, 'href opens google search with coords', (E('plusHelpBtn').href || '').includes('google.com/maps/search/?api=1&query=35.681236'), E('plusHelpBtn').href);
  check(c, 'hint visible', E('plusHelpHint').style.display !== 'none', String(E('plusHelpHint').style.display));
  await clearAll();
  check(c, 'hidden after clear', E('plusHelpBtn').style.display === 'none', String(E('plusHelpBtn').style.display));
  await pasteAndParse('35.098606, 129.0309021'); await flush();
  check(c, 'hidden in KR (Kakao source exists)', E('plusHelpBtn').style.display === 'none', String(E('plusHelpBtn').style.display));
}));

rows.push(row('W7', 'TomTom region -> Google Plus Code helper button also shown (fix105, Pingzhen)', async (c) => {
  await pasteAndParse('7QQ32HM7+CR'); await flush();
  check(c, 'button visible in TW (tt region)', E('plusHelpBtn').style.display !== 'none', String(E('plusHelpBtn').style.display));
  check(c, 'href opens google search with coords', (E('plusHelpBtn').href || '').includes('google.com/maps/search/?api=1&query=25.033524'), E('plusHelpBtn').href);
  check(c, 'hint visible', E('plusHelpHint').style.display !== 'none', String(E('plusHelpHint').style.display));
  check(c, 'tt candidates still open (API primary)', E('candidateBox').hidden === false && candRows().length >= 2, 'hidden=' + E('candidateBox').hidden + ' rows=' + candRows().length);
  candYes(); await flush();
  check(c, 'hidden after confirm', E('plusHelpBtn').style.display === 'none', String(E('plusHelpBtn').style.display));
}));

rows.push(row('W8', 'Paste a bare address (Chinese) -> TomTom fallback must send the full address string (fix106, Taipei 101 address)', async (c) => {
  const log0 = FETCH_LOG.length;
  await pasteAndParse('台北市信義區信義路五段7號'); await flush();
  const log = FETCH_LOG.slice(log0);
  const tt = log.find(u => u.includes('/tt-search'));
  check(c, 'tt-search fired with FULL address', !!tt && decodeURIComponent(tt).includes('信義路五段7號') && decodeURIComponent(tt).includes('信義區'), tt ? decodeURIComponent(tt).slice(0, 90) : 'no tt call');
  const rowEl = candRows().find(x => x.textContent.includes('信義區'));
  check(c, 'xinyi candidate listed', !!rowEl, candAllText().slice(0, 80));
  if(rowEl) rowEl.dispatch('click'); await flush();
  check(c, 'confirmed coords = taipei 101 address', near(latV(), 25.033524, 1e-6) && near(lngV(), 121.564604, 1e-6), E('lat').value + ',' + E('lng').value);
}));

rows.push(row('W9', 'Example buttons: Plus Code first + address example (fix107, Taipei 101)', async (c) => {
  const btns = [...document.querySelectorAll('.ex-btn')];
  check(c, 'pluscode example is first', btns.length === 7 && btns[0].dataset.ex === 'pluscode', btns.map(b => b.dataset.ex).join(','));
  btns[0].dispatch('click'); await flush();
  check(c, 'pluscode decodes to 101 cell centre', near(latV(), 25.0335625, 1e-6) && near(lngV(), 121.5645625, 1e-6), E('lat').value + ',' + E('lng').value);
  await clearAll();
  const log0 = FETCH_LOG.length;
  const btnA = btns.find(b => b.dataset.ex === 'address');
  check(c, 'address example exists', !!btnA, btns.map(b => b.dataset.ex).join(','));
  if(btnA) btnA.dispatch('click'); await flush();
  const log = FETCH_LOG.slice(log0);
  const tt = log.find(u => u.includes('/tt-search'));
  check(c, 'address example → tt-search full string', !!tt && decodeURIComponent(tt).includes('信義路五段7號'), tt ? decodeURIComponent(tt).slice(0, 80) : 'no tt call');
  const rowEl = candRows().find(x => x.textContent.includes('信義路五段'));
  check(c, '101 address candidate listed', !!rowEl, candAllText().slice(0, 60));
  if(rowEl) rowEl.dispatch('click'); await flush();
  check(c, 'confirmed = 101 address point', near(latV(), 25.033524, 1e-6) && near(lngV(), 121.564604, 1e-6), E('lat').value + ',' + E('lng').value);
}));

rows.push(row('W10', 'Short-code example button: 2HM7+CR Taipei City -> recovered full-code cell centre (fix108, Taipei 101)', async (c) => {
  const btns = [...document.querySelectorAll('.ex-btn')];
  const btnS = btns.find(b => b.dataset.ex === 'shortcode');
  check(c, 'shortcode example exists (2nd)', !!btnS && btns[1] === btnS, btns.map(b => b.dataset.ex).join(','));
  if(btnS) btnS.dispatch('click'); await flush();
  check(c, 'short code recovered to full-code cell centre', near(latV(), 25.0335625, 1e-6) && near(lngV(), 121.5645625, 1e-6), E('lat').value + ',' + E('lng').value);
}));

rows.push(row('W11', 'Network timeout protection: /stats and /resolve calls both carry a timeout signal (fix109)', async (c) => {
  const idxs = FETCH_LOG.map((u, i) => i).filter(i => FETCH_LOG[i].includes('/stats'));
  check(c, 'stats called on load', idxs.length > 0, String(idxs.length));
  check(c, 'stats fetch has timeout signal', idxs.length > 0 && FETCH_OPTS[idxs[idxs.length - 1]] === 'sig', idxs.length ? FETCH_OPTS[idxs[idxs.length - 1]] : 'none');
  const log0 = FETCH_LOG.length;
  await pasteAndParse('https://naver.me/GcAsfvpu');
  const log = FETCH_LOG.slice(log0); const olog = FETCH_OPTS.slice(log0);
  const ri = log.findIndex(u => u.includes('/resolve'));
  check(c, 'resolve fetch has timeout signal', ri >= 0 && olog[ri] === 'sig', ri >= 0 ? olog[ri] : 'no resolve call');
}));
