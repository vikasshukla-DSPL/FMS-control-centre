import { route, send } from './_lib/http.js';
import { clearCookie } from './_lib/auth.js';

export default route(['POST'], async (req, res) => {
  send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
});
