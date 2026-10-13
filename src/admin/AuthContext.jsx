import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'checking', user: null, storage: undefined, notice: null });

  useEffect(() => {
    api
      .session()
      .then((s) => setState({ status: 'in', user: s.user, storage: s.storage, notice: null }))
      .catch((e) => setState({ status: 'out', user: null, storage: undefined, notice: e.status === 503 ? e.message : null }));
  }, []);

  const login = useCallback(async (username, password) => {
    const s = await api.login(username, password);
    setState({ status: 'in', user: s.user, storage: s.storage, notice: null });
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* cookie expires on its own */ }
    setState({ status: 'out', user: null, storage: undefined, notice: null });
  }, []);

  const expire = useCallback(() => {
    setState({ status: 'out', user: null, storage: undefined, notice: 'Your session ended. Sign in again to keep editing.' });
  }, []);

  return <Ctx.Provider value={{ ...state, login, logout, expire }}>{children}</Ctx.Provider>;
}
