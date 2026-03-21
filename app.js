'use strict';

// ===== 定数 =====
const STORAGE_KEY = 'travel_plans_v1';

const CATEGORIES = {
  sightseeing: { icon: '🏛️', label: '観光',        color: '#1976D2' },
  food:        { icon: '🍽️', label: 'グルメ',       color: '#F57C00' },
  shopping:    { icon: '🛍️', label: 'ショッピング',  color: '#7B1FA2' },
  hotel:       { icon: '🏨', label: '宿泊',          color: '#388E3C' },
  transport:   { icon: '🚃', label: '移動',          color: '#0097A7' },
  other:       { icon: '📌', label: 'その他',        color: '#757575' },
};

// ===== 状態 =====
let plans = [];
let state = {
  planId: null,
  dayIndex: 0,
  spotId: null,
  editingSpot: false,
  selectedCat: 'sightseeing',
};

// ===== ユーティリティ =====
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function datesBetween(start, end) {
  const dates = [];
  const cur  = new Date(start + 'T00:00:00');
  const endD = new Date(end   + 'T00:00:00');
  while (cur <= endD) {
    // toISOStringはUTCなので日本時間だとズレる → ローカル日付で組み立てる
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function fmtDate(dateStr) {
  const d  = new Date(dateStr + 'T00:00:00');
  const dw = ['日','月','火','水','木','金','土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dw})`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== デフォルトプラン（盛岡つなぎ温泉旅行） =====
const DEFAULT_PLAN = {
  id: 'morioka-tsurunoyu-2026',
  name: '盛岡つなぎ温泉旅行',
  city: 'Morioka',
  startDate: '2026-04-18',
  endDate: '2026-04-22',
  days: [
    {
      id: 'day1',
      date: '2026-04-18',
      city: 'Sagamihara',
      spots: [
        {
          id: 'd1s1', completed: false, category: 'transport',
          name: '相模原エリア 出発', address: '相模原市',
          time: '19:45', duration: 0, website: '', notes: '',
        },
        {
          id: 'd1s2', completed: false, category: 'transport',
          name: '横浜駅東口（YCAT）発',
          address: '横浜シティ・エア・ターミナル（YCAT）神奈川県横浜市西区高島2-19-12',
          time: '21:35', duration: 0, website: '',
          notes: 'さくら高速バス KR801（車中泊）',
        },
      ],
    },
    {
      id: 'day2',
      date: '2026-04-19',
      city: 'Kakunodate',
      spots: [
        {
          id: 'd2s1', completed: false, category: 'transport',
          name: '大曲駅東口 到着',
          address: '秋田県大仙市大曲大曲59 大曲駅東口',
          time: '07:40', duration: 20, website: '',
          notes: '',
        },
        {
          id: 'd2s1b', completed: false, category: 'transport',
          name: 'ニッポンレンタカー 大曲店 借受',
          address: '秋田県大仙市大曲通町337-3',
          time: '08:00', duration: 30, website: '',
          notes: 'TEL: 000-0000-0000',
        },
        {
          id: 'd2s2', completed: false, category: 'sightseeing',
          name: '角館・武家屋敷通り',
          address: '秋田県仙北市角館町表町下丁',
          time: '09:00', duration: 120, website: 'https://www.city.semboku.akita.jp/sightseeing/spot/04_samurai.html',
          notes: 'しだれ桜と黒板塀の「小京都」散策',
        },
        {
          id: 'd2s3', completed: false, category: 'food',
          name: '昼食（角館）',
          address: '秋田県仙北市角館町',
          time: '11:00', duration: 90, website: '',
          notes: '比内地鶏、稲庭うどんなど',
        },
        {
          id: 'd2s4', completed: false, category: 'sightseeing',
          name: '【★オプション】抱返り渓谷',
          address: '秋田県仙北市角館町広久内',
          time: '12:30', duration: 90, website: '',
          notes: '鮮やかな青い渓流。癒やしの散策路',
        },
        {
          id: 'd2s5', completed: false, category: 'sightseeing',
          name: '田沢湖（たつこ像・御座石神社）',
          address: '秋田県仙北市西木町西明寺潟尻 田沢湖',
          time: '14:30', duration: 90, website: '',
          notes: 'たつこ像・御座石神社（絶景フォトスポット）',
        },
        {
          id: 'd2s6', completed: false, category: 'hotel',
          name: '田沢湖水沢温泉郷セルリアンリゾートAONI',
          address: '秋田県仙北市田沢湖生保内字駒ヶ岳2-1',
          time: '15:00', duration: 0, website: '',
          notes: 'IN 15:00〜18:00 / OUT 10:00 / 税込9,300円 / 2026年4月11日までキャンセル料無料',
        },
      ],
    },
    {
      id: 'day3',
      date: '2026-04-20',
      city: 'Hirosaki',
      spots: [
        {
          id: 'd3s0', completed: false, category: 'hotel',
          name: 'セルリアンリゾートAONI チェックアウト',
          address: '秋田県仙北市田沢湖生保内字駒ヶ岳2-1',
          time: '10:00', duration: 0, website: '',
          notes: 'OUT 10:00',
        },
        {
          id: 'd3s1', completed: false, category: 'transport',
          name: 'セルリアンリゾートAONI 出発',
          address: '秋田県仙北市田沢湖生保内字駒ヶ岳2-1',
          time: '10:00', duration: 0, website: '',
          notes: '青森・弘前へ移動（約2時間半）',
        },
        {
          id: 'd3s2', completed: false, category: 'food',
          name: '昼食（弘前）',
          address: '青森県弘前市',
          time: '12:00', duration: 90, website: '',
          notes: 'アップルパイ食べ比べもおすすめ',
        },
        {
          id: 'd3s3', completed: false, category: 'sightseeing',
          name: '弘前公園（弘前城）',
          address: '青森県弘前市下白銀町1 弘前公園',
          time: '13:30', duration: 90, website: 'https://www.hirosakipark.jp/',
          notes: '現存天守と日本一の桜。外濠の「花筏」',
        },
        {
          id: 'd3s4', completed: false, category: 'sightseeing',
          name: '洋館巡り・スターバックス（登録有形文化財）',
          address: '青森県弘前市上白銀町1-1 スターバックスコーヒー弘前公園前店',
          time: '15:30', duration: 60, website: '',
          notes: '登録有形文化財のレトロなスタバで休憩',
        },
        {
          id: 'd3s5', completed: false, category: 'sightseeing',
          name: '【★オプション】禅林街',
          address: '青森県弘前市西茂森1丁目',
          time: '16:30', duration: 60, website: '',
          notes: '33の寺院が並ぶ静謐な寺町',
        },
        {
          id: 'd3s6', completed: false, category: 'sightseeing',
          name: '弘前公園 夜桜鑑賞',
          address: '青森県弘前市下白銀町1 弘前公園',
          time: '19:00', duration: 90, website: '',
          notes: 'ライトアップされた幻想的な桜',
        },
        {
          id: 'd3s7', completed: false, category: 'hotel',
          name: '天然温泉 岩木桜の湯 ドーミーイン弘前',
          address: '青森県弘前市本町26-1',
          time: '', duration: 0, website: 'https://www.hotespa.net/hotels/hirosaki/',
          notes: '予約番号: XXXXXXXXXXXX / 朝食付 / 禁煙ダブルルーム / ¥66,600（税込・返金不可）/ 事前決済済',
        },
      ],
    },
    {
      id: 'day4',
      date: '2026-04-21',
      city: 'Miyako',
      spots: [
        {
          id: 'd4s0', completed: false, category: 'hotel',
          name: 'ドーミーイン弘前 チェックアウト',
          address: '青森県弘前市本町26-1',
          time: '10:00', duration: 0, website: '',
          notes: 'OUT 10:00',
        },
        {
          id: 'd4s1', completed: false, category: 'transport',
          name: '弘前 出発',
          address: '青森県弘前市本町26-1',
          time: '08:30', duration: 0, website: '',
          notes: '岩手・龍泉洞へ移動',
        },
        {
          id: 'd4s2', completed: false, category: 'sightseeing',
          name: '龍泉洞 見学',
          address: '岩手県岩泉町岩泉字神成1-1',
          time: '10:15', duration: 75, website: 'https://www.iwaizumi-kanko.net/ryusendo/',
          notes: '世界有数の透明度を誇る「地底の芸術」',
        },
        {
          id: 'd4s3', completed: false, category: 'transport',
          name: '三陸・宮古へ移動',
          address: '岩手県宮古市',
          time: '11:30', duration: 60, website: '',
          notes: '沿岸部へドライブ（約1時間）',
        },
        {
          id: 'd4s4', completed: false, category: 'food',
          name: '昼食（宮古）',
          address: '岩手県宮古市',
          time: '12:30', duration: 60, website: '',
          notes: '海鮮丼・名物「瓶ドン」など海の幸',
        },
        {
          id: 'd4s5', completed: false, category: 'sightseeing',
          name: '浄土ヶ浜【★オプション：さっぱ船で青の洞窟へ】',
          address: '岩手県宮古市日立浜町32 浄土ヶ浜',
          time: '14:00', duration: 90, website: 'https://jodogahama-vc.com/',
          notes: 'さっぱ船で青の洞窟へ（★追加オプション）',
        },
        {
          id: 'd4s6', completed: false, category: 'transport',
          name: 'つなぎ温泉へ移動',
          address: '岩手県盛岡市繋',
          time: '15:30', duration: 105, website: '',
          notes: '宮古から盛岡方面へ（約1時間45分）',
        },
        {
          id: 'd4s7', completed: false, category: 'hotel',
          name: '盛岡つなぎ温泉 愛真館',
          address: '岩手県盛岡市繋字塗沢40-4',
          time: '17:30', duration: 0, website: 'https://aishinkan.jp/',
          notes: '予約番号: XXXXXXXXXX / TEL: 000-0000-0002 / IN 17:30 / 田中 花子 様 / 本館和室8〜12畳 / 33市町村の食と酒＆ライブキッチン/ドリンクインクルーシブ',
        },
      ],
    },
    {
      id: 'day5',
      date: '2026-04-22',
      city: 'Hiraizumi',
      spots: [
        {
          id: 'd5s0', completed: false, category: 'hotel',
          name: '愛真館 チェックアウト',
          address: '岩手県盛岡市繋字塗沢40-4',
          time: '08:30', duration: 0, website: '',
          notes: '',
        },
        {
          id: 'd5s1', completed: false, category: 'transport',
          name: '愛真館 出発',
          address: '岩手県盛岡市繋字塗沢40-4',
          time: '08:30', duration: 0, website: '',
          notes: '盛岡市内を経由して南下',
        },
        {
          id: 'd5s2', completed: false, category: 'sightseeing',
          name: '【★オプション】岩手銀行赤レンガ館',
          address: '岩手県盛岡市中ノ橋通1-2-20',
          time: '09:00', duration: 60, website: 'https://www.iwagin-kaikando.jp/',
          notes: '盛岡市内のレトロモダンな名建築',
        },
        {
          id: 'd5s3', completed: false, category: 'sightseeing',
          name: '中尊寺（金色堂）',
          address: '岩手県西磐井郡平泉町平泉衣関202',
          time: '10:30', duration: 90, website: 'https://www.chusonji.or.jp/',
          notes: '世界遺産。平安美術の極致',
        },
        {
          id: 'd5s4', completed: false, category: 'sightseeing',
          name: '【★オプション】毛越寺・浄土庭園',
          address: '岩手県西磐井郡平泉町平泉字大沢58',
          time: '12:00', duration: 60, website: 'https://www.motsuji.or.jp/',
          notes: '美しい庭園をゆったり散歩',
        },
        {
          id: 'd5s5', completed: false, category: 'food',
          name: '昼食（一関・平泉）',
          address: '岩手県一関市',
          time: '13:00', duration: 60, website: '',
          notes: '一関名物「もち料理」',
        },
        {
          id: 'd5s6', completed: false, category: 'sightseeing',
          name: '厳美渓（空飛ぶだんご）',
          address: '岩手県一関市厳美町 厳美渓',
          time: '14:00', duration: 90, website: '',
          notes: '籠で届く名物団子。渓谷美も堪能',
        },
        {
          id: 'd5s7', completed: false, category: 'sightseeing',
          name: '達谷窟毘沙門堂',
          address: '岩手県西磐井郡平泉町平泉北澤16',
          time: '15:30', duration: 60, website: '',
          notes: '岩壁にお堂が埋まる不思議な絶景',
        },
        {
          id: 'd5s8', completed: false, category: 'transport',
          name: 'ニッポンレンタカー 一関店 返却',
          address: '岩手県一関市上大槻街1-29',
          time: '16:30', duration: 30, website: '',
          notes: 'TEL: 000-0000-0001 / 乗り捨て（大曲→一関）',
        },
        {
          id: 'd5s9', completed: false, category: 'transport',
          name: '一ノ関駅 発（新幹線やまびこ号）',
          address: '岩手県一関市駅前15-10 一ノ関駅',
          time: '17:48', duration: 0, website: '',
          notes: 'やまびこ号にて東京へ',
        },
        {
          id: 'd5s10', completed: false, category: 'other',
          name: '相模原 帰宅',
          address: '相模原市',
          time: '22:00', duration: 0, website: '',
          notes: 'お疲れ様でした！',
        },
      ],
    },
  ],
};

// ===== 画像圧縮（localStorage容量節約） =====
// 最大幅1200px・JPEG品質0.75に縮小して返す
function compressImage(dataURL, maxWidth = 1200, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio  = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.naturalWidth  * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataURL); // 失敗時はそのまま返す
    img.src = dataURL;
  });
}

// ===== ストレージ =====
function loadPlans() {
  try { plans = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { plans = []; }
  if (plans.length === 0) {
    plans = [DEFAULT_PLAN];
    savePlans();
  }
  updateStorageMeter();
}
function savePlans() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      alert('⚠️ 保存容量が不足しています。\n\n添付した画像が大きすぎる可能性があります。\nルートメモの画像を削除するか、より小さい画像を使ってください。');
    } else {
      alert('⚠️ データの保存に失敗しました: ' + e.message);
    }
  }
  updateStorageMeter();
}

function updateStorageMeter() {
  const wrap = document.getElementById('storage-meter-wrap');
  if (!wrap) return;

  // localStorage の使用バイト数を計算（UTF-16: 1文字 = 2バイト）
  let usedBytes = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      usedBytes += (key.length + localStorage[key].length) * 2;
    }
  }

  const LIMIT_BYTES = 5 * 1024 * 1024; // 5MB
  const pct = Math.min((usedBytes / LIMIT_BYTES) * 100, 100);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);

  const bar   = document.getElementById('storage-meter-bar');
  const label = document.getElementById('storage-meter-label');

  bar.style.width = pct + '%';
  bar.style.background = pct < 60 ? '#4caf50' : pct < 85 ? '#ff9800' : '#f44336';
  label.textContent = `${usedMB} MB / 5 MB`;

  // 90%超えたら警告を表示
  wrap.title = pct >= 90
    ? '⚠️ 容量が残りわずかです。画像を削除することをお勧めします。'
    : `localStorage 使用量: ${pct.toFixed(1)}%`;
}

// ===== IndexedDB 画像ストレージ =====
let _imgDB = null;

function openImageDB() {
  if (_imgDB) return Promise.resolve(_imgDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('travel_images_v1', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('images');
    req.onsuccess = e => { _imgDB = e.target.result; resolve(_imgDB); };
    req.onerror = () => reject(req.error);
  });
}

async function saveImage(key, dataUrl) {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put(dataUrl, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadImage(key) {
  const db = await openImageDB();
  return new Promise(resolve => {
    const req = db.transaction('images').objectStore('images').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function deleteImage(key) {
  const db = await openImageDB();
  return new Promise(resolve => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').delete(key);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}

// localStorage内のdata:画像をすべてIndexedDBに移行（初回のみ）
async function migrateImagesToIndexedDB() {
  let migrated = false;
  for (const plan of plans) {
    for (const day of plan.days || []) {
      for (const spot of day.spots || []) {
        if (spot.photo && spot.photo.startsWith('data:')) {
          const compressed = await compressImage(spot.photo);
          await saveImage('spot:' + spot.id, compressed);
          spot.photo = 'idb';
          migrated = true;
        }
      }
    }
    for (const key of Object.keys(plan.routes || {})) {
      const route = plan.routes[key];
      if (route.image && route.image.startsWith('data:')) {
        const compressed = await compressImage(route.image);
        await saveImage('route:' + plan.id + ':' + key, compressed);
        route.image = 'idb';
        migrated = true;
      }
    }
  }
  if (migrated) {
    savePlans();
    updateStorageMeter();
    console.log('[Migration] 画像をIndexedDBへ移行しました');
  }
}

// ===== ナビゲーション =====
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  state.planId   = null;
  state.dayIndex = 0;
  renderHome();
  showView('view-home');
}

// ===== ホーム =====
function renderHome() {
  const list  = document.getElementById('plan-list');
  const empty = document.getElementById('empty-home');
  list.innerHTML = '';

  if (plans.length === 0) {
    empty.style.display = 'flex';
    list.style.display  = 'none';
    return;
  }
  empty.style.display = 'none';
  list.style.display  = 'flex';

  plans.sort((a, b) => a.startDate.localeCompare(b.startDate));

  plans.forEach(plan => {
    const total = plan.days.reduce((s, d) => s + d.spots.length, 0);
    const done  = plan.days.reduce((s, d) => s + d.spots.filter(sp => sp.completed).length, 0);
    const pct   = total ? Math.round(done / total * 100) : 0;
    const r = 18, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    const card = document.createElement('div');
    card.className = 'plan-card';
    card.onclick   = () => openPlan(plan.id);
    card.innerHTML = `
      <div class="plan-card-emoji">✈️</div>
      <div class="plan-card-info">
        <h3>${esc(plan.name)}</h3>
        <p>${fmtDate(plan.startDate)} 〜 ${fmtDate(plan.endDate)}</p>
        <p>📍 ${esc(plan.city || '目的地未設定')}</p>
      </div>
      <div class="plan-card-right">
        <div class="progress-ring-wrap">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="4"/>
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="#43A047" stroke-width="4"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
              stroke-linecap="round" style="transition:stroke-dashoffset .3s"/>
          </svg>
          <div class="progress-center-text">${pct}%</div>
        </div>
        <div class="plan-card-days">${plan.days.length}日間</div>
        <button class="btn-plan-delete" title="削除">🗑️</button>
      </div>
    `;
    card.querySelector('.btn-plan-delete').addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`「${plan.name}」を削除しますか？`)) return;
      plans = plans.filter(p => p.id !== plan.id);
      savePlans();
      renderHome();
    });
    list.appendChild(card);
  });
}

// ===== プラン操作 =====
function getCurrentPlan() { return plans.find(p => p.id === state.planId); }

function openPlan(planId) {
  state.planId   = planId;
  state.dayIndex = 0;
  renderPlan();
  showView('view-plan');
}

function renderPlan() {
  const plan = getCurrentPlan();
  if (!plan) return;
  document.getElementById('plan-title').textContent = plan.name;
  renderDayTabs(plan);
  renderSpotList(plan);
}

// ===== 日付タブ =====
function renderDayTabs(plan) {
  const container = document.getElementById('day-tabs');
  container.innerHTML = '';
  plan.days.forEach((day, i) => {
    const btn = document.createElement('button');
    btn.className = 'day-tab' + (i === state.dayIndex ? ' active' : '');
    btn.innerHTML = `<span class="tab-day">Day ${i + 1}</span><span class="tab-date">${fmtDate(day.date)}</span>`;
    btn.onclick = () => {
      state.dayIndex = i;
      renderDayTabs(plan);
      renderSpotList(plan);
      renderDayCityBar(plan);
    };
    container.appendChild(btn);
  });
  renderDayCityBar(plan);
}

function renderDayCityBar(plan) {
  const day  = plan.days[state.dayIndex];
  const bar  = document.getElementById('day-city-bar');
  const city = day.city || plan.city || '';
  const inherited = !day.city && plan.city;
  if (city) {
    const yahooUrl = `https://weather.yahoo.co.jp/weather/search/?p=${encodeURIComponent(city)}`;
    bar.innerHTML = `📍 <strong>${esc(city)}</strong>${inherited ? '　<span style="opacity:.6;font-size:11px">（プラン共通）</span>' : ''}　<span style="opacity:.6;font-size:11px">タップして変更</span>　<a href="${yahooUrl}" target="_blank" onclick="event.stopPropagation()" class="btn-yahoo-weather">🌤 Yahoo!天気</a>`;
  } else {
    bar.innerHTML = `📍 <span style="opacity:.6">この日の目的地を設定（タップ）</span>`;
  }
}

function editDayCity() {
  const plan    = getCurrentPlan();
  const day     = plan.days[state.dayIndex];
  const current = day.city || plan.city || '';
  const input   = prompt('この日の目的地を入力\n\n【入力例】\n　盛岡　弘前　仙台　京都　など日本語OK\n\n【天気予報について】\n　旅行5日前から自動で天気が表示されます\n\n空欄にするとプラン共通の設定を使用', current);
  if (input === null) return;
  day.city = input.trim();
  savePlans();
  renderDayCityBar(plan);
}

// ===== スポットリスト =====
function renderSpotList(plan) {
  const container = document.getElementById('spot-list');
  container.innerHTML = '';
  const day = plan.days[state.dayIndex];
  if (!day) return;

  // manualSort が true のときは day.spots の格納順をそのまま使う
  const spots = day.manualSort
    ? [...day.spots]
    : [...day.spots].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

  if (spots.length === 0) {
    container.innerHTML = `
      <div class="empty-day">
        ＋ ボタンでスポットを追加しましょう<br>
        <span style="font-size:13px">観光地・ホテル・レストランなど</span>
      </div>`;
    return;
  }

  // 手動並び替えモード中は「時刻順に戻す」ボタンを表示
  if (day.manualSort) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'spot-sort-reset';
    resetBtn.textContent = '🕐 時刻順に並び替え';
    resetBtn.addEventListener('click', () => {
      day.manualSort = false;
      savePlans();
      renderSpotList(plan);
    });
    container.appendChild(resetBtn);
  }

  spots.forEach((spot, idx) => {
    const cat      = CATEGORIES[spot.category] || CATEGORIES.other;
    const isFirst  = idx === 0;
    const isLast   = idx === spots.length - 1;
    const nextSpot = !isLast ? spots[idx + 1] : null;
    const addr     = spot.address ? `📍 ${spot.address}` : '';
    const durLabel = spot.duration ? `⏱ 滞在 ${spot.duration}分` : `⏱ 滞在時間を入力`;

    // 発時刻：duration>0 なら 着＋滞在、duration=0 なら 着と同時刻（即出発）
    // 先頭スポットは spot.time 自体が「発」なので別処理
    const depTime = (!isFirst && spot.time)
      ? (spot.duration > 0 ? addMinutes(spot.time, spot.duration) : spot.time)
      : '';

    // 翌日またぎの判定（depTime が spot.time より前 = 日をまたぐ）
    const isNextDay = depTime && spot.time && depTime < spot.time;
    const depLabel  = isNextDay ? `翌${depTime}` : depTime;

    // 時刻列HTML：先頭スポットは「発」のみ手入力、2番目以降は「着」「発」
    const timeColHTML = isFirst ? `
        <div class="time-dep time-dep-first" title="タップして発時刻を編集">
          <span class="time-label">発</span>${spot.time || '--:--'}
        </div>
    ` : `
        <div class="time-arr" title="タップして着時刻を編集">
          <span class="time-label">着</span>${spot.time || '--:--'}
        </div>
        ${depTime ? `
        <div class="time-dep" title="タップして発時刻を編集">
          <span class="time-label">発</span>${depLabel}
        </div>` : ''}
    `;

    const row = document.createElement('div');
    row.className = 'spot-row';
    row.dataset.spotId = spot.id;
    row.innerHTML = `
      <div class="spot-time-col">${timeColHTML}</div>
      <div class="spot-line-col">
        <div class="spot-dot ${spot.category || 'other'} ${spot.completed ? 'done' : ''}"></div>
        ${!isLast ? '<div class="spot-connector"></div>' : ''}
      </div>
      <div class="spot-card-col">
        <div class="spot-card ${spot.completed ? 'completed' : ''}" onclick="showSpotDetail('${spot.id}')">
          <button class="drag-handle" onclick="event.stopPropagation()" title="ドラッグして並び替え">⠿</button>
          <div class="spot-cat-icon">${cat.icon}</div>
          <div class="spot-card-body">
            <div class="spot-card-name">${esc(spot.name)}</div>
            ${addr ? `<div class="spot-card-sub">${esc(addr)}</div>` : ''}
            ${!isFirst ? `<div class="spot-card-dur" data-id="${spot.id}">${durLabel}</div>` : ''}
          </div>
          <button class="spot-check-btn ${spot.completed ? 'checked' : ''}"
            onclick="event.stopPropagation(); toggleSpot('${spot.id}')">
            ${spot.completed ? '✓' : ''}
          </button>
        </div>
      </div>
    `;
    container.appendChild(row);

    if (isFirst) {
      // 先頭スポット：「発」をタップで spot.time を直接編集
      const depFirstEl = row.querySelector('.time-dep-first');
      depFirstEl.addEventListener('click', e => {
        e.stopPropagation();
        if (depFirstEl.querySelector('input')) return;
        const input = document.createElement('input');
        input.type         = 'time';
        input.value        = spot.time || '';
        input.autocomplete = 'off';
        input.className    = 'inline-time-input inline-time-dep';
        depFirstEl.innerHTML = '';
        depFirstEl.appendChild(input);
        input.focus();
        const save = () => {
          spot.time = input.value;
          savePlans();
          renderSpotList(plan);
          scrollToSpot(spot.id);
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e2 => {
          if (e2.key === 'Enter')  input.blur();
          if (e2.key === 'Escape') renderSpotList(plan);
        });
      });

    } else {
      // 2番目以降：着時刻をタップで編集
      const arrEl = row.querySelector('.time-arr');
      arrEl.addEventListener('click', e => {
        e.stopPropagation();
        if (arrEl.querySelector('input')) return;
        const input = document.createElement('input');
        input.type         = 'time';
        input.value        = spot.time || '';
        input.autocomplete = 'off';
        input.className    = 'inline-time-input';
        arrEl.innerHTML = '';
        arrEl.appendChild(input);
        input.focus();
        const save = () => {
          spot.time = input.value;
          savePlans();
          renderSpotList(plan);
          scrollToSpot(spot.id);
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e2 => {
          if (e2.key === 'Enter')  input.blur();
          if (e2.key === 'Escape') renderSpotList(plan);
        });
      });

      // 発時刻をタップで編集（duration を逆算して保存）
      const depEl = row.querySelector('.time-dep');
      if (depEl) {
        depEl.addEventListener('click', e => {
          e.stopPropagation();
          if (depEl.querySelector('input')) return;
          const input = document.createElement('input');
          input.type         = 'time';
          input.value        = depTime;
          input.autocomplete = 'off';
          input.className    = 'inline-time-input inline-time-dep';
          depEl.innerHTML = '';
          depEl.appendChild(input);
          input.focus();
          const save = () => {
            if (input.value && spot.time) {
              const [ah, am] = spot.time.split(':').map(Number);
              const [dh, dm] = input.value.split(':').map(Number);
              let newDur = (dh * 60 + dm) - (ah * 60 + am);
              if (newDur < 0) newDur += 24 * 60; // 日をまたぐ場合（ホテル等）
              // 23時間超は同日入力ミスの可能性が高いのでリセット
              if (newDur > 1380) {
                alert('発時刻が着時刻より前になっています。入力を確認してください。');
                newDur = 0;
              }
              spot.duration = newDur;
              savePlans();
            }
            renderSpotList(plan);
            scrollToSpot(spot.id);
          };
          input.addEventListener('blur', save);
          input.addEventListener('keydown', e2 => {
            if (e2.key === 'Enter')  input.blur();
            if (e2.key === 'Escape') renderSpotList(plan);
          });
        });
      }
    }

    // 滞在時間をタップで直接編集（先頭スポットには存在しないためnullチェック）
    const durEl = row.querySelector('.spot-card-dur');
    if (durEl) durEl.addEventListener('click', e => {
      e.stopPropagation();
      if (durEl.querySelector('input')) return;
      const input = document.createElement('input');
      input.type         = 'number';
      input.min          = '0';
      input.placeholder  = '分';
      input.autocomplete = 'off';
      input.value        = spot.duration || '';
      input.className    = 'inline-dur-input';
      durEl.textContent = '';
      durEl.appendChild(input);
      input.focus();
      const save = () => {
        const v = parseInt(input.value);
        spot.duration = isNaN(v) ? 0 : v;
        savePlans();
        renderSpotList(plan);
        scrollToSpot(spot.id);
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e2 => {
        if (e2.key === 'Enter')  input.blur();
        if (e2.key === 'Escape') renderSpotList(plan);
      });
    });

    // スポット間の経路ボタン
    if (nextSpot) {
      const originAddr = spot.address     || spot.name;
      const destAddr   = nextSpot.address || nextSpot.name;
      const origin  = encodeURIComponent(originAddr);
      const dest    = encodeURIComponent(destAddr);
      const baseUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
      // 公共交通はスポット名の方が駅・バス停として認識されやすい
      const transitFrom = encodeURIComponent(spot.name     || spot.address);
      const transitTo   = encodeURIComponent(nextSpot.name || nextSpot.address);
      const urls = {
        transit: `https://transit.yahoo.co.jp/?from=${transitFrom}&to=${transitTo}`,
        car:     `${baseUrl}&travelmode=driving`,
        walk:    `${baseUrl}&travelmode=walking`,
      };
      const routeKey = `${spot.id}__${nextSpot.id}`;
      if (!plan.routes) plan.routes = {};
      const savedMode      = plan.routes[routeKey]?.mode || 'car';
      const savedTravelMin = plan.routes[routeKey]?.travelMin;

      // 移動時間の計算：手入力保存値 → スポット時刻差分 の優先順位
      const depTime    = addMinutes(spot.time, spot.duration || 0);
      const timeDiff   = diffMinutes(depTime, nextSpot.time);
      const travelMin  = savedTravelMin ?? (timeDiff !== null && timeDiff >= 0 ? timeDiff : null);
      const routeRow = document.createElement('div');
      routeRow.className = 'route-row';
      routeRow.dataset.routeKey = routeKey;
      routeRow._selectedMode = savedMode;
      routeRow._urls = urls;
      routeRow._spot = spot;
      routeRow._nextSpot = nextSpot;
      routeRow._routeKey = routeKey;
      routeRow._plan = plan;
      routeRow.innerHTML = `
        <div class="route-spacer"></div>
        <div class="route-col">
          <div class="route-buttons">
            <button class="btn-mode btn-mode-transit${savedMode==='transit'?' active':''}" data-mode="transit">🚃 公共交通</button>
            <button class="btn-mode btn-mode-car${savedMode==='car'?' active':''}" data-mode="car">🚗 車</button>
            <button class="btn-mode btn-mode-walk${savedMode==='walk'?' active':''}" data-mode="walk">🚶 徒歩</button>
            <button class="btn-mode btn-mode-wait${savedMode==='wait'?' active':''}" data-mode="wait">⏳ 待機</button>
          </div>
          <div class="route-time-display">
            <span class="route-time-label" style="${savedMode==='wait'?'display:none':''}">移動時間</span>
            <input type="number" class="route-time-input" min="0" placeholder="--"
              autocomplete="new-password"
              value="${travelMin !== null ? travelMin : ''}"
              style="${savedMode==='wait'?'display:none':''}">
            <span class="route-time-unit" style="${savedMode==='wait'?'display:none':''}">分</span>
            <a class="route-maps-link" href="${urls[savedMode]||urls.car}" target="_blank">${savedMode==='transit'?'路線情報を開く →':'地図を開く →'}</a>
          </div>
        </div>
      `;
      // 移動時間入力：ブラー or Enter で自動保存＆時刻反映
      const timeInput = routeRow.querySelector('.route-time-input');
      const applyInput = () => {
        const mins = parseInt(timeInput.value);
        if (!isNaN(mins) && mins >= 0) applyOneStep(routeRow, mins);
      };
      timeInput.addEventListener('blur', applyInput);
      timeInput.addEventListener('keydown', e => { if (e.key === 'Enter') timeInput.blur(); });

      routeRow.querySelectorAll('.btn-mode').forEach(btn => {
        btn.addEventListener('click', () => {
          routeRow.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          routeRow._selectedMode = btn.dataset.mode;
          if (!plan.routes) plan.routes = {};
          if (!plan.routes[routeKey]) plan.routes[routeKey] = {};
          plan.routes[routeKey].mode = btn.dataset.mode;
          savePlans();
          updateRouteTimeDisplay(routeRow);
        });
      });

      // 保存済みデータで即時表示（非同期待ちでボタンが消える問題を防ぐ）
      updateRouteTimeDisplay(routeRow);

      // メモセクションを追加
      const memoSection = document.createElement('div');
      memoSection.className = 'route-memo-section';
      routeRow.querySelector('.route-col').appendChild(memoSection);
      container.appendChild(routeRow);
      renderRouteMemo(memoSection, plan, routeKey);
    }
  });

  // ドラッグ並び替えを初期化
  initDragSort(container, plan);
}

// ===== ドラッグ並び替え =====
function initDragSort(container, plan) {
  const day = plan.days[state.dayIndex];

  // 前回レンダリング時の残骸を削除
  document.querySelectorAll('.drag-drop-indicator').forEach(el => el.remove());

  // ドロップ位置ライン（body に固定配置）
  const dropLine = document.createElement('div');
  dropLine.className = 'drag-drop-indicator';
  dropLine.style.display = 'none';
  document.body.appendChild(dropLine);

  let dragging   = false;
  let dragSpotId = null;
  let dragRow    = null;
  let ghost      = null;
  let startY     = 0;
  let ghostTop   = 0;

  // ドラッグ中を除いた spot-row 一覧
  const otherRows = () =>
    [...container.querySelectorAll('.spot-row[data-spot-id]')]
      .filter(r => r !== dragRow);

  // pointer Y からドロップ先を計算
  function calcDrop(y) {
    const rows = otherRows();
    for (const row of rows) {
      const r = row.getBoundingClientRect();
      if (y < r.top + r.height / 2) return { insertBefore: row, rows };
    }
    return { insertBefore: null, rows };
  }

  // ドロップラインを更新
  function updateDropLine(y) {
    const { insertBefore, rows } = calcDrop(y);
    const cRect = container.getBoundingClientRect();
    let lineY;
    if (insertBefore) {
      lineY = insertBefore.getBoundingClientRect().top;
    } else if (rows.length > 0) {
      const last = rows[rows.length - 1];
      lineY = last.getBoundingClientRect().bottom;
    } else {
      dropLine.style.display = 'none';
      return;
    }
    dropLine.style.cssText = `
      display:block;position:fixed;pointer-events:none;z-index:9998;
      left:${cRect.left + 64}px;top:${lineY - 2}px;
      width:${cRect.width - 72}px;height:3px;
      background:var(--primary);border-radius:2px;
    `;
  }

  container.querySelectorAll('.drag-handle').forEach(handle => {

    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      const row = handle.closest('.spot-row');
      if (!row?.dataset.spotId) return;

      dragging   = true;
      dragSpotId = row.dataset.spotId;
      dragRow    = row;
      startY     = e.clientY;

      const rect = row.getBoundingClientRect();
      ghostTop   = rect.top;

      // ゴースト（カードの浮いたコピー）
      ghost = row.cloneNode(true);
      ghost.style.cssText = `
        position:fixed;left:${rect.left}px;top:${rect.top}px;
        width:${rect.width}px;margin:0;opacity:0.9;pointer-events:none;
        z-index:9999;box-shadow:0 8px 28px rgba(0,0,0,0.25);border-radius:14px;
      `;
      document.body.appendChild(ghost);

      // 元の行を半透明に（DOMはそのまま残す）
      row.style.opacity = '0.25';

      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', e => {
      if (!dragging || !ghost) return;
      e.preventDefault();
      ghost.style.top = (ghostTop + (e.clientY - startY)) + 'px';
      updateDropLine(e.clientY);
    });

    handle.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;

      ghost?.remove(); ghost = null;
      dropLine.style.display = 'none';
      if (dragRow) dragRow.style.opacity = '';

      // 新しい並び順を計算
      const { insertBefore, rows } = calcDrop(e.clientY);
      const otherIds = rows.map(r => r.dataset.spotId);
      const insertIdx = insertBefore
        ? otherIds.indexOf(insertBefore.dataset.spotId)
        : otherIds.length;

      const newIds = [...otherIds];
      newIds.splice(insertIdx, 0, dragSpotId);

      day.spots      = newIds.map(id => day.spots.find(s => s.id === id)).filter(Boolean);
      day.manualSort = true;
      savePlans();

      dragSpotId = null;
      dragRow    = null;
      renderSpotList(plan);
    });
  });
}

// 編集したスポット行へスムーズスクロール
function scrollToSpot(spotId) {
  if (!spotId) return;
  requestAnimationFrame(() => {
    const el = document.querySelector(`.spot-row[data-spot-id="${spotId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function toggleSpot(spotId) {
  const plan = getCurrentPlan();
  const day  = plan.days[state.dayIndex];
  const spot = day.spots.find(s => s.id === spotId);
  if (spot) { spot.completed = !spot.completed; savePlans(); renderSpotList(plan); }
}

// ===== スポット詳細 =====
function showSpotDetail(spotId) {
  const plan = getCurrentPlan();
  const day  = plan.days[state.dayIndex];
  const spot = day.spots.find(s => s.id === spotId);
  if (!spot) return;
  state.spotId = spotId;

  const cat = CATEGORIES[spot.category] || CATEGORIES.other;
  document.getElementById('detail-cat-icon').textContent = cat.icon;
  document.getElementById('detail-name').textContent     = spot.name;

  const setRow = (id, html) => {
    const el = document.getElementById(id);
    if (html) { el.innerHTML = html; el.style.display = 'block'; }
    else el.style.display = 'none';
  };
  setRow('detail-time',    spot.time    ? `🕐 ${spot.time}${spot.duration ? `　滞在${spot.duration}分` : ''}` : null);
  setRow('detail-address', spot.address ? `📍 ${esc(spot.address)}` : null);
  setRow('detail-notes',   spot.notes   ? `📝 ${esc(spot.notes)}`   : null);

  const photoEl = document.getElementById('detail-photo');
  photoEl.style.display = 'none';
  photoEl.onclick = null;
  if (spot.photo === 'idb') {
    loadImage('spot:' + spot.id).then(dataUrl => {
      if (dataUrl) {
        photoEl.src = dataUrl;
        photoEl.style.display = 'block';
        photoEl.onclick = () => openLightbox(dataUrl);
      }
    });
  } else if (spot.photo) {
    photoEl.src = spot.photo;
    photoEl.style.display = 'block';
    photoEl.onclick = () => openLightbox(spot.photo);
  }

  const dest = encodeURIComponent(spot.address || spot.name);
  document.getElementById('detail-maps-transit').href =
    `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`;
  document.getElementById('detail-maps-car').href =
    `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;

  const webEl = document.getElementById('detail-website');
  if (spot.website) { webEl.href = spot.website; webEl.style.display = 'flex'; }
  else webEl.style.display = 'none';

  const loc  = encodeURIComponent(spot.address || spot.name);
  const locR = spot.address || spot.name;
  document.getElementById('local-link-buttons').innerHTML = `
    <a href="https://tabelog.com/rstLst/?LstKwd=${loc}" target="_blank" class="btn-food">🍜 食べログ</a>
    <a href="https://www.google.com/maps/search/レストラン+${loc}" target="_blank" class="btn-food">🍴 Gマップ グルメ</a>
    <a href="https://www.jalan.net/kankou/?keywordid=${encodeURIComponent(locR)}" target="_blank" class="btn-food">🗾 じゃらん</a>
    <a href="https://www.google.com/search?q=${loc}+名産品+お土産" target="_blank" class="btn-food">🎁 名産品・お土産</a>
  `;

  showModal('modal-spot-detail');
}

function editCurrentSpot() {
  closeModal('modal-spot-detail');
  const plan = getCurrentPlan();
  const spot = plan.days[state.dayIndex].spots.find(s => s.id === state.spotId);
  if (!spot) return;
  state.editingSpot = true;
  state.selectedCat = spot.category || 'sightseeing';
  document.getElementById('spot-modal-title').textContent   = '📍 スポットを編集';
  document.getElementById('spot-name').value     = spot.name     || '';
  document.getElementById('spot-address').value  = spot.address  || '';
  document.getElementById('spot-time').value     = spot.time     || '';
  document.getElementById('spot-duration').value = spot.duration || '';
  document.getElementById('spot-notes').value    = spot.notes    || '';
  if (spot.photo === 'idb') {
    loadImage('spot:' + spot.id).then(dataUrl => setSpotPhotoPreview(dataUrl || ''));
  } else {
    setSpotPhotoPreview(spot.photo || '');
  }
  refreshCatBtns();
  attachSpotPasteHandler();
  showModal('modal-add-spot');
}

function deleteCurrentSpot() {
  if (!confirm('このスポットを削除しますか？')) return;
  const plan = getCurrentPlan();
  const day  = plan.days[state.dayIndex];
  const spot = day.spots.find(s => s.id === state.spotId);
  if (spot?.photo === 'idb') deleteImage('spot:' + spot.id);
  day.spots  = day.spots.filter(s => s.id !== state.spotId);
  savePlans();
  closeModal('modal-spot-detail');
  renderSpotList(plan);
}

// ===== スポット追加/編集 =====
function showAddSpotModal() {
  state.editingSpot = false;
  state.spotId      = null;
  state.selectedCat = 'sightseeing';
  document.getElementById('spot-modal-title').textContent = '📍 スポットを追加';
  ['spot-name','spot-address','spot-time','spot-duration','spot-notes']
    .forEach(id => { document.getElementById(id).value = ''; });
  setSpotPhotoPreview('');
  refreshCatBtns();
  attachSpotPasteHandler();
  showModal('modal-add-spot');
}

function refreshCatBtns() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === state.selectedCat);
  });
}

// ===== スポット写真 =====
function setSpotPhotoPreview(dataUrl) {
  state.editPhotoData = dataUrl || '';
  const preview     = document.getElementById('spot-photo-preview');
  const placeholder = document.getElementById('spot-photo-placeholder');
  const clearBtn    = document.getElementById('spot-photo-clear');
  if (dataUrl) {
    preview.src           = dataUrl;
    preview.style.display = 'block';
    preview.style.cursor  = 'zoom-in';
    preview.onclick       = () => openLightbox(dataUrl);
    placeholder.style.display = 'none';
    clearBtn.style.display    = 'inline-block';
  } else {
    preview.src           = '';
    preview.onclick       = null;
    preview.style.display = 'none';
    placeholder.style.display = 'block';
    clearBtn.style.display    = 'none';
  }
}

function clearSpotPhoto() {
  setSpotPhotoPreview('');
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = async e => setSpotPhotoPreview(await compressImage(e.target.result));
  reader.readAsDataURL(file);
}

// スポットモーダルが開いている間 Ctrl+V で写真をペースト可能にする
let _spotPasteHandler = null;
function attachSpotPasteHandler() {
  if (_spotPasteHandler) document.removeEventListener('paste', _spotPasteHandler);
  _spotPasteHandler = e => {
    if (document.getElementById('modal-add-spot').style.display === 'none') return;
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = async ev => setSpotPhotoPreview(await compressImage(ev.target.result));
        reader.readAsDataURL(blob);
        break;
      }
    }
  };
  document.addEventListener('paste', _spotPasteHandler);
}

async function saveSpot() {
  const name = document.getElementById('spot-name').value.trim();
  if (!name) { alert('スポット名を入力してください'); return; }

  const plan = getCurrentPlan();
  const day  = plan.days[state.dayIndex];
  const existingSpot = state.editingSpot && state.spotId
    ? day.spots.find(s => s.id === state.spotId) : null;

  // 写真の扱い：data: → IndexedDBへ、'' でクリア、'idb' はそのまま引き継ぐ
  let photoVal;
  if (state.editPhotoData && state.editPhotoData.startsWith('data:')) {
    photoVal = 'idb';
  } else if (state.editPhotoData === '' && existingSpot?.photo === 'idb') {
    photoVal = '';
  } else {
    photoVal = state.editPhotoData ?? existingSpot?.photo ?? '';
  }

  const data = {
    name,
    address:  document.getElementById('spot-address').value.trim(),
    time:     document.getElementById('spot-time').value,
    duration: parseInt(document.getElementById('spot-duration').value) || 0,
    website:  existingSpot?.website || '',
    photo:    photoVal,
    notes:    document.getElementById('spot-notes').value.trim(),
    category: state.selectedCat,
  };

  let savedId;
  if (existingSpot) {
    Object.assign(existingSpot, data);
    savedId = existingSpot.id;
  } else {
    const newSpot = { id: uid(), completed: false, ...data };
    day.spots.push(newSpot);
    savedId = newSpot.id;
  }

  // IndexedDBへ画像を保存 / 削除
  if (state.editPhotoData && state.editPhotoData.startsWith('data:')) {
    await saveImage('spot:' + savedId, state.editPhotoData);
  } else if (state.editPhotoData === '' && existingSpot?.photo === 'idb') {
    await deleteImage('spot:' + savedId);
  }

  savePlans();
  closeModal('modal-add-spot');
  renderSpotList(plan);
  scrollToSpot(savedId);
}

// ===== プラン作成/編集 =====
function updateDayCityFields(existingCities = []) {
  const start     = document.getElementById('new-plan-start').value;
  const end       = document.getElementById('new-plan-end').value;
  const container = document.getElementById('day-city-fields');
  container.innerHTML = '';
  if (!start || !end || end < start) return;

  const dates = datesBetween(start, end);

  const lbl = document.createElement('label');
  lbl.className   = 'day-city-fields-label';
  lbl.textContent = '目的地（日ごとに設定・天気取得に使用）';
  container.appendChild(lbl);

  dates.forEach((date, i) => {
    const row = document.createElement('div');
    row.className = 'day-city-row';
    row.innerHTML = `
      <span class="day-city-label">${i + 1}日目（${fmtDate(date)}）</span>
      <input type="text" class="day-city-input" data-index="${i}"
        placeholder="例：函館 / Hakodate" value="${esc(existingCities[i] || '')}">
    `;
    container.appendChild(row);
  });
}

function getDayCities() {
  return [...document.querySelectorAll('.day-city-input')].map(el => el.value.trim());
}

function showNewPlanModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('new-plan-name').value  = '';
  document.getElementById('new-plan-start').value = today;
  document.getElementById('new-plan-end').value   = today;
  document.getElementById('btn-create-plan').textContent = '作成';
  document.getElementById('btn-create-plan').onclick     = createPlan;
  updateDayCityFields();
  showModal('modal-new-plan');
}

function createPlan() {
  const name  = document.getElementById('new-plan-name').value.trim();
  const start = document.getElementById('new-plan-start').value;
  const end   = document.getElementById('new-plan-end').value;
  if (!name || !start || !end) { alert('プラン名・出発日・帰着日を入力してください'); return; }
  if (end < start) { alert('帰着日は出発日以降を設定してください'); return; }

  const cities = getDayCities();
  const plan = {
    id: uid(), name,
    city: cities[0] || '',
    startDate: start, endDate: end,
    days: datesBetween(start, end).map((date, i) => ({
      id: uid(), date, city: cities[i] || '', spots: [],
    })),
  };
  plans.push(plan);
  savePlans();
  closeModal('modal-new-plan');
  openPlan(plan.id);
}

function editPlanInfo() {
  closeModal('modal-plan-menu');
  const plan = getCurrentPlan();
  document.getElementById('new-plan-name').value  = plan.name;
  document.getElementById('new-plan-start').value = plan.startDate;
  document.getElementById('new-plan-end').value   = plan.endDate;
  document.getElementById('btn-create-plan').textContent = '更新';
  document.getElementById('btn-create-plan').onclick     = updatePlan;
  updateDayCityFields(plan.days.map(d => d.city || ''));
  showModal('modal-new-plan');
}

function updatePlan() {
  const plan  = getCurrentPlan();
  const start = document.getElementById('new-plan-start').value;
  const end   = document.getElementById('new-plan-end').value;
  if (end < start) { alert('帰着日は出発日以降を設定してください'); return; }

  const cities    = getDayCities();
  plan.name       = document.getElementById('new-plan-name').value.trim() || plan.name;
  plan.city       = cities[0] || '';
  const newDates  = datesBetween(start, end);
  const oldDaysMap = {};
  plan.days.forEach(d => { oldDaysMap[d.date] = d; });
  plan.days = newDates.map((date, i) => {
    const existing = oldDaysMap[date] || { id: uid(), date, spots: [] };
    existing.city  = cities[i] || '';
    return existing;
  });
  plan.startDate = start;
  plan.endDate   = end;
  state.dayIndex = 0;

  savePlans();
  closeModal('modal-new-plan');
  renderPlan();
  document.getElementById('btn-create-plan').textContent = '作成';
  document.getElementById('btn-create-plan').onclick     = createPlan;
}

function deletePlan() {
  if (!confirm(`「${getCurrentPlan()?.name}」を削除しますか？`)) return;
  plans = plans.filter(p => p.id !== state.planId);
  savePlans();
  closeModal('modal-plan-menu');
  goHome();
}

// ===== 日別 印刷 =====

/** この日のスケジュールを印刷用HTMLで開いてPDF保存・印刷 */
function printDayAsPdf() {
  const plan = getCurrentPlan();
  if (!plan) return;
  const day    = plan.days[state.dayIndex];
  const city   = day.city || plan.city || '';
  const dayNum = state.dayIndex + 1;

  // 時刻順ソート
  const spots = [...day.spots].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  // ルートキー取得ヘルパー
  const routeKey = (a, b) =>
    `${a.id}__${b.id}`;

  // スポット行HTML生成
  let spotsHtml = '';
  spots.forEach((spot, i) => {
    const cat  = CATEGORIES[spot.category] || CATEGORIES.other;
    const time = spot.time     ? `<span class="time">${spot.time}</span>` : '<span class="time no-time">--:--</span>';
    const dur  = spot.duration ? `<span class="dur">滞在 ${spot.duration}分</span>` : '';
    const addr = spot.address  ? `<div class="sub">📍 ${esc(spot.address)}</div>` : '';
    const note = spot.notes    ? `<div class="sub note">📝 ${esc(spot.notes).replace(/\n/g, '<br>')}</div>` : '';

    spotsHtml += `
      <tr class="spot-row">
        <td class="time-col">${time}</td>
        <td class="icon-col">${cat.icon}</td>
        <td class="name-col">
          <div class="name">${esc(spot.name)}${dur}</div>
          ${addr}${note}
        </td>
      </tr>`;

    // 次のスポットとの経路メモ
    if (i < spots.length - 1) {
      const next = spots[i + 1];
      const key  = routeKey(spot, next);
      const route = (plan.routes || {})[key];
      const modeLabel = { transit: '🚃 公共交通', car: '🚗 車', walk: '🚶 徒歩', wait: '⏳ 待機' };
      let routeHtml = '';
      if (route) {
        const mode = modeLabel[route.mode] || '';
        const min  = route.travelMin ? `${route.travelMin}分` : '';
        const txt  = route.text || '';
        routeHtml = `${mode}${min ? '　' + min : ''}${txt ? '<br><span class="route-text">' + esc(txt).replace(/\n/g,'<br>') + '</span>' : ''}`;
      }
      spotsHtml += `
        <tr class="route-row">
          <td class="time-col"></td>
          <td class="icon-col route-arrow">↓</td>
          <td class="route-text-col">${routeHtml}</td>
        </tr>`;
    }
  });

  if (!spotsHtml) {
    spotsHtml = '<tr><td colspan="3" class="empty">（スポットなし）</td></tr>';
  }

  const cityLine = city ? `<span class="city">📍 ${esc(city)}</span>` : '';
  const printedAt = new Date().toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric' });

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${esc(plan.name)} — Day ${dayNum}（${fmtDate(day.date)}）</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Hiragino Sans', 'Meiryo', 'Noto Sans JP', sans-serif;
    font-size: 13px; color: #1a1a2e; padding: 20mm 18mm;
    line-height: 1.6;
  }
  h1 { font-size: 20px; font-weight: 800; color: #1565C0; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #555; margin-bottom: 2px; }
  .city { font-size: 13px; color: #1976D2; font-weight: 600; }
  .divider { border: none; border-top: 2px solid #1976D2; margin: 10px 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  .spot-row td { padding: 7px 6px; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
  .route-row td { padding: 3px 6px; vertical-align: top; }
  .time-col { width: 52px; white-space: nowrap; padding-top: 8px; }
  .icon-col { width: 28px; text-align: center; font-size: 17px; padding-top: 7px; }
  .name-col { }
  .time { font-size: 13px; font-weight: 700; color: #1565C0; }
  .no-time { color: #aaa; }
  .dur { font-size: 11px; color: #F57C00; margin-left: 8px; font-weight: 600; }
  .name { font-size: 14px; font-weight: 700; }
  .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .note { color: #374151; }
  .route-arrow { color: #9ca3af; font-size: 16px; }
  .route-text-col { font-size: 11px; color: #6b7280; padding-top: 4px; }
  .route-text { color: #374151; }
  .empty { text-align: center; color: #9ca3af; padding: 24px; }
  .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: right; }
  @media print {
    body { padding: 12mm 14mm; }
    @page { margin: 0; size: A4; }
  }
</style>
</head>
<body>
  <h1>${esc(plan.name)}</h1>
  <div class="meta">Day ${dayNum}　${fmtDate(day.date)}　${cityLine}</div>
  <hr class="divider">
  <table>
    <tbody>${spotsHtml}</tbody>
  </table>
  <div class="footer">旅プランアプリ　印刷日：${printedAt}</div>
  <script>
    window.onload = function() {
      window.print();
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) {
    alert('⚠️ ポップアップがブロックされています。\nブラウザのポップアップ許可設定を確認してください。');
    return;
  }
  win.document.write(html);
  win.document.close();
}

// ===== 共有/エクスポート =====
function sharePlan() {
  closeModal('modal-plan-menu');
  const plan      = getCurrentPlan();
  const json      = JSON.stringify(plan);
  const container = document.getElementById('qr-container');
  container.innerHTML = '';
  showView('view-share');

  if (json.length > 2953) {
    container.innerHTML = `<div class="qr-warning">
      ⚠️ プランのデータが大きすぎてQRコードを生成できません。<br>
      下の「ファイルとして保存」ボタンを使ってLINE等で共有してください。
    </div>`;
  } else {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    QRCode.toCanvas(canvas, json, { width: 260, margin: 2 }, err => {
      if (err) container.innerHTML = '<p style="color:red">QRコード生成エラー</p>';
    });
  }
}

async function exportPlan() {
  const plan     = getCurrentPlan();
  const json     = JSON.stringify(plan, null, 2);
  const fileName = `${plan.name}.json`;

  // スマホ：Web Share API でLINE等のネイティブ共有メニューを表示
  if (navigator.share && navigator.canShare) {
    const file = new File([json], fileName, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: plan.name,
          text: `旅プラン「${plan.name}」を共有します 📍`,
          files: [file],
        });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // キャンセルはそのまま終了
        // その他のエラーはダウンロードにフォールバック
      }
    }
  }

  // PC / 非対応ブラウザ：ファイルダウンロード
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== インポート =====
function importPlanNav() {
  closeModal('modal-plan-menu');
  showView('view-import');
}

function importFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const plan = JSON.parse(e.target.result);
      if (!plan.id || !plan.name || !Array.isArray(plan.days)) throw new Error();
      const existing = plans.findIndex(p => p.id === plan.id);
      if (existing >= 0) {
        if (!confirm(`「${plan.name}」は既にあります。上書きしますか？`)) return;
        plans[existing] = plan;
      } else {
        plans.push(plan);
      }
      savePlans();
      alert('✅ インポートしました！');
      openPlan(plan.id);
    } catch {
      alert('⚠️ ファイルの読み込みに失敗しました。\n旅プランのJSONファイルを選んでください。');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== Excel / CSV インポート =====

/** カテゴリ別名マップ（日本語・英語を正規キーへ変換） */
const CAT_ALIAS = {
  '観光': 'sightseeing', '名所': 'sightseeing', '見学': 'sightseeing', '史跡': 'sightseeing',
  '食事': 'food', 'グルメ': 'food', '飲食': 'food', 'レストラン': 'food',
  '昼食': 'food', '夕食': 'food', '朝食': 'food', '飲み': 'food',
  'ショッピング': 'shopping', '買い物': 'shopping',
  '宿泊': 'hotel', 'ホテル': 'hotel', '旅館': 'hotel', '民宿': 'hotel',
  '移動': 'transport', '交通': 'transport', 'バス': 'transport',
  '電車': 'transport', '新幹線': 'transport', '飛行機': 'transport', '船': 'transport',
  'その他': 'other',
};

function normalizeCategory(val) {
  if (!val) return 'other';
  const v = String(val).trim();
  // 既存キーが直接来た場合
  if (CATEGORIES[v]) return v;
  // 日本語ラベルが来た場合
  const byLabel = Object.keys(CATEGORIES).find(k => CATEGORIES[k].label === v);
  if (byLabel) return byLabel;
  // 別名マップ
  if (CAT_ALIAS[v]) return CAT_ALIAS[v];
  // 英語（小文字比較）
  const lower = v.toLowerCase();
  const engMap = {
    sightseeing: 'sightseeing', sight: 'sightseeing', tourism: 'sightseeing',
    food: 'food', restaurant: 'food', eat: 'food', lunch: 'food', dinner: 'food', breakfast: 'food',
    shopping: 'shopping', shop: 'shopping',
    hotel: 'hotel', stay: 'hotel', accommodation: 'hotel',
    transport: 'transport', transit: 'transport', move: 'transport', train: 'transport',
  };
  return engMap[lower] || 'other';
}

/** Excel シリアル値 → YYYY-MM-DD */
function excelSerialToDate(serial) {
  // Excel は 1900年1月1日 = 1（ただし1900/2/29のバグがあるため -25568 ではなく -25569 を使う）
  const utcMs = (Math.floor(serial) - 25569) * 86400 * 1000;
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** 各種フォーマットの日付 → YYYY-MM-DD（または null） */
function normalizeDate(val) {
  if (val === null || val === undefined || val === '') return null;
  // JS Date オブジェクト（SheetJS が cellDates:true の場合）
  if (val instanceof Date) {
    if (isNaN(val)) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Excel シリアル数値
  if (typeof val === 'number') {
    if (val < 1 || val > 2958466) return null; // 範囲外はスキップ
    return excelSerialToDate(val);
  }
  const s = String(val).trim();
  if (!s) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // YYYY/MM/DD or YYYY/M/D
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, mo, d] = s.split('/');
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // MM/DD or M/D（年は現在年で補完）
  if (/^\d{1,2}\/\d{1,2}$/.test(s)) {
    const [mo, d] = s.split('/');
    const year = new Date().getFullYear();
    return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/** 各種フォーマットの時刻 → HH:MM（または ''） */
function normalizeTime(val) {
  if (val === null || val === undefined || val === '') return '';
  // JS Date（時刻部分のみ使用）
  if (val instanceof Date) {
    return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
  }
  // Excel 時刻（1日の小数部分、0.5 = 12:00）
  if (typeof val === 'number') {
    const frac = val % 1; // 小数部分だけ取り出す
    if (frac === 0 && val >= 1) return ''; // 日付のみの値はスキップ
    const totalMin = Math.round(frac * 24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  // HH:MM または HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.slice(0, 5).padStart(5, '0');
  // 午前/午後 HH:MM
  const ampm = s.match(/^(午前|午後|am|pm)\s*(\d{1,2}):(\d{2})/i);
  if (ampm) {
    let h = parseInt(ampm[2]);
    const m = ampm[3];
    if (/午後|pm/i.test(ampm[1]) && h < 12) h += 12;
    if (/午前|am/i.test(ampm[1]) && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return '';
}

/** 列名 → フィールドキーのマップ定義 */
const COL_ALIASES = {
  date:     ['日付', 'date', '年月日', '日', '出発日', '到着日'],
  name:     ['スポット名', '場所', '名前', 'name', 'spot', 'スポット', '目的地', '観光地'],
  category: ['カテゴリ', 'category', 'カテゴリー', '種別', '種類', 'ジャンル'],
  time:     ['時刻', 'time', '開始時刻', '出発時刻', '到着時刻', '開始', '集合時間'],
  duration: ['滞在時間', 'duration', '時間(分)', '所要時間', '滞在(分)', '時間', '分', '所要(分)'],
  address:  ['住所', 'address', '場所(詳細)', '住所・場所', '所在地'],
  notes:    ['メモ', 'memo', 'notes', '備考', 'ノート', '注意', 'note'],
};

/** ヘッダー行から列インデックスマップを生成 */
function detectColumns(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    const lower = String(h || '').trim().toLowerCase();
    for (const [key, aliases] of Object.entries(COL_ALIASES)) {
      if (!(key in map) && aliases.some(a => a.toLowerCase() === lower)) {
        map[key] = idx;
      }
    }
  });
  return map;
}

/** 2次元配列（SheetJS の sheet_to_json header:1 形式）→ spotデータ配列 */
function parseSheetRows(rows) {
  if (!rows || rows.length < 2) return null;
  const headers = rows[0].map(h => String(h ?? ''));
  const colMap  = detectColumns(headers);
  // 「スポット名」列は必須
  if (colMap.name === undefined) return null;

  const spots = [];
  for (let i = 1; i < rows.length; i++) {
    const row  = rows[i];
    const name = colMap.name !== undefined ? String(row[colMap.name] ?? '').trim() : '';
    if (!name) continue;

    spots.push({
      id:        uid(),
      completed: false,
      name,
      date:     colMap.date     !== undefined ? normalizeDate(row[colMap.date])     : null,
      category: normalizeCategory(colMap.category !== undefined ? row[colMap.category] : ''),
      time:     colMap.time     !== undefined ? normalizeTime(row[colMap.time])     : '',
      duration: colMap.duration !== undefined ? (parseInt(row[colMap.duration]) || 0) : 0,
      address:  colMap.address  !== undefined ? String(row[colMap.address]  ?? '').trim() : '',
      notes:    colMap.notes    !== undefined ? String(row[colMap.notes]    ?? '').trim() : '',
      photo:    '',
      website:  '',
    });
  }
  return spots.length > 0 ? spots : null;
}

/** CSV 1行をフィールド配列に分割（ダブルクォート対応） */
function parseCsvLine(line, sep = ',') {
  const result = [];
  let current = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === sep && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// プレビューモーダルに渡す一時バッファ
let _excelImportSpots = [];

/** インポートプレビューモーダルを表示 */
function showExcelImportModal(spots) {
  _excelImportSpots = spots;

  // プレビュー行を生成
  const tbody = document.getElementById('excel-preview-tbody');
  tbody.innerHTML = '';
  spots.forEach(spot => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${spot.date || '—'}</td>
      <td class="col-name">${esc(spot.name)}</td>
      <td>${CATEGORIES[spot.category]?.icon || '📌'} ${CATEGORIES[spot.category]?.label || spot.category}</td>
      <td>${spot.time || '—'}</td>
      <td>${spot.duration ? spot.duration + '分' : '—'}</td>
    `;
    tbody.appendChild(tr);
  });

  // 追加先プラン選択肢を生成
  const select  = document.getElementById('excel-import-target-plan');
  const curPlan = getCurrentPlan();
  select.innerHTML = '';

  if (curPlan) {
    const opt = document.createElement('option');
    opt.value       = curPlan.id;
    opt.textContent = `📋 現在のプラン「${curPlan.name}」に追加`;
    opt.selected    = true;
    select.appendChild(opt);
  }

  const newOpt = document.createElement('option');
  newOpt.value       = '__new__';
  newOpt.textContent = '＋ 新しいプランとして作成';
  select.appendChild(newOpt);

  plans.filter(p => p.id !== curPlan?.id).forEach(p => {
    const opt = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = `📋 ${p.name}`;
    select.appendChild(opt);
  });

  document.getElementById('excel-import-count').textContent =
    `${spots.length}件のスポットを読み込みました`;
  showModal('modal-excel-preview');
}

/** インポート実行 */
function executeExcelImport() {
  const targetId = document.getElementById('excel-import-target-plan').value;
  const spots    = _excelImportSpots;
  if (!spots.length) return;

  if (targetId === '__new__') {
    // 日付範囲をスポットから自動検出して新プランを作成
    const dates = spots.map(s => s.date).filter(Boolean).sort();
    const start = dates[0] || new Date().toISOString().split('T')[0];
    const end   = dates[dates.length - 1] || start;

    const planName = prompt('新しいプラン名を入力してください', 'インポートしたプラン');
    if (planName === null) return;
    const safeName = planName.trim() || 'インポートしたプラン';

    const newPlan = {
      id: uid(), name: safeName,
      city: '',
      startDate: start, endDate: end,
      days: datesBetween(start, end).map(date => ({
        id: uid(), date, city: '', spots: [],
      })),
      routes: {},
    };

    spots.forEach(spot => {
      const day = spot.date
        ? newPlan.days.find(d => d.date === spot.date)
        : newPlan.days[0];
      if (day) day.spots.push({ ...spot });
    });

    plans.push(newPlan);
    savePlans();
    closeModal('modal-excel-preview');
    alert(`✅ ${spots.length}件のスポットをインポートしました！`);
    openPlan(newPlan.id);

  } else {
    const targetPlan = plans.find(p => p.id === targetId);
    if (!targetPlan) { alert('プランが見つかりません'); return; }

    let added = 0, skipped = 0;
    spots.forEach(spot => {
      // 日付が一致する日に追加、日付なし→現在選択中の日
      const day = spot.date
        ? targetPlan.days.find(d => d.date === spot.date)
        : (targetPlan.days[state.dayIndex] || targetPlan.days[0]);
      if (day) { day.spots.push({ ...spot }); added++; }
      else skipped++;
    });

    savePlans();
    closeModal('modal-excel-preview');

    const msg = skipped > 0
      ? `✅ ${added}件追加しました。\n（${skipped}件はプラン期間外の日付のためスキップ）`
      : `✅ ${added}件のスポットを追加しました！`;
    alert(msg);

    if (getCurrentPlan()?.id === targetId) {
      renderSpotList(targetPlan);
    } else {
      openPlan(targetId);
    }
  }
}

/** Excel / CSV ファイルを読み込んでプレビューへ */
function importFromExcelFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = ''; // 同じファイルを再選択できるようリセット

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv' || ext === 'tsv') {
    const sep = ext === 'tsv' ? '\t' : ',';
    const reader = new FileReader();
    reader.onload = e => {
      // BOM 除去
      const text = e.target.result.replace(/^\uFEFF/, '');
      const rows = text.split(/\r?\n/).filter(l => l.trim()).map(l => parseCsvLine(l, sep));
      const spots = parseSheetRows(rows);
      if (!spots) {
        alert('⚠️ 読み込めませんでした。\n1行目に列名（スポット名 は必須）を入力してください。\n[サンプルCSVをダウンロード] でフォーマットを確認できます。');
        return;
      }
      showExcelImportModal(spots);
    };
    reader.readAsText(file, 'UTF-8');

  } else if (ext === 'xlsx' || ext === 'xls') {
    if (typeof XLSX === 'undefined') {
      alert('⚠️ Excelの読み込みライブラリが読み込まれていません。\nネット接続を確認してください。');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const workbook  = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet     = workbook.Sheets[sheetName];
        const rows      = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const spots     = parseSheetRows(rows);
        if (!spots) {
          alert('⚠️ 読み込めませんでした。\n1行目に列名（スポット名 は必須）を入力してください。\n[サンプルCSVをダウンロード] でフォーマットを確認できます。');
          return;
        }
        showExcelImportModal(spots);
      } catch (err) {
        alert('⚠️ Excelファイルの読み込みに失敗しました。\n' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);

  } else {
    alert('⚠️ .xlsx / .csv / .tsv ファイルを選択してください。');
  }
}

/** サンプル CSV をダウンロード（Excel で開けるよう BOM 付き UTF-8） */
function downloadSampleCsv() {
  const rows = [
    ['日付', 'スポット名', 'カテゴリ', '時刻', '滞在時間', '住所', 'メモ'],
    ['2026/04/18', '東京駅', '移動',    '08:00', '30', '東京都千代田区丸の内1-9-1', '新幹線乗り換え'],
    ['2026/04/18', '函館朝市', 'グルメ', '11:00', '60', '北海道函館市若松町9-19',   '新鮮な海鮮丼が絶品'],
    ['2026/04/18', '五稜郭公園', '観光', '13:30', '90', '北海道函館市五稜郭町44',  '桜の名所・タワー展望あり'],
    ['2026/04/18', 'ラビスタ函館ベイ', '宿泊', '16:00', '0', '北海道函館市豊川町12-6', '朝食ビュッフェが有名'],
    ['2026/04/19', '函館山展望台', '観光', '09:00', '60', '北海道函館市函館山', ''],
    ['2026/04/19', 'トラピスチヌ修道院', '観光', '11:00', '45', '北海道函館市上湯川町', ''],
  ];
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\r\n');
  const bom  = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'スケジュールサンプル.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ===== 天気 =====
function fmtMin(min) {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}時間${m}分` : `${h}時間`;
}

function addMinutes(timeStr, mins) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** 2つの時刻文字列（HH:MM）の差を分で返す。日をまたぐ場合も考慮 */
function diffMinutes(t1, t2) {
  if (!t1 || !t2) return null;
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  let diff = toMin(t2) - toMin(t1);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

// ===== 一括時刻更新 =====
// その日のスポットを先頭から順にたどり、滞在時間＋移動時間で全時刻を再計算する
function refreshAllTimes() {
  const plan = getCurrentPlan();
  if (!plan) return;
  const day = plan.days[state.dayIndex];
  if (!day) return;
  const spots = day.spots;
  if (!spots || spots.length < 2) return;

  let updated = false;
  for (let i = 0; i < spots.length - 1; i++) {
    const spot     = spots[i];
    const nextSpot = spots[i + 1];
    if (!spot.time) continue;                  // 発時刻がなければスキップ

    const routeKey  = `${spot.id}__${nextSpot.id}`;
    const travelMin = plan.routes?.[routeKey]?.travelMin;
    if (travelMin === undefined) continue;     // 移動時間が未設定ならスキップ

    const newTime = addMinutes(spot.time, (spot.duration || 0) + travelMin);
    if (newTime && newTime !== nextSpot.time) {
      nextSpot.time = newTime;
      updated = true;
    }
  }

  if (updated) {
    savePlans();
    renderSpotList(plan);
  }
}

// 次の1スポットの時刻だけを更新（連鎖しない）
function applyOneStep(routeRow, travelMin) {
  const plan = getCurrentPlan();
  if (!plan) return;
  const spot     = routeRow._spot;
  const nextSpot = routeRow._nextSpot;
  if (!spot || !nextSpot || !spot.time) return;

  nextSpot.time = addMinutes(spot.time, (spot.duration || 0) + travelMin);

  // plan.routes に永続保存
  if (!plan.routes) plan.routes = {};
  if (!plan.routes[routeRow._routeKey]) plan.routes[routeRow._routeKey] = {};
  plan.routes[routeRow._routeKey].travelMin = travelMin;

  savePlans();
  renderSpotList(plan);
}


function updateRouteTimeDisplay(rowEl) {
  const display    = rowEl.querySelector('.route-time-display');
  if (!display) return;
  const timeLabel = display.querySelector('.route-time-label');
  const timeInput = display.querySelector('.route-time-input');
  const timeUnit  = display.querySelector('.route-time-unit');
  const mapsLink  = display.querySelector('.route-maps-link');
  const mode   = rowEl._selectedMode;
  const isWait = mode === 'wait';

  // 待機モード：ラベル・入力欄・単位・地図リンクを非表示
  if (timeLabel) timeLabel.style.display = isWait ? 'none' : '';
  if (timeInput) timeInput.style.display = isWait ? 'none' : '';
  if (timeUnit)  timeUnit.style.display  = isWait ? 'none' : '';
  if (mapsLink) {
    mapsLink.style.display = isWait ? 'none' : '';
    mapsLink.href          = isWait ? '#' : (rowEl._urls[mode] || rowEl._urls.car);
    mapsLink.textContent   = mode === 'transit' ? '路線情報を開く →' : '地図を開く →';
  }

}


// ===== ルートメモ =====
function renderRouteMemo(section, plan, key) {
  if (!plan.routes) plan.routes = {};
  const meta = plan.routes[key] || {};
  const hasContent = meta.text || meta.image;
  section.innerHTML = '';

  if (hasContent) {
    const summary = document.createElement('div');
    summary.className = 'route-memo-summary';
    if (meta.image) {
      const img = document.createElement('img');
      img.className = 'route-memo-thumb';
      img.title = 'タップで拡大 / 長押しで編集';
      if (meta.image === 'idb') {
        loadImage('route:' + plan.id + ':' + key).then(dataUrl => {
          if (dataUrl) {
            img.src = dataUrl;
            img.addEventListener('click', () => openLightbox(dataUrl));
          }
        });
      } else {
        img.src = meta.image;
        img.addEventListener('click', () => openLightbox(meta.image));
      }
      summary.appendChild(img);
    }
    if (meta.text) {
      const txt = document.createElement('div');
      txt.className = 'route-memo-text';
      txt.textContent = meta.text;
      summary.appendChild(txt);
    }
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-route-memo-edit';
    editBtn.textContent = '✏️';
    editBtn.title = 'メモを編集';
    editBtn.addEventListener('click', () => openRouteMemoEdit(section, plan, key));
    summary.appendChild(editBtn);
    section.appendChild(summary);
  } else {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-route-memo-add';
    addBtn.textContent = '📋 ルートのメモ・画像を追加';
    addBtn.addEventListener('click', () => openRouteMemoEdit(section, plan, key));
    section.appendChild(addBtn);
  }
}

function openRouteMemoEdit(section, plan, key) {
  if (!plan.routes) plan.routes = {};
  const meta = plan.routes[key] || {};

  section.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'route-memo-panel';

  // ボタン群（上部）
  const actions = document.createElement('div');
  actions.className = 'route-memo-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.className = 'btn-route-memo-cancel';
  const removePaste = () => document.removeEventListener('paste', pasteHandler);
  cancelBtn.addEventListener('click', () => { removePaste(); renderRouteMemo(section, plan, key); });

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑 クリア';
  clearBtn.className = 'btn-route-memo-clear';
  clearBtn.addEventListener('click', () => {
    if (!confirm('メモと画像を削除しますか？')) return;
    section.innerHTML = '';   // 即座にクリア（stale参照対策）
    if (plan.routes?.[key]?.image === 'idb') deleteImage('route:' + plan.id + ':' + key);
    if (plan.routes) delete plan.routes[key];
    savePlans();
    removePaste();
    renderSpotList(plan);     // DOM全体を再構築して確実に反映
    requestAnimationFrame(() => {
      // key から対象スポット行を探してスクロール
      const target = document.querySelector(`[data-route-key="${key}"]`)
                  || document.querySelector('.spot-row');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '保存';
  saveBtn.className = 'btn-route-memo-save';
  saveBtn.addEventListener('click', async () => {
    if (!plan.routes) plan.routes = {};
    const routeIdbKey = 'route:' + plan.id + ':' + key;
    let imageVal = imgData || '';
    if (imgData && imgData.startsWith('data:')) {
      await saveImage(routeIdbKey, imgData);
      imageVal = 'idb';
    } else if (!imgData && plan.routes[key]?.image === 'idb') {
      await deleteImage(routeIdbKey);
    }
    plan.routes[key] = { ...plan.routes[key], text: textarea.value.trim(), image: imageVal };
    savePlans();
    removePaste();
    renderRouteMemo(section, plan, key);
    requestAnimationFrame(() => {
      const routeRow = section.closest('.route-row');
      const target   = routeRow?.previousElementSibling || routeRow || section;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(saveBtn);
  panel.appendChild(actions);

  // テキストエリア
  const textarea = document.createElement('textarea');
  textarea.className = 'route-memo-textarea';
  textarea.placeholder = '経路メモ（路線名・乗り換え・料金・時刻など）\n画像はCtrl+V でペーストできます';
  textarea.value = meta.text || '';
  panel.appendChild(textarea);

  // 画像エリア
  let imgData = (meta.image && meta.image !== 'idb') ? meta.image : null;
  const imgZone = document.createElement('div');
  imgZone.className = 'route-memo-imgzone';
  imgZone.title = 'タップして画像を選択、またはCtrl+Vでペースト';

  const imgPreview = document.createElement('img');
  imgPreview.className = 'route-memo-imgpreview';
  if (imgData) { imgPreview.src = imgData; imgPreview.style.display = 'block'; }
  // 画像クリック → ライトボックス拡大（ファイル選択ダイアログは開かない）
  imgPreview.addEventListener('click', e => {
    e.stopPropagation();
    if (imgData) openLightbox(imgData);
  });

  const imgPlaceholder = document.createElement('div');
  imgPlaceholder.className = 'route-memo-imgplaceholder';
  imgPlaceholder.innerHTML = '📸 Ctrl+V でペースト<br>またはタップして画像を選択';
  imgPlaceholder.style.display = imgData ? 'none' : 'flex';

  // IndexedDBから画像を非同期読み込み
  if (meta.image === 'idb') {
    loadImage('route:' + plan.id + ':' + key).then(dataUrl => {
      if (dataUrl) {
        imgData = dataUrl;
        imgPreview.src = dataUrl;
        imgPreview.style.display = 'block';
        imgPlaceholder.style.display = 'none';
      }
    });
  }

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  imgZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      imgData = await compressImage(ev.target.result);
      imgPreview.src = imgData;
      imgPreview.style.display = 'block';
      imgPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // パネルが開いている間、Ctrl+V でどこからでも画像をペースト可能にする
  const pasteHandler = e => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = async ev => {
          imgData = await compressImage(ev.target.result);
          imgPreview.src = imgData;
          imgPreview.style.display = 'block';
          imgPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };
  document.addEventListener('paste', pasteHandler);

  imgZone.appendChild(imgPreview);
  imgZone.appendChild(imgPlaceholder);
  imgZone.appendChild(fileInput);
  panel.appendChild(imgZone);

  section.appendChild(panel);
  textarea.focus();
}

// ===== モーダル =====
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ===== ライトボックス =====
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').style.display = 'flex';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}

// ===== 既存画像の一括圧縮（IndexedDB移行前の古いdata:が残っている場合の保険） =====
// ※ migrateImagesToIndexedDB() が完了すれば data: は残らないため実質スキップされる
async function compressAllStoredImages() {
  let changed = false;
  for (const plan of plans) {
    if (!plan.routes) continue;
    for (const key of Object.keys(plan.routes)) {
      const route = plan.routes[key];
      if (route.image && route.image.startsWith('data:image/') && !route.image.startsWith('data:image/jpeg')) {
        route.image = await compressImage(route.image);
        changed = true;
      } else if (route.image && route.image.startsWith('data:image/jpeg')) {
        if (route.image.length > 150000) {
          route.image = await compressImage(route.image, 1000, 0.7);
          changed = true;
        }
      }
    }
    for (const day of plan.days || []) {
      for (const spot of day.spots || []) {
        if (spot.photo && spot.photo.startsWith('data:image/') && !spot.photo.startsWith('data:image/jpeg')) {
          spot.photo = await compressImage(spot.photo);
          changed = true;
        } else if (spot.photo && spot.photo.startsWith('data:image/jpeg') && spot.photo.length > 150000) {
          spot.photo = await compressImage(spot.photo, 1000, 0.7);
          changed = true;
        }
      }
    }
  }
  if (changed) savePlans();
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  loadPlans();
  renderHome();
  // バックグラウンドで既存画像をIndexedDBへ移行（初回のみ実行、以降はdata:がないためスキップ）
  migrateImagesToIndexedDB();

  // スポット写真：ドラッグ&ドロップ
  const photoZone = document.getElementById('spot-photo-zone');
  photoZone.addEventListener('dragover', e => { e.preventDefault(); photoZone.classList.add('drag-over'); });
  photoZone.addEventListener('dragleave', () => photoZone.classList.remove('drag-over'));
  photoZone.addEventListener('drop', e => {
    e.preventDefault();
    photoZone.classList.remove('drag-over');
    loadImageFile(e.dataTransfer.files[0]);
  });

  document.getElementById('btn-new-plan').addEventListener('click', showNewPlanModal);
  document.getElementById('btn-import-top').addEventListener('click', () => showView('view-import'));

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedCat = btn.dataset.cat;
      refreshCatBtns();
    });
  });

  // 背景タップで閉じる処理は削除（入力中に誤って閉じる問題を防ぐ）
  // 各モーダルの「キャンセル」「閉じる」ボタンで閉じる

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
