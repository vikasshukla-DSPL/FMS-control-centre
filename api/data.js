import { route, send, readBody, HttpError } from './_lib/http.js';
import { requireSession } from './_lib/auth.js';
import { getJson, setJson, storeMode, KEY_DATA } from './_lib/store.js';
import { validateData } from './_lib/validate.js';
import { describeChange, appendAudit } from './_lib/audit.js';

const MAX_BYTES = 600_000;

export default route(['GET', 'PUT'], async (req, res) => {
  if (req.method === 'GET') {
    // Public: the dashboard reads this. If nothing is saved yet (or storage is
    // not connected) the site falls back to the data bundled in the build.
    if (!storeMode()) return send(res, 200, { data: null, storage: null });
    const data = await getJson(KEY_DATA);
    const fresh = new URL(req.url, 'http://x').searchParams.has('fresh');
    const headers = fresh ? {} : { 'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30' };
    return send(res, 200, { data }, headers);
  }

  const { user } = requireSession(req);
  const { baseVersion, data } = await readBody(req);
  const clean = validateData(data);

  const current = await getJson(KEY_DATA);
  const currentVersion = current?.version ?? 0;
  if ((Number(baseVersion) || 0) !== currentVersion) {
    throw new HttpError(
      409,
      `${current?.updatedBy || 'Someone'} saved newer changes while you were editing. Reload to see them before saving.`
    );
  }

  const doc = { ...clean, version: currentVersion + 1, updatedAt: new Date().toISOString(), updatedBy: user };
  if (JSON.stringify(doc).length > MAX_BYTES) throw new HttpError(413, 'Data is too large to save.');

  await setJson(KEY_DATA, doc);
  try { await appendAudit(user, describeChange(current, doc)); } catch (e) { console.error('[audit]', e); }

  send(res, 200, { data: doc });
});
