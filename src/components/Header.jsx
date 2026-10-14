import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { MoreVertical, X } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { safeUrl } from '../utils/url.js';

const links = [
  { to: '/', label: 'FMS registry', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/company', label: 'Company and products' },
];

export default function Header() {
  const { company } = useData();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const ref = useRef(null);
  const siteHref = safeUrl(company.website) || '#';

  // Phone menu: close after choosing a tab, on Escape, or when tapping elsewhere.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="site-header" ref={ref}>
      {company.announcementEnabled && company.announcement && <div className="announce">{company.announcement}</div>}
      <div className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" aria-label="Dynemech home">
            <img src={company.logoUrl || '/logo.png'} alt={company.name} />
          </Link>

          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>{l.label}</NavLink>
            ))}
            <a className="btn btn-primary" href={siteHref} target="_blank" rel="noreferrer">Go to Site</a>
          </nav>

          <div className="nav-mobile">
            <a className="btn btn-primary btn-compact" href={siteHref} target="_blank" rel="noreferrer">Go to Site</a>
            <button
              type="button"
              className={`menu-btn ${open ? 'open' : ''}`}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} /> : <MoreVertical size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>{l.label}</NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
