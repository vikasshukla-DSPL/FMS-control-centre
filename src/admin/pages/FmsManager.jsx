import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAdminData } from '../AdminData.jsx';
import { Modal, Field, PageHead, useConfirm, newId } from '../ui.jsx';
import { withStatus, getCategories, STATUS } from '../../utils/metrics.js';
import { isHttpUrl } from '../../utils/url.js';

const STATUS_FILTERS = ['All', STATUS.COMPLETE, STATUS.FMS_ONLY, STATUS.NOT_LINKED];

function nextCode(fms) {
  const nums = fms.map((r) => parseInt(r.code, 10)).filter(Number.isFinite);
  return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}

export default function FmsManager() {
  const { draft, update } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [ask, dialog] = useConfirm();
  const status = params.get('status') || 'All';
  const dept = params.get('dept') || 'All';

  const records = useMemo(() => withStatus(draft.fms), [draft.fms]);
  const categories = useMemo(() => getCategories(records), [records]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return records
      .filter((r) => (dept === 'All' || r.category === dept) && (status === 'All' || r.status === status) &&
        (!needle || `${r.code ?? ''} ${r.title} ${r.category}`.toLowerCase().includes(needle)))
      .sort((a, b) => ((a.pin ?? 1e9) - (b.pin ?? 1e9)) || ((a.code ?? '999') + a.title).localeCompare((b.code ?? '999') + b.title, undefined, { numeric: true }));
  }, [records, q, dept, status]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === 'All') next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };
  const setStatus = (s) => setFilter('status', s);
  const setDept = (v) => setFilter('dept', v);

  function saveRecord(rec) {
    update((d) => {
      const i = d.fms.findIndex((r) => r.id === rec.id);
      if (i >= 0) d.fms[i] = rec;
      else d.fms.push(rec);
    });
    setEditing(null);
  }

  async function remove(r) {
    const ok = await ask({
      title: 'Delete this FMS?',
      message: `"${r.title}" will be removed from the registry and the dashboard counts once you save.`,
      confirmLabel: 'Delete FMS',
      danger: true,
    });
    if (ok) update((d) => { d.fms = d.fms.filter((x) => x.id !== r.id); });
  }

  const blank = () => ({ id: newId('r'), code: nextCode(draft.fms), title: '', rawName: '', category: dept !== 'All' ? dept : '', sop: null, fms: null, dashboard: null, pin: null, isNew: true });

  return (
    <>
      <PageHead title="FMS registry" intro="Add systems, fix links and move systems between departments. Nothing goes live until you press Save changes.">
        <button className="btn btn-primary" onClick={() => setEditing(blank())}><Plus size={16} /> Add FMS</button>
      </PageHead>

      <div className="ad-toolbar">
        <label className="ad-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code or department" aria-label="Search" />
        </label>
        <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option value="All">All departments</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="ad-chips" role="group" aria-label="Status filter">
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
            {s}<span>{s === 'All' ? records.length : records.filter((r) => r.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className="ad-tablewrap">
        <table className="ad-table">
          <thead>
            <tr><th>Code</th><th>FMS name</th><th>Department</th><th>Status</th><th>Links</th><th><span className="sr">Actions</span></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="num">{r.code ?? '-'}</td>
                <td><b>{r.title}</b>{r.pin && <span className="ad-pin" title="Shown at the top of the public registry">Top {r.pin}</span>}</td>
                <td>{r.category}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <div className="ad-links">
                    <LinkChip href={r.fms} label="FMS" />
                    <LinkChip href={r.sop} label="SOP" />
                    <LinkChip href={r.dashboard} label="Dashboard" />
                  </div>
                </td>
                <td className="ad-rowactions">
                  <button className="icon-btn" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}><Pencil size={16} /></button>
                  <button className="icon-btn danger" onClick={() => remove(r)} aria-label={`Delete ${r.title}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="ad-empty">
                {records.length === 0 ? 'No FMS yet. Add the first one.' : 'No FMS matches these filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="ad-count">Showing {rows.length} of {records.length} systems</p>

      {editing && (
        <Modal
          title={editing.isNew ? 'Add FMS' : 'Edit FMS'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="fms-form">{editing.isNew ? 'Add FMS' : 'Apply changes'}</button>
            </>
          }
        >
          <FmsForm
            initial={editing}
            categories={categories}
            otherCodes={draft.fms.filter((r) => r.id !== editing.id).map((r) => r.code).filter(Boolean)}
            onSave={saveRecord}
          />
        </Modal>
      )}
      {dialog}
    </>
  );
}

function LinkChip({ href, label }) {
  return href && isHttpUrl(href)
    ? <a className="chip on" href={href} target="_blank" rel="noreferrer">{label}</a>
    : <span className="chip off">{label} missing</span>;
}

function FmsForm({ initial, categories, otherCodes, onSave }) {
  const [f, setF] = useState({
    code: initial.code ?? '',
    title: initial.title,
    category: initial.category,
    fms: initial.fms ?? '',
    sop: initial.sop ?? '',
    dashboard: initial.dashboard ?? '',
    pin: initial.pin ?? '',
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const dupe = f.code.trim() && otherCodes.includes(f.code.trim());

  function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Enter the FMS name.';
    if (!f.category.trim()) er.category = 'Pick a department or type a new one.';
    for (const k of ['fms', 'sop', 'dashboard']) {
      if (f[k].trim() && !isHttpUrl(f[k].trim())) er[k] = 'Paste the full link, starting with https://';
    }
    const pinText = String(f.pin).trim();
    if (pinText && (!/^\d+$/.test(pinText) || Number(pinText) < 1 || Number(pinText) > 99)) er.pin = 'Enter a whole number from 1 to 99, or leave empty.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const code = f.code.trim();
    const title = f.title.trim();
    const { isNew, ...rest } = initial; // eslint-disable-line no-unused-vars
    onSave({
      ...rest,
      code: code || null,
      title,
      rawName: code ? `${code}_${title}` : title,
      category: f.category.trim(),
      fms: f.fms.trim() || null,
      sop: f.sop.trim() || null,
      dashboard: f.dashboard.trim() || null,
      pin: pinText ? Number(pinText) : null,
    });
  }

  return (
    <form id="fms-form" className="ad-form" onSubmit={submit} noValidate>
      <Field label="Code" hint="Optional. The number used in the FMS file name, like 014." error={dupe ? 'Another FMS already uses this code.' : null}>
        <input value={f.code} onChange={set('code')} maxLength={20} />
      </Field>
      <Field label="FMS name" error={errors.title}>
        <input value={f.title} onChange={set('title')} maxLength={200} />
      </Field>
      <Field label="Department" error={errors.category} hint="Type a new name to create a new department.">
        <input value={f.category} onChange={set('category')} list="dept-list" maxLength={80} />
        <datalist id="dept-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="FMS sheet link" error={errors.fms} hint="Google Sheet or the working file.">
        <div className="withopen">
          <input value={f.fms} onChange={set('fms')} placeholder="https://docs.google.com/spreadsheets/..." />
          {isHttpUrl(f.fms) && <a className="icon-btn" href={f.fms} target="_blank" rel="noreferrer" aria-label="Test FMS link"><ExternalLink size={16} /></a>}
        </div>
      </Field>
      <Field label="SOP link" error={errors.sop} hint="Google Doc or PDF describing the process.">
        <div className="withopen">
          <input value={f.sop} onChange={set('sop')} placeholder="https://docs.google.com/document/..." />
          {isHttpUrl(f.sop) && <a className="icon-btn" href={f.sop} target="_blank" rel="noreferrer" aria-label="Test SOP link"><ExternalLink size={16} /></a>}
        </div>
      </Field>
      <Field label="Dashboard link" error={errors.dashboard} hint="Doer dashboard (Apps Script web app) for this FMS.">
        <div className="withopen">
          <input value={f.dashboard} onChange={set('dashboard')} placeholder="https://script.google.com/macros/s/.../exec" />
          {isHttpUrl(f.dashboard) && <a className="icon-btn" href={f.dashboard} target="_blank" rel="noreferrer" aria-label="Test Dashboard link"><ExternalLink size={16} /></a>}
        </div>
      </Field>
      <Field label="Show at top (position)" error={errors.pin} hint="1 shows first. Leave empty for the normal order. Positions are shared, so use different numbers.">
        <input value={f.pin} onChange={set('pin')} inputMode="numeric" maxLength={2} style={{ maxWidth: 120 }} />
      </Field>
    </form>
  );
}
