import { getJson, setJson, KEY_AUDIT } from './store.js';

const MAX_ENTRIES = 200;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function diffById(a = [], b = []) {
  const am = new Map(a.map((x) => [x.id, x]));
  const bm = new Map(b.map((x) => [x.id, x]));
  return {
    added: b.filter((x) => !am.has(x.id)),
    removed: a.filter((x) => !bm.has(x.id)),
    changed: b.filter((x) => am.has(x.id) && !same(am.get(x.id), x)),
  };
}

export function describeChange(before, after) {
  if (!before) return 'First save from the admin panel';
  const parts = [];

  const f = diffById(before.fms, after.fms);
  const fmsBits = [];
  if (f.added.length) fmsBits.push(`${f.added.length} added`);
  if (f.changed.length) fmsBits.push(`${f.changed.length} edited`);
  if (f.removed.length) fmsBits.push(`${f.removed.length} removed`);
  if (fmsBits.length) parts.push(`FMS registry: ${fmsBits.join(', ')}`);

  if (!same(before.company, after.company)) parts.push('company details');
  if (!same(before.roles, after.roles) || !same(before.applications, after.applications)) parts.push('roles and machines');

  const p = diffById(before.productFamilies, after.productFamilies);
  if (p.added.length || p.removed.length || p.changed.length) parts.push('products');
  if (!same(before.site, after.site)) parts.push('page text');

  return parts.length ? `Updated ${parts.join('; ')}` : 'Saved with no changes';
}

export async function appendAudit(user, summary) {
  const log = (await getJson(KEY_AUDIT)) || [];
  log.unshift({ at: new Date().toISOString(), user, summary });
  await setJson(KEY_AUDIT, log.slice(0, MAX_ENTRIES));
}

export async function readAudit() {
  return (await getJson(KEY_AUDIT)) || [];
}
