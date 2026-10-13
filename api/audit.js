import { route, send } from './_lib/http.js';
import { requireSession } from './_lib/auth.js';
import { readAudit } from './_lib/audit.js';

export default route(['GET'], async (req, res) => {
  requireSession(req);
  send(res, 200, { entries: await readAudit() });
});
