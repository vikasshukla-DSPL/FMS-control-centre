import { useState } from 'react';
import { MapPin, CalendarDays, Factory, Globe2, Wrench, ExternalLink } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import { useData } from '../context/DataContext.jsx';
import { safeUrl } from '../utils/url.js';
import './company.css';

export default function Company() {
  const { company, roles, applications, productFamilies, site } = useData();
  const [active, setActive] = useState(productFamilies[0]?.id);
  const family = productFamilies.find((f) => f.id === active) ?? productFamilies[0];
  const years = new Date().getFullYear() - company.founded;

  return (
    <>
      <Hero
        compact
        title={site.companyHeroTitle}
        subtitle={company.summary}
        primary={{ to: '/registry', label: 'Back to FMS registry' }}
      />

      <div className="container cp">
        <section className="cp-about">
          <div className="cp-story">
            <h2>About {company.short}</h2>
            {company.aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            <div className="cp-roles">
              {roles.map((r) => <span key={r}>{r}</span>)}
            </div>
          </div>
          <dl className="cp-facts">
            <div><Factory size={20} /><dt>Founded</dt><dd>{company.founded} ({years} years)</dd></div>
            <div><MapPin size={20} /><dt>Base</dt><dd>{company.location}</dd></div>
            {company.markets && <div><Globe2 size={20} /><dt>Markets</dt><dd>{company.markets}</dd></div>}
            {company.nextShow && <div><CalendarDays size={20} /><dt>Next show</dt><dd>{company.nextShow}</dd></div>}
          </dl>
        </section>

        {applications.length > 0 && (
        <section className="cp-apps">
          <h2>Machines we protect</h2>
          <ul>
            {applications.map((a) => (
              <li key={a}><Wrench size={16} />{a}</li>
            ))}
          </ul>
        </section>
        )}

        {family && (
        <section className="cp-products">
          <h2>Product families</h2>
          <div className="cp-tabs" role="tablist">
            {productFamilies.map((f) => (
              <button key={f.id} role="tab" aria-selected={active === f.id} className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)}>
                {f.label}
                <span>{f.items.length}</span>
              </button>
            ))}
          </div>
          <p className="cp-blurb">{family.blurb}</p>
          <div className="cp-grid">
            {family.items.map((p) => (
              <article key={p.code + p.name} className="cp-item">
                <b>{p.code}</b>
                <h3>{p.name}</h3>
                <p>{p.note}</p>
              </article>
            ))}
          </div>
          {site.productsDisclaimer && <p className="cp-foot">{site.productsDisclaimer}</p>}
        </section>
        )}

        <section className="cp-cta">
          <div>
            <h2>{site.ctaTitle}</h2>
            <p>{site.ctaText}</p>
          </div>
          <a className="btn btn-light" href={safeUrl(company.quoteUrl) || '#'} target="_blank" rel="noreferrer">
            Request a quote <ExternalLink size={16} />
          </a>
        </section>
      </div>
    </>
  );
}
