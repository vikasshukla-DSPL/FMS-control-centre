import { NavLink, Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { safeUrl } from '../utils/url.js';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/registry', label: 'FMS registry' },
  { to: '/company', label: 'Company and products' },
];

export default function Header() {
  const { company } = useData();
  return (
    <header className="site-header">
      {company.announcementEnabled && company.announcement && <div className="announce">{company.announcement}</div>}
      <div className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" aria-label="Dynemech home">
            <img src={company.logoUrl || '/logo.png'} alt={company.name} />
          </Link>
          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
            <a className="btn btn-primary" href={safeUrl(company.quoteUrl) || '#'} target="_blank" rel="noreferrer">
              Request a quote
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
