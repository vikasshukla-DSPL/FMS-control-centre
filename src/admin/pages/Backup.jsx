import { useEffect, useRef, useState } from 'react';
import { Download, Upload, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { useAdminData } from '../AdminData.jsx';
import { PageHead, useConfirm, useToast } from '../ui.jsx';
import { api } from '../../utils/api.js';
import { DEFAULT_DATA } from '../../data/defaults.js';
import { exportCsv } from '../../utils/exportCsv.js';
import { withStatus } from '../../utils/metrics.js';

const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Backup() {
  const { saved, replaceDraft } = useAdminData();
  const toast = useToast();
  const fileRef = useRef(null);
  const [ask, dialog] = useConfirm();
  const [log, setLog] = useState({ loading: true, entries: [], error: null });

  useEffect(() => {
    api.audit()
      .then(({ entries }) => setLog({ loading: false, entries, error: null }))
      .catch((e) => setLog({ loading: false, entries: [], error: e.message }));
  }, [saved.version]);

  const stamp = new Date().toISOString().slice(0, 10);

  function backup() {
    const { version, updatedAt, updatedBy, ...data } = saved; // eslint-disable-line no-unused-vars
    download(`dynemech-dashboard-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  }

  async function restore(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.fms) || typeof data.company !== 'object') throw new Error();
      const ok = await ask({
        title: 'Load this backup?',
        message: `It contains ${data.fms.length} FMS. It will replace everything you are editing, but nothing goes live until you press Save changes.`,
        confirmLabel: 'Load backup',
      });
      if (ok) {
        replaceDraft(data);
        toast('Backup loaded. Review it, then press Save changes.');
      }
    } catch {
      toast('That file is not a Dynemech dashboard backup.', 'error');
    }
  }

  async function reset() {
    const ok = await ask({
      title: 'Reset to the original data?',
      message: 'This loads the FMS list, company text and products that shipped with the site. It replaces your edits, but nothing goes live until you press Save changes.',
      confirmLabel: 'Load original data',
      danger: true,
    });
    if (ok) {
      replaceDraft(DEFAULT_DATA);
      toast('Original data loaded. Press Save changes to publish it.');
    }
  }

  return (
    <>
      <PageHead title="Backup and activity" intro="Keep a copy of the data, restore an earlier copy, and see who changed what." />

      <section className="ad-card">
        <h2>Backup</h2>
        <div className="ad-actions-grid">
          <div>
            <b>Download a backup</b>
            <p className="ad-muted">Everything that is saved right now, as one file.</p>
            <button className="btn btn-outline" onClick={backup}><Download size={16} /> Download backup (.json)</button>
          </div>
          <div>
            <b>Restore from a backup</b>
            <p className="ad-muted">Load a backup file into the editor. You review it before saving.</p>
            <button className="btn btn-outline" onClick={() => fileRef.current.click()}><Upload size={16} /> Choose backup file</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restore} />
          </div>
          <div>
            <b>Export the registry</b>
            <p className="ad-muted">The FMS list as a spreadsheet-friendly CSV.</p>
            <button className="btn btn-outline" onClick={() => exportCsv(withStatus(saved.fms))}><FileSpreadsheet size={16} /> Export CSV</button>
          </div>
          <div>
            <b>Start over</b>
            <p className="ad-muted">Go back to the data that shipped with the site.</p>
            <button className="btn btn-danger-outline" onClick={reset}><RotateCcw size={16} /> Load original data</button>
          </div>
        </div>
      </section>

      <section className="ad-card">
        <h2>Activity</h2>
        {log.loading && <p className="ad-muted">Loading activity</p>}
        {log.error && <p className="ad-muted">Could not load the activity log: {log.error}</p>}
        {!log.loading && !log.error && log.entries.length === 0 && <p className="ad-muted">No saves yet.</p>}
        {log.entries.length > 0 && (
          <ul className="ad-log">
            {log.entries.map((e, i) => (
              <li key={e.at + i}>
                <div><b>{e.user}</b><span>{e.summary}</span></div>
                <time dateTime={e.at}>{fmt(e.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dialog}
    </>
  );
}
