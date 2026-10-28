import React, { useEffect, useState } from 'react';
import { useAuth, useNavigate } from '../store/appContext.js';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import { beginGoogleOAuth, googleOAuthEnabled, safeNextPath, signIn, signUp } from '../api/authService.js';
import '../styles/auth.css';

function BrandMark() {
  return <a className="auth-brand" href="/" aria-label="Roup home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>roup<span>.</span></span></a>;
}

function PasswordField({ id, label, value, onChange, error, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="auth-password-wrap">
      <input id={id} name={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      <button className="password-toggle" type="button" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button>
    </div>
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>;
}

function EmailField({ value, onChange, error }) {
  return <div className="auth-field">
    <label htmlFor="emailId">Email address</label>
    <input id="emailId" name="emailId" type="email" inputMode="email" autoComplete="email" value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? 'emailId-error' : undefined} />
    {error && <p className="field-error" id="emailId-error">{error}</p>}
  </div>;
}

function AuthArtwork() {
  return <aside className="auth-art" aria-label="Roup exchange preview illustration">
    <div className="auth-art-glow" />
    <div className="auth-art-orbit orbit-one" /><div className="auth-art-orbit orbit-two" />
    <div className="auth-ticket"><span>ROUP EXCHANGE</span><div className="auth-ticket-rings"><b>R</b></div><strong>THE<br />NEXT<br />MOMENT</strong><small>MARKETPLACE ACCESS</small></div>
    <div className="auth-market-card"><div><span>MARKETPLACE</span></div><p>Market data is loaded from Roup services after sign in.</p></div>
    <div className="auth-art-caption"><span className="mint-dot" /> A marketplace for the moments that matter</div>
  </aside>;
}

function GoogleMark() {
  return <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.38 38.02 46.98 31.9 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

function GoogleSignIn({ nextPath, onError }) {
  const [starting, setStarting] = useState(false);
  const start = () => {
    if (!googleOAuthEnabled || starting) return;
    setStarting(true);
    try { beginGoogleOAuth(nextPath); }
    catch (error) { setStarting(false); onError(error.message); }
  };
  return <div className="auth-provider-section">
    <button className="google-button" type="button" onClick={start} disabled={!googleOAuthEnabled || starting} aria-label={googleOAuthEnabled ? 'Continue with Google' : 'Google sign-in unavailable'}><GoogleMark />{starting ? 'Connecting to Google…' : googleOAuthEnabled ? 'Continue with Google' : 'Google sign-in unavailable'}</button>
    {!googleOAuthEnabled && <p className="oauth-unavailable-note">Google sign-in isn’t configured for this Roup deployment.</p>}
    <div className="auth-divider" aria-hidden="true">OR</div>
  </div>;
}

function AuthFrame({ children, mode }) {
  const navigate = useNavigate();
  return <main className="auth-page">
    <header className="auth-header"><BrandMark /><div className="auth-header-actions"><ThemeToggle /><a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Back to Roup <span aria-hidden="true">↗</span></a></div></header>
    <div className="auth-layout"><section className="auth-form-side">{children}</section><AuthArtwork /></div>
    <footer className="auth-footer"><span>© 2026 Roup Exchange</span><span>{mode === 'login' ? 'A clearer view of every side of the trade.' : 'Built around transparent trading rules.'}</span></footer>
  </main>;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function LoginPage() {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState(() => new URLSearchParams(window.location.search).get('oauth') === 'failed' ? 'Google sign-in was not completed. You can try again or use your email and password.' : '');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    const nextErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) nextErrors.email = 'Enter your email address.';
    else if (!validateEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password.trim()) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const user = await signIn(normalizedEmail, password);
      if (!user?.jwt) throw new Error('Roup signed you in but did not return the session token expected by the API. Please contact support.');
      authenticate(user);
      setComplete(true);
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const destination = safeNextPath(requestedPath);
      navigate(destination);
    } catch (error) {
      setRequestError(error.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthFrame mode="login"><div className="auth-intro"><p className="eyebrow">WELCOME BACK</p><h1>Welcome Back<br /><span>to Roup.</span></h1><p>Sign in to explore markets, manage your orders, and keep track of your trading activity.</p></div>
    {new URLSearchParams(window.location.search).has('registered') && <div className="auth-feedback success" role="status">Your account is ready. Sign in with the email and password you registered.</div>}
    {complete && <div className="auth-feedback success" role="status">You’re signed in. Returning to Roup…</div>}
    {requestError && <div className="auth-feedback error" role="alert">{requestError}</div>}
    <GoogleSignIn nextPath={safeNextPath(new URLSearchParams(window.location.search).get('next'))} onError={setRequestError} />
    <form className="auth-form" onSubmit={submit} noValidate>
      <EmailField value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: '' })); }} error={errors.email} />
      <PasswordField id="password" label="Password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: '' })); }} error={errors.password} autoComplete="current-password" />
      <button className="auth-submit" type="submit" disabled={loading}>{loading ? <><span className="auth-spinner" />Signing in…</> : <>Sign In <span aria-hidden="true">→</span></>}</button>
    </form>
    <p className="auth-switch">New to Roup? <a href={`/signup?next=${encodeURIComponent(new URLSearchParams(window.location.search).get('next') || '/explore')}`} onClick={(event) => { event.preventDefault(); navigate(`/signup?next=${encodeURIComponent(new URLSearchParams(window.location.search).get('next') || '/explore')}`); }}>Create an Account</a></p>
  </AuthFrame>;
}

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const requestedPath = new URLSearchParams(window.location.search).get('next');
  const safeNext = safeNextPath(requestedPath);
  const postSignupPath = `/login?next=${encodeURIComponent(safeNext)}`;

  const submit = async (event) => {
    event.preventDefault();
    if (loading || created) return;
    const nextErrors = {};
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName) nextErrors.name = 'Enter your name.';
    if (!normalizedEmail) nextErrors.email = 'Enter your email address.';
    else if (!validateEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password.trim()) nextErrors.password = 'Choose a password.';
    if (!confirmation) nextErrors.confirmation = 'Confirm your password.';
    else if (password !== confirmation) nextErrors.confirmation = 'The passwords do not match.';
    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await signUp(normalizedName, normalizedEmail, password);
      setCreated(true);
    } catch (error) {
      setRequestError(error.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthFrame mode="signup"><div className="auth-intro"><p className="eyebrow">A MARKET FOR YOUR NEXT MOMENT</p><h1>Create Your<br /><span>Roup Account.</span></h1><p>Join Roup and discover a marketplace built around transparent trading, clearer pricing, and accountable transactions.</p></div>
    {created && <div className="auth-feedback success" role="status">Your account has been created. The service doesn’t sign you in automatically; continue to sign in with your new account.</div>}
    {requestError && <div className="auth-feedback error" role="alert">{requestError}</div>}
    <GoogleSignIn nextPath={safeNext} onError={setRequestError} />
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-field"><label htmlFor="fullName">Full name</label><input id="fullName" name="name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: '' })); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'fullName-error' : undefined} />{errors.name && <p className="field-error" id="fullName-error">{errors.name}</p>}</div>
      <EmailField value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: '' })); }} error={errors.email} />
      <PasswordField id="newPassword" label="Password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: '' })); }} error={errors.password} autoComplete="new-password" />
      <PasswordField id="confirmPassword" label="Confirm password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setErrors((current) => ({ ...current, confirmation: '' })); }} error={errors.confirmation} autoComplete="new-password" />
      <p className="password-hint">Choose a password you don’t use elsewhere.</p>
      <button className="auth-submit" type="submit" disabled={loading || created}>{loading ? <><span className="auth-spinner" />Creating account…</> : created ? <>Account created <span aria-hidden="true">✓</span></> : <>Create Account <span aria-hidden="true">→</span></>}</button>
    </form>
    <p className="auth-switch">Already have an account? <a href={postSignupPath} onClick={(event) => { event.preventDefault(); navigate(postSignupPath); }}>Sign In</a></p>
  </AuthFrame>;
}

export default function AuthPages({ path }) {
  useEffect(() => {
    document.title = path === '/signup' ? 'Create Your Account | Roup' : 'Sign In | Roup';
    return () => { document.title = 'Roup — Rare Passes. Real Markets. Fairer Trades.'; };
  }, [path]);
  return path === '/signup' ? <SignupPage /> : <LoginPage />;
}
