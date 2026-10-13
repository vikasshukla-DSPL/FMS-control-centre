// Edit this file to update company details shown across the dashboard.
export const COMPANY = {
  name: 'Dynemech Systems Pvt Ltd',
  short: 'Dynemech',
  tagline: 'Anti vibration pads and vibration control solutions',
  summary:
    'Manufacturer and exporter of vibration control technology for industrial machinery, since 2000.',
  founded: 2000,
  location: 'Sonipat, Haryana, India',
  // TODO: confirm these two before going live
  website: 'https://www.dynemech.com',
  quoteUrl: 'https://www.dynemech.com',
  announcement: 'Visit Dynemech at EuroBLECH 2026, Hannover, Germany, 20-23 October',
};

export const ROLES = ['Manufacturer', 'Exporter', 'OEM supplier'];

export const APPLICATIONS = [
  'CNC machines',
  'Power presses',
  'Lathe machines',
  'Textile machines',
  'Generators',
  'Compressors',
  'Tool room machines',
  'Forging hammers',
];

export const PRODUCT_FAMILIES = [
  {
    id: 'pads',
    label: 'Pads and plates',
    blurb:
      'Insulation plates and rubber pads that sit under machine feet. Different compound mixes give different natural frequencies, so one range covers light tool-room machines up to long-bed machining centres.',
    items: [
      { code: 'DH', name: 'Anti vibration bearing pads', note: 'Nitrile rubber, cork and synthetic fibre compound. For heavy, long-bed machines, machining centres and planers.' },
      { code: 'DHS5', name: 'Green anti vibration pads', note: 'Same compound family. Rated -20 to +70 degrees C. Available in green, grey and black.' },
      { code: 'DHS4', name: 'Machinery mounts and pads', note: 'General machinery mounting pad.' },
      { code: 'DI', name: 'AV rubber pads', note: 'High grade synthetic composite insulation plate.' },
      { code: 'DS2', name: 'Vibration damping pad', note: 'High grade synthetic composite insulation plate.' },
      { code: 'DA2', name: 'Green machinery pads', note: 'High grade synthetic composite insulation sheet for lighter loads.' },
      { code: 'DU / DU-10', name: 'Insulation plate and isolation sheet', note: 'Sheet form for foundation and under-machine insulation.' },
    ],
  },
  {
    id: 'mounts',
    label: 'Machine mounts',
    blurb:
      'Levelling and foundation mounts for machines that need height adjustment as well as isolation.',
    items: [
      { code: 'DL9-U', name: 'Industrial equipment vibration mounts', note: 'Heavy industrial equipment mounting.' },
      { code: 'DLKR-04', name: 'Vibration damping support, square base', note: 'Square-base support mount.' },
      { code: 'DLT1-U', name: 'Machine foundation anti-vibration mounts', note: 'Foundation-level isolation.' },
      { code: 'More', name: 'Screw support, wedge, cup and levelling mounts', note: 'Part of the wider mount range listed by the company.' },
    ],
  },
  {
    id: 'springs',
    label: 'Spring isolators',
    blurb:
      'Steel spring isolation for heavier or lower-frequency equipment, with integrated snubbers on selected series.',
    items: [
      { code: 'RDD', name: 'Spring isolators with integrated snubber', note: 'Vibration control spring system.' },
      { code: 'RFD-RT-SP2', name: 'Spring isolators with integrated snubber', note: 'Vibration control spring system.' },
      { code: 'MAI', name: 'Industrial-grade spring isolation', note: 'Spring vibration isolation system.' },
      { code: 'MCI', name: 'Spring isolation systems', note: 'Spring vibration isolation system.' },
    ],
  },
  {
    id: 'tables',
    label: 'Anti vibration tables',
    blurb:
      'Tables for laboratory and metrology equipment, where floor vibration would otherwise affect measurement results.',
    items: [
      { code: 'AVT', name: 'Mild steel laboratory tables', note: 'Laboratory anti vibration tables, P-83 and P-85 series.' },
      { code: 'P-91', name: 'Granite table, Avant series', note: 'Laboratory anti vibration granite table.' },
      { code: 'P-92', name: 'Passive air cushion table', note: 'For precision measuring and metrology instruments.' },
      { code: 'P-82 / P-89', name: 'Instrument-specific tables', note: 'Built for specific measuring instruments, for example contour and form checkers.' },
    ],
  },
];
