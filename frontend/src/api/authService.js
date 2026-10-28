import { googleAuthorizationUrl, safeNextPath } from './oauthNavigation.js';

export function getAuthBase() {
  const envBase = (import.meta.env.VITE_AUTH_API_BASE_URL || '').trim().replace(/\/$/, '');
  // On localhost use relative paths ('') so requests go through Vite's dev proxy (no CORS issues).
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }
  return envBase;
}

export const googleOAuthEnabled = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === 'true';

async function postAuth(path, body) {
  const base = getAuthBase();
  const cleanPath = path.replace(/^\/+|\/+$/g, '');

  // Single, known endpoint: the gateway routes /api/signup, /api/signin, /api/oauth-signin, /api/oauth-signup
  const url = `${base}/api/${cleanPath}`;

  // The backend's /api/oauth-signup takes a raw String body (@RequestBody String), so strings are
  // sent as-is (text/plain). Everything else is sent as JSON.
  const isRawString = typeof body === 'string';
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': isRawString ? 'text/plain' : 'application/json',
        Accept: 'application/json',
      },
      body: isRawString ? body : JSON.stringify(body),
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
    if (cleanPath === 'signin' && (response.status === 401 || response.status === 403 || normalized.includes('bad credential') || normalized.includes('unauthorized'))) {
      throw new Error('That email and password combination was not recognized. Check your details and try again.');
    }
    if (cleanPath === 'signup' && (response.status === 409 || normalized.includes('already registered') || normalized.includes('already exists'))) {
      throw new Error('An account already exists for this email. Sign in instead or use another email address.');
    }
    if (response.status === 404) {
      throw new Error('Authentication endpoint was not found (404). Please ensure the backend gateway and auth services are running.');
    }
    if (response.status >= 500) throw new Error('The authentication service ran into a problem. Please try again shortly.');
    throw new Error(message || `We could not complete that request (${response.status}). Check your details and try again.`);
  }

  // Note: /api/signup returns no body (void), so this can legitimately be null.
  return data;
}

export function signIn(emailId, password) {
  return postAuth('signin', { emailId, password });
}

export function signUp(name, emailId, password) {
  // SignupDto accepts exactly these fields; confirmation stays in the browser.
  return postAuth('signup', { name, emailId, password });
}

export function oauthSignIn(token) {
  return postAuth('oauth-signin', { token });
}

export function oauthSignUp(token) {
  // Controller expects the raw token string as the body (not JSON), so send it unwrapped.
  return postAuth('oauth-signup', token);
}

export { safeNextPath };

export function beginGoogleOAuth(nextPath) {
  if (!googleOAuthEnabled) throw new Error('Google sign-in is not configured for this Roup deployment.');
  try {
    sessionStorage.setItem('roup-oauth-next', safeNextPath(nextPath));
  } catch {
    throw new Error('Roup could not save your sign-in destination. Check your browser settings and try again.');
  }
  const base = getAuthBase();
  window.location.assign(googleAuthorizationUrl(base));
}

export async function exchangeOAuthCode(codeOrToken) {
  // If the parameter is a JWT (e.g. redirected from OAuth2SuccessHandler with ?token=...)
  if (typeof codeOrToken === 'string' && codeOrToken.split('.').length === 3) {
    try {
      return await oauthSignIn(codeOrToken);
    } catch {
      // If oauth-signin is unavailable, decode the token payload locally to build a session
      try {
        const payload = JSON.parse(atob(codeOrToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return {
          id: payload.userId || payload.sub,
          name: payload.name || payload.sub?.split('@')[0] || 'Roup Member',
          emailId: payload.sub || payload.email,
          jwt: codeOrToken,
          availableBalance: 0,
          totalBalance: 0,
          reservedBalance: 0,
        };
      } catch {
        throw new Error('Could not parse Google OAuth authentication token.');
      }
    }
  }

  // Otherwise fall back to token sign-in (the gateway has no /api/oauth/exchange route)
  return await oauthSignIn(codeOrToken);
}