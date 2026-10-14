// Doer dashboard API for the 033 Material Tracking FMS. One route, POST {action}.
import crypto from 'node:crypto';
import { route, send, readBody, clientIp, HttpError } from './_lib/http.js';
import { authConfig } from './_lib/auth.js';
import { getJson, setJson } from './_lib/store.js';
import { readUsers, pending, markDone } from './_lib/gsheet.js';

const COOKIE = 'dm_doer';
const MAX_AGE = 12 * 60 * 60;
const prod = () => !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const secret = () => {
  const c = authConfig();
  if (!c) throw new HttpError(503, 'ADMIN_SECRET is not set (see README).');
  return c.secret;
};
const sign = (d) => crypto.createHmac('sha256', secret()).update(d).digest('base64url');
const cookie = (v, age) => `${COOKIE}=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${prod() ? '; Secure' : ''}`;

function session(req) {
  const m = String(req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
  const [p, s] = (m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : '').split('.');
  if (!p || !s || s !== sign(p)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    return d.exp > Date.now() / 1000 ? d : null;
  } catch { return null; }
}

async function who(req) {
  const s = session(req);
  if (!s) throw new HttpError(401, 'Please log in again.');
  const u = (await readUsers()).find((x) => x.name === s.n);
  if (!u) throw new HttpError(401, 'Please log in again.');
  return u;
}

export default route(['POST'], async (req, res) => {
  const b = await readBody(req);

  if (b.action === 'names') return send(res, 200, { names: (await readUsers()).map((u) => u.name) });

  if (b.action === 'login') {
    const key = `dynemech:doerfails:${clientIp(req)}`;
    const fails = (await getJson(key).catch(() => 0)) || 0;
    if (fails >= 8) throw new HttpError(429, 'Too many wrong PINs. Wait 15 minutes.');
    const u = (await readUsers()).find((x) => x.name.toLowerCase() === String(b.name || '').trim().toLowerCase());
    const ok = u && u.pin && crypto.timingSafeEqual(crypto.createHash('sha256').update(u.pin).digest(), crypto.createHash('sha256').update(String(b.pin || '')).digest());
    if (!ok) {
      await setJson(key, fails + 1, { ex: 900 }).catch(() => {});
      throw new HttpError(401, 'Wrong PIN. Try again.');
    }
    await setJson(key, 0, { ex: 900 }).catch(() => {});
    const p = Buffer.from(JSON.stringify({ n: u.name, exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
    return send(res, 200, { user: { name: u.name, role: u.role } }, { 'Set-Cookie': cookie(`${p}.${sign(p)}`, MAX_AGE) });
  }

  if (b.action === 'logout') return send(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) });

  const u = await who(req);
  if (b.action === 'me') {
    const names = u.role === 'admin' ? (await readUsers()).map((x) => x.name) : [];
    return send(res, 200, { user: { name: u.name, role: u.role }, names });
  }
  if (b.action === 'pending') {
    const target = u.role === 'admin' && b.viewAs ? String(b.viewAs) : u.name;
    return send(res, 200, { tasks: await pending(target) });
  }
  if (b.action === 'done') {
    const actual = await markDone(u, Number(b.row), Number(b.block), String(b.value));
    return send(res, 200, { ok: true, actual });
  }
  throw new HttpError(400, 'Unknown action.');
});
