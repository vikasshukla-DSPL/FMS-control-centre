import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

/* ---------- toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((i) => i.id !== id)), type === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="ad-toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`ad-toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            {t.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, onClose, children, footer, size = '' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input:not([type=hidden]), textarea, select')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="ad-overlay">
      <div className={`ad-modal ${size}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="ad-modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

/* ---------- confirm dialog ---------- */
export function useConfirm() {
  const [state, setState] = useState(null);
  const ask = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const done = (v) => {
    state.resolve(v);
    setState(null);
  };
  const dialog = state && (
    <Modal
      title={state.title}
      size="sm"
      onClose={() => done(false)}
      footer={
        <>
          <button className="btn btn-outline" onClick={() => done(false)}>Cancel</button>
          <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => done(true)}>
            {state.confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <p className="ad-confirm-text">{state.message}</p>
    </Modal>
  );
  return [ask, dialog];
}

/* ---------- form bits ---------- */
export function Field({ label, hint, error, children, wide }) {
  return (
    <label className={`fld ${wide ? 'wide' : ''}`}>
      <span className="fld-label">{label}</span>
      {children}
      {hint && !error && <small className="fld-hint">{hint}</small>}
      {error && <small className="fld-err" role="alert">{error}</small>}
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

// One entry per line. Edits are committed as you type; empty lines are ignored.
export function LinesField({ value, onChange, rows = 6, placeholder }) {
  const parse = (t) => t.split('\n').map((s) => s.trim()).filter(Boolean);
  const [text, setText] = useState(value.join('\n'));
  useEffect(() => {
    if (JSON.stringify(parse(text)) !== JSON.stringify(value)) setText(value.join('\n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <textarea
      rows={rows}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parse(e.target.value));
      }}
    />
  );
}

export function PageHead({ title, children, intro }) {
  return (
    <div className="ad-pagehead">
      <div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {children && <div className="ad-pagehead-actions">{children}</div>}
    </div>
  );
}

export const move = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

export const newId = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
