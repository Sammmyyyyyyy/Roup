import React, { useEffect, useRef, useState } from 'react';
import { exchangeOAuthCode, safeNextPath } from '../api/authService.js';
import { useAuth, useNavigate } from '../store/appContext.js';
import '../styles/auth.css';

export default function OAuthSuccessPage() {
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const callbackUrl = new URL(window.location.href);
    const token = callbackUrl.searchParams.get('token');
    const code = callbackUrl.searchParams.get('code');
    const codeOrToken = token || code;

    window.history.replaceState({}, '', `${callbackUrl.pathname}${callbackUrl.hash}`);

    let next = '/explore';
    try {
      next = safeNextPath(sessionStorage.getItem('roup-oauth-next') || '/explore');
      sessionStorage.removeItem('roup-oauth-next');
    } catch { /* Fall back to the marketplace when browser storage is unavailable. */ }

    if (!codeOrToken) {
      setError('Roup did not receive a sign-in token or code. Please try Google sign-in again.');
      return;
    }

    exchangeOAuthCode(codeOrToken).then((user) => {
      if (!user?.jwt || (!user?.id && !user?.emailId)) {
        throw new Error('Roup could not establish the expected account session. Please try again.');
      }
      authenticate(user);
      navigate(next, { replace: true });
    }).catch((cause) => {
      setError(cause.message || 'Google sign-in could not be completed. Please try again.');
    });
  }, [authenticate, navigate]);

  return <main className="oauth-callback-page"><div className="oauth-callback-card" role={error ? 'alert' : 'status'}>
    {!error ? <><span className="auth-spinner" /><h1>Completing sign-in</h1><p>Connecting your Roup account…</p></> : <><span className="oauth-callback-mark" aria-hidden="true">!</span><h1>Sign-in didn’t finish</h1><p>{error}</p><a className="auth-submit" href="/login">Return to sign in <span aria-hidden="true">→</span></a></>}
  </div></main>;
}
