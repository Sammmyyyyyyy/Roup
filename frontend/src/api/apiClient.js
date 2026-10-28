// Keep this empty during local development so Vite proxies requests to the gateway.
// Deployments must supply the public HTTPS gateway through VITE_API_BASE_URL.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

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

  const { response, data } = await execute(path);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session is no longer authorized. Please sign in again.');
    }
    const message = typeof data === 'string' ? data : data?.detail || data?.message || data?.error;
    throw new Error(message || `The API request failed (${response.status}).`);
  }

  return data;
}

