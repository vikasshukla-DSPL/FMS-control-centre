import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

export default function Footer() {
  const { company, site } = useData();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>{company.name}</span>
        <span>{company.location}</span>
        <span>
          {site.footerNote}
          <Link to="/admin" className="footer-admin">MIS login</Link>
        </span>
      </div>
    </footer>
  );
}
