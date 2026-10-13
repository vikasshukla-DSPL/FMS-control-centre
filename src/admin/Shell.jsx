import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Building2, Factory, Boxes, Type, History, LogOut, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { useAdminData } from './AdminData.jsx';
import { useConfirm } from './ui.jsx';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/fms', label: 'FMS registry', icon: ListChecks },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/company', label: 'Company', icon: Factory },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/text', label: 'Page text', icon: Type },
  { to: '/admin/backup', label: 'Backup and activity', icon: History },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const { dirty, saving, save, discard, conflict, load, draft } = useAdminData();
  const [ask, dialog] = useConfirm();

  async function onDiscard() {
    if (await ask({ title: 'Discard changes?', message: 'Everything you changed since the last save will be lost.', confirmLabel: 'Discard changes', danger: true })) discard();
  }
  async function onLogout() {
    if (dirty && !(await ask({ title: 'Sign out with unsaved changes?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Sign out', danger: true }))) return;
    logout();
  }

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-logo"><img src={draft.company.logoUrl || '/logo.png'} alt={draft.company.name} /></div>
        <p className="ad-tag">MIS admin</p>
        <nav aria-label="Admin sections">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> View live dashboard</a>
          <div className="ad-user">
            <span>Signed in as <b>{user}</b></span>
            <button onClick={onLogout}><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </aside>

      <div className="ad-main">
        {conflict && (
          <div className="ad-banner warn" role="alert">
            <AlertTriangle size={18} />
            <span>{conflict}</span>
            <button className="btn btn-sm btn-outline" onClick={load}>Reload latest (loses your edits)</button>
          </div>
        )}
        <div className="ad-content"><Outlet /></div>

        {dirty && (
          <div className="ad-savebar" role="region" aria-label="Unsaved changes">
            <span><i /> You have unsaved changes</span>
            <div>
              <button className="btn btn-outline" onClick={onDiscard} disabled={saving}>Discard</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving' : 'Save changes'}</button>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
