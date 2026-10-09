const COURSE = 'life-scale';
const ORIGIN = 'https://po0520-svg.github.io';

/** 首次在編輯器執行。重複執行沿用同一份私人試算表。 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  const book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('生命探索學習回應總表');
  props.setProperty('SPREADSHEET_ID', book.getId());
  const definitions = {
    '回應紀錄': ['收件時間','請求編號','場次','身分驗證摘要','班級','座號','姓名','事件','內容'],
    '學習總表': ['身分鍵','班級','座號','姓名','學習分數','理解檢查首次','救援首次','救援最高','挑戰首次','挑戰最高','更新時間','內部狀態']
  };
  Object.keys(definitions).forEach(name => {
    let sheet = book.getSheetByName(name);
    if (!sheet) sheet = book.insertSheet(name);
    if (!sheet.getLastRow()) { sheet.appendRow(definitions[name]); sheet.setFrozenRows(1); }
  });
  Logger.log(book.getUrl());
  return book.getUrl();
}

function digest(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value).map(x => ('0'+((x+256)%256).toString(16)).slice(-2)).join('');
}
function safe(value) { const text = String(value || ''); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function equalAnswer(key, value, type) {
  if (type === 'number') return Number(value) === Number(key);
  if (Array.isArray(key)) return Array.isArray(value) && key.length === value.length && (type === 'order' ? key.every((x,i) => x === value[i]) : [...key].sort().every((x,i) => x === [...value].sort()[i]));
  if (key && typeof key === 'object') return value && typeof value === 'object' && Object.keys(key).every(k => value[k] === key[k]);
  return key === value;
}
function correct(id, answer) { const q = ANSWER_KEYS[id]; return !!q && equalAnswer(q.answer, answer, q.type); }
function checkedPayload(raw) {
  if (!raw || raw.length > 50000) throw Error('回應資料大小不合規格');
  const p = JSON.parse(raw), uuid = /^[a-f0-9-]{36}$/i;
  if (p.courseId !== COURSE || !uuid.test(p.requestId) || !uuid.test(p.session) || !uuid.test(p.token)) throw Error('回應格式不合規格');
  if (!['start','attempt','formative','rescue','challenge','progress'].includes(p.kind)) throw Error('未知事件');
  const i = p.identity;
  if (!i || typeof i.name !== 'string' || !i.name.trim() || i.name.length > 40 || typeof i.class !== 'string' || !i.class.trim() || i.class.length > 30 || !/^\d{1,3}$/.test(String(i.seat))) throw Error('學生資料不完整');
  if (!p.detail || typeof p.detail !== 'object') throw Error('缺少作答內容');
  return p;
}
function collect(p) {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('SPREADSHEET_ID');
  if (!id) throw Error('教師尚未執行 setup');
  const book = SpreadsheetApp.openById(id), events = book.getSheetByName('回應紀錄'), totals = book.getSheetByName('學習總表');
  const rows = events.getLastRow() > 1 ? events.getRange(2,1,events.getLastRow()-1,9).getValues() : [];
  if (rows.some(r => r[1] === p.requestId)) return;
  const token = digest(p.token), session = rows.find(r => r[2] === p.session);
  if (session && (session[3] !== token || String(session[4]).replace(/^'/,'') !== p.identity.class || String(session[5]).replace(/^'/,'') !== String(p.identity.seat) || String(session[6]).replace(/^'/,'') !== p.identity.name)) throw Error('場次驗證失敗');
  const identityKey = digest([p.identity.class.trim(),String(p.identity.seat),p.identity.name.trim()].join('|'));
  const existing = totals.getLastRow() > 1 ? totals.getRange(2,1,totals.getLastRow()-1,12).getValues() : [];
  const found = existing.findIndex(r => r[0] === identityKey);
  const record = found < 0 ? {attempts:{},points:{},formative:null,rescueFirst:null,rescueBest:0,challengeFirst:null,challengeBest:0} : JSON.parse(existing[found][11]);
  const d = p.detail;
  record.processed = record.processed || [];
  const already = record.processed.includes(p.requestId);
  if (!already && p.kind === 'attempt') {
    const questionId = d.questionId;
    if (!/^L[23456]-[1-5]$/.test(questionId) || !ANSWER_KEYS[questionId]) throw Error('題號不存在');
    if (!record.points[questionId]) {
      record.attempts[questionId] = (record.attempts[questionId] || 0) + 1;
      if (correct(questionId,d.answer)) record.points[questionId] = Math.max(1,4-record.attempts[questionId]);
    }
  }
  if (!already && p.kind === 'formative') {
    if (!d.answers || !Array.from({length:10},(_,i)=>'F'+(i+1)).every(k => d.answers[k] !== undefined)) throw Error('理解檢查答案不完整');
    const score = Object.keys(d.answers).filter(k => /^F([1-9]|10)$/.test(k) && correct(k,d.answers[k])).length * 10;
    if (record.formative === null) record.formative = score;
  }
  if (!already && p.kind === 'rescue') {
    if (!Array.isArray(d.answers) || d.answers.length > 200) throw Error('救援答案不合規格');
    let score = 0;
    for (let i=1;i<=6;i++) { const a = d.answers.find(a => a.questionId === 'R'+i); if (!a) throw Error('救援尚未完成'); if (correct(a.questionId,a.answer)) score += 100; }
    if (record.rescueFirst === null) record.rescueFirst = score;
    record.rescueBest = Math.max(record.rescueBest,score);
  }
  if (!already && p.kind === 'challenge') {
    if (!Array.isArray(d.answers) || !d.answers.length || d.answers.length > 20) throw Error('挑戰答案不合規格');
    let score = 0, lives = 3; const seen = {};
    d.answers.forEach((a,i) => {
      if (!CHALLENGE_IDS.includes(a.questionId) || seen[a.questionId] || !Number.isFinite(a.durationMs) || a.durationMs < 0 || lives <= 0) throw Error('挑戰順序不合規格');
      seen[a.questionId] = true;
      const pos = Math.min(100,a.durationMs/20*(.35+i*.015));
      if (a.timeout || pos >= 100) lives--;
      else if (correct(a.questionId,a.answer)) score += Math.max(500,Math.floor(5000-pos*45));
      else { score = Math.max(0,score-1000); lives--; }
    });
    if (lives > 0 && d.answers.length !== 20) throw Error('挑戰尚未完成');
    if (record.challengeFirst === null) record.challengeFirst = score;
    record.challengeBest = Math.max(record.challengeBest,score);
  }
  if (!already) record.processed.push(p.requestId);
  const now = new Date(), i = p.identity;
  const summary = [identityKey,safe(i.class.trim()),safe(i.seat),safe(i.name.trim()),Object.values(record.points).reduce((a,b)=>a+b,0),record.formative ?? '',record.rescueFirst ?? '',record.rescueBest,record.challengeFirst ?? '',record.challengeBest,now,JSON.stringify(record)];
  // 先儲存總表，再記錄請求編號；重送會沿用已存在的首次結果與分數。
  totals.getRange(found < 0 ? totals.getLastRow()+1 : found+2,1,1,12).setValues([summary]);
  events.appendRow([now,p.requestId,p.session,token,safe(i.class),safe(i.seat),safe(i.name),p.kind,JSON.stringify(d)]);
  SpreadsheetApp.flush();
}
function doPost(e) {
  let requestId = '', result, lock = LockService.getScriptLock();
  try {
    const p = checkedPayload(e.parameter.payload); requestId = p.requestId;
    lock.waitLock(20000); collect(p); result = {type:'science-response',requestId,ok:true};
  } catch (error) { result = {type:'science-response',requestId,ok:false,error:String(error.message).slice(0,120)}; }
  finally { if (lock.hasLock()) lock.releaseLock(); }
  const json = JSON.stringify(result).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+json+','+JSON.stringify(ORIGIN)+');</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(e) {
  const action = e.parameter.action;
  let data = {ok:true,courseId:COURSE};
  if (action === 'leaderboard') {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) data = {entries:[]};
    else {
      const sheet = SpreadsheetApp.openById(id).getSheetByName('學習總表');
      const rows = sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,12).getValues() : [];
      data = {entries:rows.filter(r=>r[8] !== '').sort((a,b)=>b[9]-a[9]).slice(0,10).map(r=>({alias:'探索者 '+r[0].slice(0,6).toUpperCase(),score:Number(r[9])}))};
    }
  }
  const callback = e.parameter.callback;
  if (callback && /^scienceBoard_\d+$/.test(callback)) return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
