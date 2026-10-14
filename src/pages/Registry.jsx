import { useMemo, useState } from 'react';
import { Search, Download, FileText, FileSpreadsheet, LayoutDashboard, ArrowUpDown, X } from 'lucide-react';
import RegistryHero from '../components/RegistryHero.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useData } from '../context/DataContext.jsx';
import { safeUrl } from '../utils/url.js';
import { STATUS, summarise } from '../utils/metrics.js';
import { exportCsv } from '../utils/exportCsv.js';
import './registry.css';

const STATUS_FILTERS = ['All', STATUS.COMPLETE, STATUS.FMS_ONLY, STATUS.NOT_LINKED];

export default function Registry() {
  const { records, categories, site } = useData();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState({ key: 'code', dir: 1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = records.filter(
      (r) =>
        (dept === 'All' || r.category === dept) &&
        (status === 'All' || r.status === status) &&
        (!q || `${r.code ?? ''} ${r.title} ${r.category}`.toLowerCase().includes(q))
    );
    const val = (r) => (sort.key === 'code' ? (r.code ?? '999') + r.title : r[sort.key]);
    const pinOf = (r) => r.pin ?? 1e9; // featured FMS always stay on top, in their set order
    return [...list].sort(
      (a, b) => pinOf(a) - pinOf(b) || (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir
    );
  }, [records, query, dept, status, sort]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
  const clear = () => { setQuery(''); setDept('All'); setStatus('All'); };
  const filtered = query || dept !== 'All' || status !== 'All';
  const total = records.length;

  return (
    <>
      <RegistryHero
        eyebrow={site.registryEyebrow}
        headline={site.registryHeadline}
        tagline={site.registryTagline}
        stats={[
          { label: 'Systems', value: total },
          { label: 'Departments', value: categories.length },
          { label: 'Live sheets', value: summarise(records).withFms },
        ]}
      />
      <div className="container rg">
        <div className="rg-toolbar">
          <label className="rg-search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, code or department" />
          </label>
          <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="All">All departments</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => exportCsv(rows)}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="rg-chips" role="group" aria-label="Status filter">
          {STATUS_FILTERS.map((s) => (
            <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
              {s}
              <span>{s === 'All' ? total : records.filter((r) => r.status === s).length}</span>
            </button>
          ))}
          {filtered && (
            <button className="clear" onClick={clear}><X size={14} /> Clear filters</button>
          )}
        </div>

        <div className="rg-table-wrap">
          <table className="rg-table">
            <thead>
              <tr>
                <th><SortBtn label="Code" k="code" sort={sort} onClick={toggleSort} /></th>
                <th><SortBtn label="FMS name" k="title" sort={sort} onClick={toggleSort} /></th>
                <th><SortBtn label="Department" k="category" sort={sort} onClick={toggleSort} /></th>
                <th><SortBtn label="Status" k="status" sort={sort} onClick={toggleSort} /></th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Code" className="code">{r.code ?? '-'}</td>
                  <td data-label="FMS name" className="name">{r.title}</td>
                  <td data-label="Department">{r.category}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Links">
                    <div className="links">
                      <LinkBtn primary href={safeUrl(r.fms)} icon={<FileSpreadsheet size={15} />} label="FMS" />
                      <LinkBtn href={safeUrl(r.sop)} icon={<FileText size={15} />} label="SOP" />
                      <LinkBtn href={safeUrl(r.dashboard)} icon={<LayoutDashboard size={15} />} label="Dashboard" />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="empty">No FMS matches these filters. <button onClick={clear}>Clear filters</button></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="rg-count">Showing {rows.length} of {total} systems</p>
      </div>
    </>
  );
}

function SortBtn({ label, k, sort, onClick }) {
  return (
    <button className={`sort ${sort.key === k ? 'on' : ''}`} onClick={() => onClick(k)}>
      {label} <ArrowUpDown size={13} />
    </button>
  );
}

function LinkBtn({ href, icon, label, primary = false }) {
  if (!href) return <span className="lnk off" title={`No ${label} link yet`}>{icon}{label}</span>;
  return (
    <a className={`lnk ${primary ? '' : 'quiet'}`} href={href} target="_blank" rel="noreferrer">
      {icon}{label}
    </a>
  );
}
