import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ExternalLink, FileSpreadsheet, FileText, AlertTriangle, Layers } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useData } from '../context/DataContext.jsx';
import { summarise, byCategory, statusBreakdown, STATUS, STATUS_COLORS } from '../utils/metrics.js';
import './overview.css';

export default function Overview() {
  const { records, site } = useData();
  const s = summarise(records);
  const depts = byCategory(records);
  const donut = statusBreakdown(records);
  const stacked = depts.map((d) => ({
    name: d.category,
    [STATUS.COMPLETE]: d.complete,
    [STATUS.FMS_ONLY]: d.fmsOnly,
    [STATUS.NOT_LINKED]: d.notLinked,
  }));
  const unlinked = records.filter((r) => r.status === STATUS.NOT_LINKED);
  const needSop = records.filter((r) => r.status === STATUS.FMS_ONLY).length;

  return (
    <>
      <Hero
        title={site.overviewTitle}
        subtitle={`${s.total} flow management systems across ${depts.length} departments. ${s.withFms} are live and ${s.notLinked} still need a link.`}
        primary={{ to: '/registry', label: 'Open FMS registry' }}
        secondary={{ to: '/company', label: 'Company and products' }}
      />

      <div className="container ov">
        <section className="ov-kpis" aria-label="Key figures">
          <article className="kpi kpi-main">
            <span className="kpi-label">FMS with a live sheet</span>
            <strong>{s.withFms}<small> of {s.total}</small></strong>
            <div className="meter"><span style={{ width: `${s.fmsPct}%` }} /></div>
            <em>{s.fmsPct}% coverage</em>
          </article>
          <article className="kpi">
            <FileText size={20} />
            <span className="kpi-label">SOP documented</span>
            <strong>{s.withSop}</strong>
            <em>{s.sopPct}% of systems</em>
          </article>
          <article className="kpi">
            <FileSpreadsheet size={20} />
            <span className="kpi-label">Live but no SOP</span>
            <strong>{needSop}</strong>
            <em>Add a process document</em>
          </article>
          <article className="kpi kpi-warn">
            <AlertTriangle size={20} />
            <span className="kpi-label">Not linked yet</span>
            <strong>{s.notLinked}</strong>
            <em>No SOP and no FMS sheet</em>
          </article>
        </section>

        <section className="ov-charts">
          <article className="panel">
            <h2>Documentation status</h2>
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={2} stroke="none">
                    {donut.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <b>{s.complete}</b>
                <span>fully documented</span>
              </div>
            </div>
            <ul className="legend">
              {donut.map((d) => (
                <li key={d.name}>
                  <i style={{ background: STATUS_COLORS[d.name] }} />
                  {d.name}
                  <b>{d.value}</b>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <h2>Systems by department</h2>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={stacked} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#ece6f4" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#f4f0f9' }} />
                <Legend />
                <Bar dataKey={STATUS.COMPLETE} stackId="a" fill={STATUS_COLORS[STATUS.COMPLETE]} />
                <Bar dataKey={STATUS.FMS_ONLY} stackId="a" fill={STATUS_COLORS[STATUS.FMS_ONLY]} />
                <Bar dataKey={STATUS.NOT_LINKED} stackId="a" fill={STATUS_COLORS[STATUS.NOT_LINKED]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="ov-lower">
          <article className="panel">
            <h2>Department scorecard</h2>
            <table className="score">
              <thead>
                <tr><th>Department</th><th>Systems</th><th>FMS live</th><th>SOP</th></tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.category}>
                    <td>{d.category}</td>
                    <td>{d.total}</td>
                    <td><Bar2 value={d.fmsPct} /></td>
                    <td><Bar2 value={d.sopPct} tone="soft" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2>Needs a link</h2>
              <Link to="/registry" className="text-link">View all <ExternalLink size={14} /></Link>
            </div>
            {unlinked.length === 0 && <p className="ov-empty">Every FMS has at least one link.</p>}
            <ul className="todo">
              {unlinked.map((r) => (
                <li key={r.id}>
                  <div>
                    <b>{r.code ? `${r.code} ` : ''}{r.title}</b>
                    <span>{r.category}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="ov-note">
          <Layers size={15} /> Departments are set per FMS by the MIS team in the admin panel.
        </p>
      </div>
    </>
  );
}

function Bar2({ value, tone }) {
  return (
    <div className={`mini ${tone || ''}`}>
      <div className="track"><span style={{ width: `${value}%` }} /></div>
      <em>{value}%</em>
    </div>
  );
}
