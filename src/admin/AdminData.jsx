import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';
import { normalizeData } from '../data/defaults.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ui.jsx';

const Ctx = createContext(null);
export const useAdminData = () => useContext(Ctx);

// Holds the data being edited (draft) next to the last saved copy. Every tab
// edits the same draft, and one Save sends it to the server.
export function AdminDataProvider({ children }) {
  const { expire } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { data } = await api.freshData();
      const doc = normalizeData(data);
      setSaved(doc);
      setDraft(structuredClone(doc));
      setConflict(null);
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback((mutator) => {
    setDraft((d) => {
      const next = structuredClone(d);
      mutator(next);
      return next;
    });
  }, []);

  // Used by restore and reset: swap the content but keep the saved version number.
  const replaceDraft = useCallback((doc) => {
    setDraft((d) => ({ ...normalizeData(doc), version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy }));
  }, []);

  const discard = useCallback(() => setDraft(structuredClone(saved)), [saved]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await api.save(saved.version, draft);
      const doc = normalizeData(data);
      setSaved(doc);
      setDraft(structuredClone(doc));
      setConflict(null);
      toast('Changes saved. The dashboard now shows them.');
      return true;
    } catch (e) {
      if (e.status === 401) expire();
      else if (e.status === 409) setConflict(e.message);
      else toast(e.message, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [saved, draft, expire, toast]);

  const value = { saved, draft, dirty, saving, conflict, loadError, load, update, replaceDraft, discard, save };

  if (loadError) {
    return (
      <div className="ad-center">
        <div className="ad-card narrow">
          <h2>Could not load the data</h2>
          <p>{loadError}</p>
          <button className="btn btn-primary" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }
  if (!draft) return <div className="boot" role="status"><span /> Loading data</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
