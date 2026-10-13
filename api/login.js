import { route, send, readBody, clientIp, HttpError } from './_lib/http.js';
import { verifyLogin, createToken, sessionCookie } from './_lib/auth.js';
import { getJson, setJson, storeMode } from './_lib/store.js';

const MAX_FAILS = 8;
const WINDOW_SECONDS = 15 * 60;

async function failCount(key) {
  try { return (await getJson(key)) || 0; } catch { return 0; }
}
async function setFails(key, n) {
  try { await setJson(key, n, { ex: WINDOW_SECONDS }); } catch { /* rate limiting is best effort */ }
}

export default route(['POST'], async (req, res) => {
  const { username, password } = await readBody(req);
  const key = `dynemech:fails:${clientIp(req)}`;

  if ((await failCount(key)) >= MAX_FAILS) {
    throw new HttpError(429, 'Too many failed attempts. Wait 15 minutes and try again.');
  }

  const user = verifyLogin(username, password);
  if (!user) {
    await setFails(key, (await failCount(key)) + 1);
    await new Promise((r) => setTimeout(r, 400));
    throw new HttpError(401, 'Wrong username or password.');
  }

  await setFails(key, 0);
  send(res, 200, { user, storage: storeMode() }, { 'Set-Cookie': sessionCookie(createToken(user)) });
});
