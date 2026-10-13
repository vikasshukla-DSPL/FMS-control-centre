// Tiny helpers shared by every API route. Plain Node req/res, so the same code
// runs on Vercel and inside the Vite dev server.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { throw new HttpError(400, 'Request body is not valid JSON.'); }
    }
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new HttpError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Request body is not valid JSON.'); }
}

/**
 * Wrap a route. Enforces allowed methods, requires a JSON content type on
 * writes (a basic CSRF guard on top of SameSite cookies) and turns thrown
 * HttpErrors into clean JSON responses.
 */
export function route(methods, handler) {
  return async function (req, res) {
    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        throw new HttpError(405, 'Method not allowed.');
      }
      if (req.method !== 'GET' && !String(req.headers['content-type'] || '').includes('application/json')) {
        throw new HttpError(415, 'Content-Type must be application/json.');
      }
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message });
      console.error('[api]', err);
      return send(res, 500, { error: 'Something went wrong on the server. Try again.' });
    }
  };
}

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || 'unknown';
}
