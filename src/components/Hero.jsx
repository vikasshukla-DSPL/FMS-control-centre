import { Link } from 'react-router-dom';

// A damped sine wave that settles into a flat line: the brand's "vibration under control" motif.
export function wavePath(width = 1600, height = 150) {
  const mid = height * 0.62;
  const settleX = width * 0.5;
  let d = `M0 ${mid}`;
  for (let x = 0; x <= settleX; x += 4) {
    const t = x / settleX;
    const amp = 52 * Math.pow(1 - t, 1.35);
    const freq = 6.2 * Math.PI * (0.55 + 0.45 * t);
    const y = mid - amp * Math.sin(t * freq);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  d += ` L${width} ${mid}`;
  return d;
}

export default function Hero({ title, subtitle, primary, secondary, compact = false }) {
  return (
    <section className={`hero ${compact ? 'hero-compact' : ''}`}>
      <div className="container hero-inner">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="hero-actions">
          {primary && (
            <Link className="btn btn-light" to={primary.to}>
              {primary.label}
            </Link>
          )}
          {secondary && (
            <Link className="btn btn-ghost" to={secondary.to}>
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
      <svg className="hero-wave" viewBox="0 0 1600 150" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath()} pathLength="1" />
      </svg>
    </section>
  );
}
