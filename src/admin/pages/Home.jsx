import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useAdminData } from '../AdminData.jsx';
import { useAuth } from '../AuthContext.jsx';
import { PageHead } from '../ui.jsx';
import { withStatus, summarise, getCategories, STATUS } from '../../utils/metrics.js';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null);

export default function Home() {
  const { saved, draft } = useAdminData();
  const { storage, user } = useAuth();
  const records = useMemo(() => withStatus(draft.fms), [draft.fms]);
  const s = summarise(records);
  const unlinked = records.filter((r) => r.status === STATUS.NOT_LINKED);
  const products = draft.productFamilies.reduce((n, f) => n + f.items.length, 0);
  const quoteIsHome = draft.company.quoteUrl.replace(/\/$/, '') === draft.company.website.replace(/\/$/, '');

  return (
    <>
      <PageHead title={`Welcome, ${user}`} intro="Everything the dashboard shows is edited here. Pick a section on the left." />

      {storage === null && (
        <div className="ad-banner bad" role="alert">
          <AlertTriangle size={18} />
          <span><b>Saving is not connected yet.</b> You can look around, but changes cannot be stored until a database is added to the Vercel project. See README, step 2.</span>
        </div>
      )}
      {storage === 'file' && (
        <div className="ad-banner info">
          <Info size={18} />
          <span>Local test mode: changes are saved to a file on this computer, not to the live site.</span>
        </div>
      )}

      <div className="ad-stats">
        <Link to="/admin/fms" className="ad-stat"><b>{s.total}</b><span>FMS in the registry</span></Link>
        <Link to="/admin/fms?status=FMS%20live" className="ad-stat"><b>{s.withFms}</b><span>with a live sheet</span></Link>
        <Link to="/admin/fms?status=Not%20linked" className={`ad-stat ${s.notLinked ? 'warn' : ''}`}><b>{s.notLinked}</b><span>not linked yet</span></Link>
        <Link to="/admin/departments" className="ad-stat"><b>{getCategories(records).length}</b><span>departments</span></Link>
        <Link to="/admin/products" className="ad-stat"><b>{products}</b><span>products in {draft.productFamilies.length} families</span></Link>
      </div>

      <div className="ad-grid2">
        <section className="ad-card">
          <h2>Needs a link</h2>
          {unlinked.length === 0 ? (
            <p className="ad-muted">Every FMS has at least one link.</p>
          ) : (
            <ul className="ad-todo">
              {unlinked.slice(0, 8).map((r) => (
                <li key={r.id}><b>{r.code ? `${r.code} ` : ''}{r.title}</b><span>{r.category}</span></li>
              ))}
            </ul>
          )}
          {unlinked.length > 0 && <Link to="/admin/fms?status=Not%20linked" className="ad-link">Fix these in the registry <ArrowRight size={14} /></Link>}
        </section>

        <section className="ad-card">
          <h2>Before you go live</h2>
          <ul className="ad-check">
            <li className={quoteIsHome ? 'todo' : 'done'}>
              <span>{quoteIsHome ? 'The "Request a quote" link still points to the homepage.' : 'The "Request a quote" link is set.'}</span>
              {quoteIsHome && <Link to="/admin/company" className="ad-link">Set it <ArrowRight size={14} /></Link>}
            </li>
            <li className={draft.company.announcementEnabled ? 'done' : 'todo'}>
              <span>{draft.company.announcementEnabled ? `Announcement strip is on: "${draft.company.announcement}"` : 'The announcement strip is switched off.'}</span>
              <Link to="/admin/company" className="ad-link">Review <ArrowRight size={14} /></Link>
            </li>
          </ul>
          <p className="ad-muted small">
            {saved.updatedAt ? `Last saved by ${saved.updatedBy} on ${fmtDate(saved.updatedAt)} (version ${saved.version}).` : 'Nothing has been saved from the admin panel yet. The site is showing the data bundled with the build.'}
          </p>
        </section>
      </div>
    </>
  );
}
