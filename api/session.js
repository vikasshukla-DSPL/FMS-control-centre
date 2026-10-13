import { route, send } from './_lib/http.js';
import { requireSession } from './_lib/auth.js';
import { storeMode } from './_lib/store.js';

export default route(['GET'], async (req, res) => {
  const { user } = requireSession(req);
  send(res, 200, { user, storage: storeMode() });
});
