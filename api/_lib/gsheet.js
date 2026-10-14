// Talks to the 033 Material Tracking FMS Google Sheet through the Google Sheets API
// (service account). No Apps Script, so no Apps Script run-time quota.
import crypto from 'node:crypto';
import { HttpError } from './http.js';

const TZ = process.env.FMS033_TZ || 'Asia/Kolkata';
const USERS_TAB = 'DOER_USERS';
const LOG_TAB = 'DASHBOARD_LOG';
export const CONFIG = {
  HEADER_ROW: 6,          // auto-detected if the sheet changes
  STEP_NAME_ROW: 2,
  REQUIRE_PLANNED: true,  // pending only when Planned is filled
  STEP_NAME_OVERRIDE: { 4: 'PO Approval (YB Sir)' },
  STATUS_OPTIONS_OVERRIDE: {}, // e.g. { 6: ['PASS', 'FAILED'] }
  CONTEXT: [['SO / IO', /so\/io|job work/], ['Item', /^item name/], ['Qty', /^quantity/], ['Supplier', /^supplier name/], ['PO No.', /^po no/], ['MRN', /^mrn number/]],
};

const env = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const id = process.env.FMS033_SHEET_ID;
  if (!email || !key || !id) throw new HttpError(503, 'Dashboard is not connected to the sheet yet. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and FMS033_SHEET_ID.');
  return { email, key, id };
};

export const clean = (v) => String(v ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
const lc = (v) => clean(v).toLowerCase();

/* ---- Google auth (service account JWT, no extra packages) ---- */
let tok = { v: null, exp: 0 };
async function token() {
  if (tok.v && Date.now() < tok.exp - 60_000) return tok.v;
  const { email, key } = env();
  const now = Math.floor(Date.now() / 1000);
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b({ alg: 'RS256', typ: 'JWT' })}.${b({ iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new HttpError(503, 'Google sign-in failed. Check the service account key.');
  tok = { v: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return tok.v;
}

async function g(path, opts = {}) {
  const { id } = env();
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 403) throw new HttpError(503, 'The sheet is not shared with the service account email (give it Editor access).');
    if (r.status === 429) throw new HttpError(429, 'Google is busy. Try again in a few seconds.');
    throw new HttpError(502, j.error?.message || 'Google Sheets error.');
  }
  return j;
}

const colName = (i) => { let s = ''; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };
const q = (t) => `'${t.replace(/'/g, "''")}'`;
const enc = encodeURIComponent;

/* ---- tabs ---- */
let meta = { t: 0, v: null };
async function sheetsMeta() {
  if (meta.v && Date.now() - meta.t < 300_000) return meta.v;
  const j = await g('?fields=sheets.properties(sheetId,title)');
  meta = { t: Date.now(), v: j.sheets.map((s) => s.properties) };
  return meta.v;
}
export async function mainTitle() {
  const gid = Number(process.env.FMS033_GID || 0);
  const s = (await sheetsMeta()).find((x) => x.sheetId === gid);
  if (!s) throw new HttpError(503, 'FMS tab not found. Check FMS033_GID.');
  return s.title;
}
async function ensureTab(title, headers, seed) {
  const tabs = await sheetsMeta();
  if (tabs.some((t) => t.title === title)) return false;
  await g(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }) });
  meta.t = 0;
  await g(`/values/${enc(`${q(title)}!A1`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [headers, ...(seed || [])] }) });
  return true;
}

/* ---- layout: find every Doer | Planned | Actual | Status block ---- */
let lay = { t: 0, v: null };
export async function layout() {
  if (lay.v && Date.now() - lay.t < 300_000) return lay.v;
  const title = await mainTitle();
  const top = (await g(`/values/${enc(`${q(title)}!A1:CZ15`)}?valueRenderOption=FORMATTED_VALUE`)).values || [];
  let hr = CONFIG.HEADER_ROW;
  top.forEach((row, i) => { if (hr === CONFIG.HEADER_ROW && row.filter((c) => lc(c) === 'doer').length >= 3) hr = i + 1; });
  const head = (top[hr - 1] || []).map(lc);
  const names = (top[CONFIG.STEP_NAME_ROW - 1] || []).map(clean);
  const blocks = []; const used = {};
  head.forEach((h, c) => {
    if (h !== 'doer') return;
    let planned = -1, actual = -1, status = -1;
    for (let k = c + 1; k < head.length && head[k] !== 'doer'; k++) {
      if (planned < 0 && head[k] === 'planned') planned = k;
      else if (actual < 0 && head[k] === 'actual') actual = k;
      else if (planned >= 0 && status < 0 && /status|yes\s*\/\s*no/.test(head[k])) status = k;
      if (head[k] === 'time delay') break;
    }
    if (planned < 0 || actual < 0 || status < 0) return;
    const no = blocks.length + 1;
    let name = '';
    for (let k = c; k >= 0 && !name; k--) if (names[k] && Number.isNaN(Number(names[k])) && !/^material requisition/i.test(names[k])) name = names[k];
    name = CONFIG.STEP_NAME_OVERRIDE[no] || name.replace(/\s*@.*$/, '') || `Step ${no}`;
    if (used[name]) name += ` (${no})`;
    used[name] = true;
    blocks.push({ no, name, doer: c, planned, actual, status });
  });
  const ctx = [];
  CONFIG.CONTEXT.forEach(([label, re]) => { const i = head.findIndex((h) => re.test(h)); if (i >= 0) ctx.push({ label, col: i }); });
  const dataRow = hr + 1;
  // allowed status values come from each column's dropdown
  const vr = blocks.map((b) => `ranges=${enc(`${q(title)}!${colName(b.status)}${dataRow}`)}`).join('&');
  const dv = vr ? await g(`?${vr}&fields=sheets.data.rowData.values.dataValidation`) : { sheets: [] };
  const sheet = (dv.sheets || [])[0]?.data || [];
  blocks.forEach((b, i) => {
    const cond = sheet[i]?.rowData?.[0]?.values?.[0]?.dataValidation?.condition;
    let list = cond?.type === 'ONE_OF_LIST' ? cond.values.map((x) => clean(x.userEnteredValue)).filter(Boolean) : [];
    if (CONFIG.STATUS_OPTIONS_OVERRIDE[b.no]) list = CONFIG.STATUS_OPTIONS_OVERRIDE[b.no];
    b.options = list.length ? list : /yes\s*\/\s*no/.test(head[b.status]) ? ['Yes', 'No'] : ['Done'];
  });
  lay = { t: Date.now(), v: { title, headerRow: hr, dataRow, blocks, ctx, lastCol: head.length } };
  return lay.v;
}

/* ---- helpers ---- */
export function parseTs(s) {
  const m = clean(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  const p = (n) => String(n).padStart(2, '0');
  const off = TZ === 'Asia/Kolkata' ? '+05:30' : 'Z';
  return Date.parse(`${m[3]}-${p(m[2])}-${p(m[1])}T${p(m[4] || 0)}:${m[5] || '00'}:${m[6] || '00'}${off}`);
}
export const doerMatch = (cell, name) => clean(cell).split(/[,/&]|\band\b/i).some((p) => lc(p) === lc(name));
export function nowStamp() {
  return new Date().toLocaleString('en-GB', { timeZone: TZ, hour12: false }).replace(',', '');
}

/* ---- users ---- */
export async function readUsers() {
  const created = await ensureTab(USERS_TAB, ['Doer Name (same as sheet)', 'Email (optional)', 'PIN', 'Role (doer/admin)']);
  if (created) {
    const L = await layout();
    const rows = (await g(`/values/${enc(`${q(L.title)}!A${L.dataRow}:CZ`)}`)).values || [];
    const seen = new Set();
    L.blocks.forEach((b) => rows.forEach((r) => clean(r[b.doer]).split(/[,/&]/).map(clean).filter(Boolean).forEach((n) => seen.add(n))));
    const seed = [...seen].map((n) => [n, '', String(crypto.randomInt(1000, 10000)), 'doer']);
    await g(`/values/${enc(`${q(USERS_TAB)}!A2`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: seed }) });
  }
  const v = (await g(`/values/${enc(`${q(USERS_TAB)}!A2:D`)}`)).values || [];
  return v.filter((r) => clean(r[0])).map((r) => ({ name: clean(r[0]), pin: clean(r[2]), role: lc(r[3]) === 'admin' ? 'admin' : 'doer' }));
}

/* ---- pendency ---- */
let cache = { t: 0, rows: null };
async function rows(L) {
  if (cache.rows && Date.now() - cache.t < 15_000) return cache.rows;
  const r = (await g(`/values/${enc(`${q(L.title)}!A${L.dataRow}:${colName(L.lastCol)}`)}?valueRenderOption=FORMATTED_VALUE`)).values || [];
  cache = { t: Date.now(), rows: r };
  return r;
}

export async function pending(target) {
  const L = await layout();
  const data = await rows(L);
  const now = Date.now(); const tasks = [];
  data.forEach((row, i) => L.blocks.forEach((b) => {
    const doer = clean(row[b.doer]);
    if (!doer || (target !== '*' && !doerMatch(doer, target))) return;
    if (clean(row[b.status]) || clean(row[b.actual])) return;
    if (CONFIG.REQUIRE_PLANNED && !clean(row[b.planned])) return;
    const pts = parseTs(row[b.planned]);
    tasks.push({
      row: L.dataRow + i, block: b.no, step: b.name, doer, planned: clean(row[b.planned]), plannedTs: pts,
      late: pts ? Math.max(0, Math.round((now - pts) / 60000)) : 0, options: b.options,
      ctx: L.ctx.map((c) => ({ l: c.label, v: clean(row[c.col]) })).filter((c) => c.v),
    });
  }));
  tasks.sort((a, b) => (b.late > 0) - (a.late > 0) || (a.plannedTs || 9e15) - (b.plannedTs || 9e15));
  return tasks;
}

/* ---- mark done: writes Status + system-time Actual ---- */
export async function markDone(user, row, blockNo, value) {
  const L = await layout();
  const b = L.blocks.find((x) => x.no === blockNo);
  if (!b || !Number.isInteger(row) || row < L.dataRow) throw new HttpError(404, 'Task not found.');
  if (!b.options.includes(value)) throw new HttpError(400, 'Invalid status.');
  const cell = (c) => `${q(L.title)}!${colName(c)}${row}`;
  const get = async (c, render) => (await g(`/values/${enc(cell(c))}?valueRenderOption=${render}`)).values?.[0]?.[0];
  const doer = await get(b.doer, 'FORMATTED_VALUE');   // fresh read: never trust the browser
  if (user.role !== 'admin' && !doerMatch(doer, user.name)) throw new HttpError(403, 'This step is not assigned to you.');
  if (clean(await get(b.status, 'FORMATTED_VALUE'))) throw new HttpError(409, 'Already updated by someone else. Refresh the list.');
  if (CONFIG.REQUIRE_PLANNED && !clean(await get(b.planned, 'FORMATTED_VALUE'))) throw new HttpError(409, 'This step is not planned yet.');
  const actualRaw = await get(b.actual, 'FORMULA');
  const stamp = nowStamp();
  const data = [{ range: cell(b.status), values: [[value]] }];
  if (!clean(actualRaw)) data.push({ range: cell(b.actual), values: [[stamp]] }); // skipped when Actual has a formula
  await g('/values:batchUpdate', { method: 'POST', body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }) });
  cache = { t: 0, rows: null };
  try {
    await ensureTab(LOG_TAB, ['Time', 'User', 'Row', 'Step', 'Status']);
    await g(`/values/${enc(`${q(LOG_TAB)}!A1`)}:append?valueInputOption=USER_ENTERED`, { method: 'POST', body: JSON.stringify({ values: [[stamp, user.name, row, b.name, value]] }) });
  } catch { /* logging must never block the doer */ }
  return stamp;
}
