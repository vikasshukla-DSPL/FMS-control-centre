import { useAdminData } from '../AdminData.jsx';
import { Field, PageHead } from '../ui.jsx';

const GROUPS = [
  {
    title: 'Dashboard page',
    fields: [['overviewTitle', 'Main heading', 'The big heading on the first page. The line under it counts FMS automatically.']],
  },
  {
    title: 'FMS registry page',
    fields: [
      ['registryTitle', 'Heading'],
      ['registrySubtitle', 'Line under the heading'],
    ],
  },
  {
    title: 'Company page',
    fields: [
      ['companyHeroTitle', 'Heading'],
      ['ctaTitle', 'Quote box heading'],
      ['ctaText', 'Quote box text', null, true],
      ['productsDisclaimer', 'Note under the product cards', 'Leave empty to hide.', true],
    ],
  },
  {
    title: 'Footer',
    fields: [['footerNote', 'Footer note']],
  },
];

export default function PageText() {
  const { draft, update } = useAdminData();
  return (
    <>
      <PageHead title="Page text" intro="Headings and short messages on the public pages." />
      {GROUPS.map((g) => (
        <section className="ad-card" key={g.title}>
          <h2>{g.title}</h2>
          <div className="ad-form">
            {g.fields.map(([key, label, hint, multi]) => (
              <Field key={key} label={label} hint={hint}>
                {multi ? (
                  <textarea rows={2} value={draft.site[key]} maxLength={400} onChange={(e) => update((d) => { d.site[key] = e.target.value; })} />
                ) : (
                  <input value={draft.site[key]} maxLength={240} onChange={(e) => update((d) => { d.site[key] = e.target.value; })} />
                )}
              </Field>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
