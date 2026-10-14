import { useCallback, useEffect, useState } from 'react';
import './doer.css';

async function call(body) {
  const r = await fetch('/api/doer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed'), { status: r.status });
  return j;
}
const ago = (m) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`);

export default function Doer() {
  const [user, setUser] = useState(null);
  const [names, setNames] = useState([]);
  const [boot, setBoot] = useState(true);
  const [view, setView] = useState('*');
  const [tasks, setTasks] = useState([]);
  const [step, setStep] = useState('All');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sure, setSure] = useState('');
  const [busy, setBusy] = useState('');
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2800); };

  const enter = useCallback(async () => {
    try {
      const r = await call({ action: 'me' });
      setUser(r.user); setNames(r.names); setView(r.user.role === 'admin' ? '*' : '');
    } catch { setUser(null); try { setNames((await call({ action: 'names' })).names); } catch (e) { toast(e.message); } }
    setBoot(false);
  }, []);
  useEffect(() => { enter(); }, [enter]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setTasks((await call({ action: 'pending', viewAs: view })).tasks); }
    catch (e) { if (e.status === 401) setUser(null); toast(e.message); }
    setLoading(false);
  }, [user, view]);
  useEffect(() => { load(); }, [load]);

  async function mark(t, v) {
    const k = `${t.row}_${t.block}_${v}`;
    if (sure !== k) { setSure(k); setTimeout(() => setSure((s) => (s === k ? '' : s)), 3000); return; }
    setBusy(`${t.row}_${t.block}`);
    try {
      const r = await call({ action: 'done', row: t.row, block: t.block, value: v });
      toast(`Saved. Actual time: ${r.actual}`);
      setTasks((a) => a.filter((x) => !(x.row === t.row && x.block === t.block)));
    } catch (e) { toast(e.message); load(); }
    setBusy(''); setSure('');
  }

  if (boot) return <div className="dd"><p className="empty">Loading...</p></div>;
  if (!user) return <Login names={names} onDone={enter} />;

  const steps = {}; tasks.forEach((t) => { steps[t.step] = (steps[t.step] || 0) + 1; });
  const cur = steps[step] ? step : 'All';
  const list = tasks.filter((t) => (cur === 'All' || t.step === cur) && (!q || `${t.step} ${t.doer} ${t.ctx.map((c) => c.v).join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  const admin = user.role === 'admin';

  return (
    <div className="dd">
      <header>
        <h1>Doer Dashboard<small>033 Material Tracking FMS (Purchase) - {user.name}</small></h1>
        {admin && <select value={view} onChange={(e) => setView(e.target.value)}><option value="*">All doers</option>{names.map((n) => <option key={n}>{n}</option>)}</select>}
        <button onClick={load}>Refresh</button>
        <button onClick={async () => { await call({ action: 'logout' }); setUser(null); enter(); }}>Log out</button>
      </header>
      <main>
        <div className="sum">
          <div><b>{tasks.length}</b><span>Pending</span></div>
          <div className="l"><b>{tasks.filter((t) => t.late > 0).length}</b><span>Overdue</span></div>
          <div><b>{Object.keys(steps).length}</b><span>Steps with pendency</span></div>
        </div>
        <div className="tools"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search item, SO, supplier, PO..." /></div>
        <div className="tools">
          {['All', ...Object.keys(steps)].map((s) => <button key={s} className={`chip ${s === cur ? 'on' : ''}`} onClick={() => setStep(s)}>{s}{s === 'All' ? '' : ` (${steps[s]})`}</button>)}
        </div>
        {loading && <p className="empty">Loading pendency...</p>}
        {!loading && !list.length && <p className="empty">No pending work. All clear.</p>}
        {list.map((t) => (
          <div key={`${t.row}_${t.block}`} className={`task ${t.late ? 'late' : ''}`}>
            <div>
              <h3>{t.step}{admin ? ` - ${t.doer}` : ''}</h3>
              <div className="when">Planned {t.planned || '-'}{t.late ? <> - <b>{ago(t.late)} late</b></> : null} - Row {t.row}</div>
              <div className="ctx">{t.ctx.map((c) => <div key={c.l}><span>{c.l}:</span> {c.v}</div>)}</div>
            </div>
            <div className="act">
              {t.options.map((o) => {
                const k = `${t.row}_${t.block}_${o}`;
                return <button key={o} disabled={busy === `${t.row}_${t.block}`} className={`${/^(no|fail|cancel)/i.test(o) ? 'neg' : ''} ${sure === k ? 'sure' : ''}`} onClick={() => mark(t, o)}>{sure === k ? 'Confirm?' : o === 'Done' ? 'Mark done' : o}</button>;
              })}
            </div>
          </div>
        ))}
      </main>
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

function Login({ names, onDone }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (!name && names.length) setName(names[0]); }, [names, name]);
  async function go(e) {
    e.preventDefault();
    try { await call({ action: 'login', name, pin }); onDone(); } catch (x) { setErr(x.message); }
  }
  return (
    <div className="dd">
      <form className="login" onSubmit={go}>
        <h2>Doer login</h2>
        <select value={name} onChange={(e) => setName(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select>
        <input type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
        <div className="err">{err}</div>
        <button type="submit">Open my pendency</button>
      </form>
    </div>
  );
}
