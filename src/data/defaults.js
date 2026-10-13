// The data bundled with the build. It is the starting point for the admin panel
// and the fallback if the saved data cannot be loaded.
import fms from './fms.json';
import { COMPANY, ROLES, APPLICATIONS, PRODUCT_FAMILIES } from './company.js';

export const DEFAULT_DATA = {
  fms,
  company: {
    ...COMPANY,
    logoUrl: '/logo.png',
    announcementEnabled: true,
    nextShow: 'EuroBLECH 2026, Hannover, 20-23 October',
    markets: 'Domestic and export',
    aboutParagraphs: [
      `${COMPANY.name} was founded in ${COMPANY.founded} to make better vibration damping for modern machinery. Today it supplies anti vibration mounts and pads to machine builders and plant owners, in India and abroad.`,
      'The range runs from rubber and cork pads under a single machine foot to spring isolators for heavy equipment and isolation tables for measuring instruments.',
    ],
  },
  roles: ROLES,
  applications: APPLICATIONS,
  productFamilies: PRODUCT_FAMILIES,
  site: {
    overviewTitle: 'FMS control centre',
    registryTitle: 'Every FMS, one searchable list',
    registrySubtitle: 'Open the working sheet or the SOP for any system in one click.',
    companyHeroTitle: 'Vibration control for industrial machinery',
    ctaTitle: 'Need the right pad for a machine?',
    ctaText: 'Send the machine type, weight and operating speed to get a recommendation.',
    productsDisclaimer:
      "Product details are summarised from the company's public listings. Check the current catalogue before quoting specifications.",
    footerNote: 'Maintained by the MIS team',
  },
};

// Fill any missing section from the defaults so older saved data keeps working
// when new fields are added later.
export function normalizeData(doc) {
  const d = doc || {};
  const out = {
    fms: Array.isArray(d.fms) ? d.fms : DEFAULT_DATA.fms,
    company: { ...DEFAULT_DATA.company, ...(d.company || {}) },
    roles: Array.isArray(d.roles) ? d.roles : DEFAULT_DATA.roles,
    applications: Array.isArray(d.applications) ? d.applications : DEFAULT_DATA.applications,
    productFamilies: Array.isArray(d.productFamilies) ? d.productFamilies : DEFAULT_DATA.productFamilies,
    site: { ...DEFAULT_DATA.site, ...(d.site || {}) },
    version: d.version ?? 0,
    updatedAt: d.updatedAt ?? null,
    updatedBy: d.updatedBy ?? null,
  };
  return structuredClone(out);
}
