export const isHttpUrl = (s) => {
  try {
    const u = new URL(String(s));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// Only ever render http(s) links, whatever is in the data.
export const safeUrl = (s) => (s && isHttpUrl(s) ? s : null);
