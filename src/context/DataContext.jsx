import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';
import { normalizeData } from '../data/defaults.js';
import { withStatus, getCategories } from '../utils/metrics.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState({ ready: false, doc: null });

  useEffect(() => {
    let alive = true;
    // If the API is slow or missing, show the bundled data rather than a blank page.
    const timer = setTimeout(() => alive && setState((s) => (s.ready ? s : { ready: true, doc: null })), 4000);
    api
      .publicData()
      .then(({ data }) => alive && setState({ ready: true, doc: data }))
      .catch(() => alive && setState((s) => (s.ready ? s : { ready: true, doc: null })))
      .finally(() => clearTimeout(timer));
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const value = useMemo(() => {
    const d = normalizeData(state.doc);
    const records = withStatus(d.fms);
    return { ...d, records, categories: getCategories(records) };
  }, [state.doc]);

  if (!state.ready) {
    return (
      <div className="boot" role="status" aria-live="polite">
        <span /> Loading dashboard
      </div>
    );
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
