// Server-side check of everything the admin panel saves. Anything unknown is
// dropped, text is trimmed and capped, and links must be http(s) so nobody can
// slip a javascript: link into the public registry.
import { HttpError } from './http.js';

const fail = (msg) => { throw new HttpError(400, msg); };

function text(v, label, { max = 300, required = false } = {}) {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (required && !s) fail(`${label} cannot be empty.`);
  if (s.length > max) fail(`${label} is too long (max ${max} characters).`);
  return s;
}

function url(v, label, { required = false, allowRelative = false } = {}) {
  const s = text(v, label, { max: 2000, required });
  if (!s) return null;
  if (allowRelative && s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
  } catch {
    fail(`${label} must be a full link starting with http:// or https://.`);
  }
  return s;
}

function id(v, label) {
  const s = text(v, `${label} id`, { max: 60, required: true });
  if (!/^[A-Za-z0-9_-]+$/.test(s)) fail(`${label} id has unsupported characters.`);
  return s;
}

function list(v, label, max) {
  if (!Array.isArray(v)) fail(`${label} must be a list.`);
  if (v.length > max) fail(`${label} has too many entries (max ${max}).`);
  return v;
}

export function validateData(d) {
  if (!d || typeof d !== 'object') fail('No data received.');

  const seen = new Set();
  const fms = list(d.fms, 'FMS list', 1000).map((r, i) => {
    const rid = id(r?.id, `FMS #${i + 1}`);
    if (seen.has(rid)) fail(`Duplicate FMS id "${rid}".`);
    seen.add(rid);
    const code = text(r.code, 'FMS code', { max: 20 });
    const title = text(r.title, `FMS #${i + 1} name`, { max: 200, required: true });
    let pin = null;
    if (r.pin !== null && r.pin !== undefined && r.pin !== '') {
      pin = Number(r.pin);
      if (!Number.isInteger(pin) || pin < 1 || pin > 99) fail(`Top position for "${title}" must be a whole number from 1 to 99.`);
    }
    return {
      id: rid,
      code: code || null,
      title,
      rawName: text(r.rawName, 'FMS raw name', { max: 260 }) || (code ? `${code}_${title}` : title),
      category: text(r.category, `"${title}" department`, { max: 80, required: true }),
      sop: url(r.sop, `SOP link for "${title}"`),
      fms: url(r.fms, `FMS link for "${title}"`),
      pin,
    };
  });

  const c = d.company || {};
  const founded = Number(c.founded);
  if (!Number.isInteger(founded) || founded < 1800 || founded > 2100) fail('Founded year must be a 4-digit year.');
  const company = {
    name: text(c.name, 'Company name', { required: true, max: 120 }),
    short: text(c.short, 'Short name', { required: true, max: 40 }),
    tagline: text(c.tagline, 'Tagline', { max: 200 }),
    summary: text(c.summary, 'Summary', { max: 600 }),
    founded,
    location: text(c.location, 'Location', { max: 120 }),
    website: url(c.website, 'Website', { required: true }),
    quoteUrl: url(c.quoteUrl, 'Request a quote link', { required: true }),
    logoUrl: url(c.logoUrl, 'Logo link', { allowRelative: true }) || '/logo.png',
    announcement: text(c.announcement, 'Announcement', { max: 240 }),
    announcementEnabled: !!c.announcementEnabled,
    nextShow: text(c.nextShow, 'Next show', { max: 160 }),
    markets: text(c.markets, 'Markets', { max: 120 }),
    aboutParagraphs: list(c.aboutParagraphs ?? [], 'About paragraphs', 10).map((p) => text(p, 'About paragraph', { max: 1500 })).filter(Boolean),
  };

  const roles = list(d.roles, 'Roles', 20).map((s) => text(s, 'Role', { max: 60 })).filter(Boolean);
  const applications = list(d.applications, 'Machines', 60).map((s) => text(s, 'Machine', { max: 80 })).filter(Boolean);

  const famIds = new Set();
  const productFamilies = list(d.productFamilies, 'Product families', 30).map((f, i) => {
    const fid = id(f?.id, `Product family #${i + 1}`);
    if (famIds.has(fid)) fail(`Duplicate product family id "${fid}".`);
    famIds.add(fid);
    const label = text(f.label, `Product family #${i + 1} name`, { required: true, max: 80 });
    return {
      id: fid,
      label,
      blurb: text(f.blurb, `${label} description`, { max: 800 }),
      items: list(f.items ?? [], `${label} products`, 100).map((p) => ({
        code: text(p?.code, `${label} product code`, { max: 40 }),
        name: text(p?.name, `${label} product name`, { required: true, max: 160 }),
        note: text(p?.note, `${label} product note`, { max: 500 }),
      })),
    };
  });

  const s = d.site || {};
  const site = {
    overviewTitle: text(s.overviewTitle, 'Dashboard heading', { max: 120 }),
    registryEyebrow: text(s.registryEyebrow, 'Registry brand line', { max: 80 }),
    registryHeadline: text(s.registryHeadline, 'Registry heading', { max: 80 }),
    registryTagline: text(s.registryTagline, 'Registry tagline', { max: 200 }),
    companyHeroTitle: text(s.companyHeroTitle, 'Company page heading', { max: 120 }),
    ctaTitle: text(s.ctaTitle, 'Quote box heading', { max: 120 }),
    ctaText: text(s.ctaText, 'Quote box text', { max: 300 }),
    productsDisclaimer: text(s.productsDisclaimer, 'Products note', { max: 400 }),
    footerNote: text(s.footerNote, 'Footer note', { max: 200 }),
  };

  return { fms, company, roles, applications, productFamilies, site };
}
