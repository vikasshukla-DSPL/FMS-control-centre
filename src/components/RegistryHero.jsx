import { wavePath } from './Hero.jsx';

// Slim brand banner for the FMS registry: who we are, what we do, and the key
// numbers, so the search box and list start right below it.
export default function RegistryHero({ eyebrow, headline, tagline, stats }) {
  return (
    <section className="rh">
      <div className="container rh-inner">
        <div className="rh-copy">
          {eyebrow && <p className="rh-eyebrow">{eyebrow}</p>}
          <h1>{headline}</h1>
          {tagline && <p className="rh-tagline">{tagline}</p>}
        </div>
        <dl className="rh-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <svg className="rh-wave" viewBox="0 0 1600 44" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(1600, 44, 17, 0.55)} pathLength="1" />
      </svg>
    </section>
  );
}
