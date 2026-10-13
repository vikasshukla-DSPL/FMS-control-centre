// Login for the MIS team. Users live in the ADMIN_USERS environment variable,
// sessions are HMAC-signed tokens in an httpOnly cookie. No passwords are ever
// shipped to the browser.
import crypto from 'node:crypto';
import { HttpError } from './http.js';

const COOKIE = 'dm_admin';
export const SESSION_SECONDS = 12 * 60 * 60;

const isProd = () => !!process.env.VERCEL || process.env.NODE_ENV === 'production';

function parseUsers(raw) {
  return String(raw || '')
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(':');
      return i > 0 ? { name: pair.slice(0, i).trim(), password: pair.slice(i + 1) } : null;
    })
    .filter((u) => u && u.name && u.password);
}

let warned = false;
export function authConfig() {
  let users = parseUsers(process.env.ADMIN_USERS);
  let secret = process.env.ADMIN_SECRET;
  if (!isProd()) {
    // Local development only: convenient defaults so `npm run dev` just works.
    if (!users.length) users = [{ name: 'admin', password: 'admin123' }];
    if (!secret) secret = 'dev-only-secret-do-not-use-in-production';
    if (!warned && !process.env.ADMIN_USERS) {
      warned = true;
      console.warn('[admin] No ADMIN_USERS set. Using dev login admin / admin123 (local only).');
    }
  }
  if (!users.length || !secret || secret.length < 16) return null;
  return { users, secret };
}

const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

export function verifyLogin(username, password) {
  const cfg = authConfig();
  if (!cfg) throw new HttpError(503, 'Admin login is not set up yet. Set ADMIN_USERS and ADMIN_SECRET (see README, step 3).');
  let match = null;
  for (const u of cfg.users) {
    // Compare every user so timing does not reveal which usernames exist.
    const nameOk = safeEqual(u.name.toLowerCase(), String(username || '').trim().toLowerCase());
    const passOk = safeEqual(u.password, password || '');
    if (nameOk && passOk) match = u.name;
  }
  return match;
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

export function createToken(user) {
  const { secret } = authConfig();
  const payload = b64(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  return `${payload}.${sign(payload, secret)}`;
}

function readCookie(req, name) {
  const header = String(req.headers.cookie || '');
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function getSession(req) {
  const cfg = authConfig();
  if (!cfg) return null;
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload, cfg.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.u || data.exp < Math.floor(Date.now() / 1000)) return null;
    // A user removed from ADMIN_USERS loses access immediately.
    if (!cfg.users.some((u) => u.name === data.u)) return null;
    return { user: data.u };
  } catch {
    return null;
  }
}

export function requireSession(req) {
  if (!authConfig()) throw new HttpError(503, 'Admin login is not set up yet. Set ADMIN_USERS and ADMIN_SECRET (see README, step 3).');
  const s = getSession(req);
  if (!s) throw new HttpError(401, 'Your session has ended. Sign in again.');
  return s;
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${isProd() ? '; Secure' : ''}`;
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isProd() ? '; Secure' : ''}`;
}
