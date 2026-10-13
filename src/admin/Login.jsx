import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { wavePath } from '../components/Hero.jsx';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const { status, login, notice } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (status === 'in') return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="lg">
      <section className="lg-brand">
        <div className="lg-logo"><img src="/logo.png" alt="Dynemech Vibration Technology" /></div>
        <div className="lg-copy">
          <h1>MIS control room</h1>
          <p>Update the FMS registry, company details and products that the dashboard shows.</p>
        </div>
        <svg className="lg-wave" viewBox="0 0 1600 150" preserveAspectRatio="none" aria-hidden="true">
          <path d={wavePath()} pathLength="1" />
        </svg>
      </section>

      <section className="lg-form">
        <form onSubmit={submit} noValidate>
          <h2>Sign in</h2>
          <p className="lg-sub">Use the MIS login you were given. This is separate from the public dashboard.</p>

          {(error || notice) && <div className="lg-alert" role="alert">{error || notice}</div>}

          <label className="fld">
            <span className="fld-label">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </label>
          <label className="fld">
            <span className="fld-label">Password</span>
            <div className="pw">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <button className="btn btn-primary lg-submit" disabled={busy || !username || !password}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
          <Link to="/" className="lg-back"><ArrowLeft size={15} /> Back to the dashboard</Link>
        </form>
      </section>
    </div>
  );
}
