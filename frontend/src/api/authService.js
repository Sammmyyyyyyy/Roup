import { googleAuthorizationUrl, safeNextPath } from './oauthNavigation.js';

const configuredBase = (import.meta.env.VITE_AUTH_API_BASE_URL||"http://localhost:8080" || '').trim().replace(/\/$/, '');
export const googleOAuthEnabled = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === 'true';

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

export function oauthSignIn(token) {
  return postAuth('oauth-signin', { token });
}

export function oauthSignUp(token) {
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
  window.location.assign(googleAuthorizationUrl(configuredBase));
}

export async function exchangeOAuthCode(codeOrToken) {
  // If the parameter is a JWT token (e.g. redirected from OAuth2SuccessHandler with ?token=...)
  if (typeof codeOrToken === 'string' && codeOrToken.split('.').length === 3) {
    try {
      return await oauthSignIn(codeOrToken);
    } catch {
      // If oauth-signin endpoint is unavailable, decode the token payload locally to provide session
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

  // Otherwise, attempt code exchange or token signin fallback
  try {
    return await postAuth('oauth/exchange', { code: codeOrToken });
  } catch {
    return await oauthSignIn(codeOrToken);
  }
}
