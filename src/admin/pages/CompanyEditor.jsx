import { Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminData.jsx';
import { Field, PageHead, Switch, LinesField } from '../ui.jsx';
import { isHttpUrl } from '../../utils/url.js';

export default function CompanyEditor() {
  const { draft, update } = useAdminData();
  const c = draft.company;
  const set = (k) => (e) => update((d) => { d.company[k] = e.target.value; });
  const setNum = (k) => (e) => update((d) => { d.company[k] = e.target.value === '' ? '' : Number(e.target.value); });
  const urlErr = (v, required) => ((required && !v) || (v && !isHttpUrl(v)) ? 'Use a full link starting with https://' : null);

  return (
    <>
      <PageHead title="Company" intro="Details shown in the header, the company page and the quote button." />

      <section className="ad-card">
        <h2>Announcement strip</h2>
        <p className="ad-muted">The purple bar at the very top of every page.</p>
        <Switch checked={c.announcementEnabled} onChange={(v) => update((d) => { d.company.announcementEnabled = v; })} label="Show the announcement strip" />
        <Field label="Announcement text" wide>
          <input value={c.announcement} onChange={set('announcement')} maxLength={240} disabled={!c.announcementEnabled} />
        </Field>
      </section>

      <section className="ad-card">
        <h2>Basics</h2>
        <div className="ad-form two">
          <Field label="Company name"><input value={c.name} onChange={set('name')} maxLength={120} /></Field>
          <Field label="Short name" hint="Used in headings, like About Dynemech."><input value={c.short} onChange={set('short')} maxLength={40} /></Field>
          <Field label="Location"><input value={c.location} onChange={set('location')} maxLength={120} /></Field>
          <Field label="Founded (year)"><input type="number" value={c.founded} onChange={setNum('founded')} min={1800} max={2100} /></Field>
          <Field label="Markets" hint="Shown on the company page. Leave empty to hide."><input value={c.markets} onChange={set('markets')} maxLength={120} /></Field>
          <Field label="Next trade show" hint="Shown on the company page. Leave empty to hide."><input value={c.nextShow} onChange={set('nextShow')} maxLength={160} /></Field>
          <Field label="Tagline" wide><input value={c.tagline} onChange={set('tagline')} maxLength={200} /></Field>
          <Field label="Summary" wide hint="The line under the heading on the company page."><textarea rows={3} value={c.summary} onChange={set('summary')} maxLength={600} /></Field>
        </div>
      </section>

      <section className="ad-card">
        <h2>Links</h2>
        <div className="ad-form two">
          <Field label="Website" error={urlErr(c.website, true)}><input value={c.website} onChange={set('website')} /></Field>
          <Field label="Request a quote link" error={urlErr(c.quoteUrl, true)} hint="Where the Request a quote buttons go. A contact page or form works best."><input value={c.quoteUrl} onChange={set('quoteUrl')} /></Field>
          <Field label="Logo link" hint="Leave as /logo.png to use the logo bundled with the site, or paste a full image link."><input value={c.logoUrl} onChange={set('logoUrl')} /></Field>
        </div>
      </section>

      <section className="ad-card">
        <h2>About text</h2>
        <p className="ad-muted">Each box becomes one paragraph on the company page.</p>
        <div className="ad-stack">
          {c.aboutParagraphs.map((p, i) => (
            <div className="ad-para" key={i}>
              <textarea rows={3} value={p} aria-label={`Paragraph ${i + 1}`} maxLength={1500}
                onChange={(e) => update((d) => { d.company.aboutParagraphs[i] = e.target.value; })} />
              <button className="icon-btn danger" aria-label={`Remove paragraph ${i + 1}`}
                onClick={() => update((d) => { d.company.aboutParagraphs.splice(i, 1); })}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => update((d) => { d.company.aboutParagraphs.push(''); })}><Plus size={14} /> Add paragraph</button>
      </section>

      <div className="ad-grid2">
        <section className="ad-card">
          <h2>Company roles</h2>
          <p className="ad-muted">The small tags under the about text. One per line.</p>
          <LinesField value={draft.roles} onChange={(v) => update((d) => { d.roles = v; })} rows={5} />
        </section>
        <section className="ad-card">
          <h2>Machines we protect</h2>
          <p className="ad-muted">One machine type per line.</p>
          <LinesField value={draft.applications} onChange={(v) => update((d) => { d.applications = v; })} rows={9} />
        </section>
      </div>
    </>
  );
}
