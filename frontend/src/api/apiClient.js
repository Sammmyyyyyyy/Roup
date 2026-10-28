export function getApiBase() {
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }
  return envBase;
}
const baseUrl = getApiBase();

// Path alternate pairs for gateway vs direct service compatibility
const alternatePaths = [
  [/^\/api\/secondary-markets(\/.*)?$/, '/api/v1/auctions/secondary-markets$1'],
  [/^\/api\/v1\/auctions\/secondary-markets(\/.*)?$/, '/api/secondary-markets$1'],
  [/^\/api\/dutch-auctions(\/.*)?$/, '/api/v1/auctions/dutch-auctions$1'],
  [/^\/api\/v1\/auctions\/dutch-auctions(\/.*)?$/, '/api/dutch-auctions$1'],
  [/^\/api\/wallet(\/.*)?$/, '/api/v1/wallet$1'],
  [/^\/api\/v1\/wallet(\/.*)?$/, '/api/wallet$1'],
];

function getAlternatePath(path) {
  for (const [pattern, replacement] of alternatePaths) {
    if (pattern.test(path)) {
      return path.replace(pattern, replacement);
    }
  }
  return null;
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  
  if (auth) {
    try {
      const session = JSON.parse(sessionStorage.getItem('roup-auth-session') || 'null');
      if (session?.jwt) headers.Authorization = `Bearer ${session.jwt}`;
      if (session?.user?.id) headers['X-User-Id'] = session.user.id;
    } catch { /* Handled by response verification */ }
  }

  async function execute(targetPath) {
    let response;
    try {
      response = await fetch(`${baseUrl}${targetPath}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error('The Roup API could not be reached. Check that the backend is running and try again.');
    }

    const raw = await response.text();
    let data = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch { data = raw; }
    }

    return { response, data };
  }

  let { response, data } = await execute(path);

  // If 404, check if an alternate route prefix exists (e.g. gateway vs direct service path)
  if (response.status === 404) {
    const alternate = getAlternatePath(path);
    if (alternate) {
      try {
        const retry = await execute(alternate);
        if (retry.response.ok) {
          response = retry.response;
          data = retry.data;
        }
      } catch { /* Keep initial response */ }
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session is no longer authorized. Please sign in again.');
    }
    const message = typeof data === 'string' ? data : data?.detail || data?.message || data?.error;
    throw new Error(message || `The API request failed (${response.status}).`);
  }

  return data;
}

