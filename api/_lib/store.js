// Storage for the dashboard data. Three modes:
//   redis : Upstash Redis over its REST API (production on Vercel)
//   file  : .data/store.json (local development only)
//   null  : nothing configured, so saving is disabled
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './http.js';

export const KEY_DATA = 'dynemech:data';
export const KEY_AUDIT = 'dynemech:audit';

const isProd = () => !!process.env.VERCEL || process.env.NODE_ENV === 'production';

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function storeMode() {
  if (redisConfig()) return 'redis';
  if (!isProd()) return 'file';
  return null;
}

const NOT_CONFIGURED =
  'Saving is not set up yet. Connect an Upstash Redis database to this Vercel project (see README, step 2) and redeploy.';

async function redis(command) {
  const cfg = redisConfig();
  const r = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.error) throw new Error(body.error || `Redis request failed (${r.status})`);
  return body.result;
}

const filePath = () => path.join(process.cwd(), '.data', 'store.json');

async function readFileStore() {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf8'));
  } catch {
    return {};
  }
}

export async function getJson(key) {
  const mode = storeMode();
  if (!mode) throw new HttpError(503, NOT_CONFIGURED);
  if (mode === 'redis') {
    const raw = await redis(['GET', key]);
    return raw ? JSON.parse(raw) : null;
  }
  const all = await readFileStore();
  const entry = all[key];
  if (!entry) return null;
  if (entry.exp && entry.exp < Date.now()) return null;
  return entry.value;
}

export async function setJson(key, value, { ex } = {}) {
  const mode = storeMode();
  if (!mode) throw new HttpError(503, NOT_CONFIGURED);
  if (mode === 'redis') {
    const cmd = ['SET', key, JSON.stringify(value)];
    if (ex) cmd.push('EX', String(ex));
    await redis(cmd);
    return;
  }
  const all = await readFileStore();
  all[key] = { value, exp: ex ? Date.now() + ex * 1000 : null };
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(all, null, 2));
}
