async function call(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    const err = new Error(body?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const api = {
  publicData: () => call('/api/data'),
  freshData: () => call('/api/data?fresh=1'),
  save: (baseVersion, data) => call('/api/data', { method: 'PUT', body: JSON.stringify({ baseVersion, data }) }),
  login: (username, password) => call('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => call('/api/logout', { method: 'POST', body: '{}' }),
  session: () => call('/api/session'),
  audit: () => call('/api/audit'),
};
