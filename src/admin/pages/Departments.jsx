import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../AdminData.jsx';
import { Modal, Field, PageHead } from '../ui.jsx';
import { byCategory, withStatus } from '../../utils/metrics.js';

export default function Departments() {
  const { draft, update } = useAdminData();
  const [renaming, setRenaming] = useState(null);
  const [name, setName] = useState('');
  const depts = useMemo(() => byCategory(withStatus(draft.fms)), [draft.fms]);
  const trimmed = name.trim();
  const merges = trimmed && trimmed !== renaming && depts.some((d) => d.category === trimmed);

  function apply(e) {
    e.preventDefault();
    if (!trimmed) return;
    update((d) => { d.fms.forEach((r) => { if (r.category === renaming) r.category = trimmed; }); });
    setRenaming(null);
  }

  return (
    <>
      <PageHead title="Departments" intro="Departments come from the FMS themselves. Rename one here to change it everywhere, or rename it to an existing department to merge the two." />
      <div className="ad-tablewrap">
        <table className="ad-table">
          <thead><tr><th>Department</th><th>Systems</th><th>FMS live</th><th>SOP</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.category}>
                <td><b>{d.category}</b></td>
                <td className="num"><Link to={`/admin/fms?dept=${encodeURIComponent(d.category)}`} className="ad-link">{d.total}</Link></td>
                <td className="num">{d.withFms} <small>({d.fmsPct}%)</small></td>
                <td className="num">{d.withSop} <small>({d.sopPct}%)</small></td>
                <td className="ad-rowactions">
                  <button className="btn btn-sm btn-outline" onClick={() => { setRenaming(d.category); setName(d.category); }}>
                    <Pencil size={14} /> Rename
                  </button>
                </td>
              </tr>
            ))}
            {depts.length === 0 && <tr><td colSpan={5} className="ad-empty">No departments yet. Add an FMS to create one.</td></tr>}
          </tbody>
        </table>
      </div>

      {renaming && (
        <Modal
          title="Rename department"
          size="sm"
          onClose={() => setRenaming(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="dept-form" disabled={!trimmed || trimmed === renaming}>Rename</button>
            </>
          }
        >
          <form id="dept-form" className="ad-form" onSubmit={apply}>
            <Field label="New name" hint={merges ? `"${trimmed}" already exists. Both departments will be merged.` : `Applies to every FMS now in "${renaming}".`}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
