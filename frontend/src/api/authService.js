const configuredBase = (import.meta.env.VITE_AUTH_API_BASE_URL || '').trim().replace(/\/$/, '');

async function postAuth(path, body) {
  let response;
  try {
    response = await fetch(`${configuredBase}/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Roup could not reach the authentication service. Check that the backend is running and try again.');
  }

  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = { message: raw }; }
  }
  if (!response.ok) {
    const message = data?.detail || data?.message || data?.title || data?.error || '';
    const normalized = String(message).toLowerCase();
    if (path === 'signin' && (response.status === 401 || response.status === 403 || normalized.includes('bad credential') || normalized.includes('unauthorized'))) {
      throw new Error('That email and password combination was not recognized. Check your details and try again.');
    }
    if (path === 'signup' && (response.status === 409 || normalized.includes('already registered') || normalized.includes('already exists'))) {
      throw new Error('An account already exists for this email. Sign in instead or use another email address.');
    }
    if (response.status >= 500) throw new Error('The authentication service ran into a problem. Please try again shortly.');
    throw new Error(message || 'We could not complete that request. Check your details and try again.');
  }
  return data;
}

export function signIn(emailId, password) {
  return postAuth('signin', { emailId, password });
}

export function signUp(name, emailId, password) {
  // SignupDto accepts exactly these fields; confirmation stays in the browser.
  return postAuth('signup', { name, emailId, password });
}
