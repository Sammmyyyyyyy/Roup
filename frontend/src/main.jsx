import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import AuthPages from './pages/AuthPages.jsx';
import { AuthContext, NavigationContext, ThemeContext } from './store/appContext.js';
import ExplorePage from './pages/ExplorePage.jsx';
import { AuctionsPage, ListingsPage, MarketsPage, OrdersPage, WatchlistPage } from './pages/MarketplacePages.jsx';
import LandingPage from './pages/LandingPage.jsx';
import OAuthSuccessPage from './pages/OAuthSuccessPage.jsx';
import './styles/theme.css';
import './styles/readability.css';

function readSession() {
  try {
    const saved = sessionStorage.getItem('roup-auth-session');
    if (!saved) return null;
    const session = JSON.parse(saved);
    const payload = JSON.parse(atob(session.jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem('roup-auth-session');
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem('roup-auth-session');
    return null;
  }
}

function App() {
  const [path, setPath] = useState(`${window.location.pathname}${window.location.search}`);
  const [session, setSession] = useState(readSession);
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    try { localStorage.removeItem('roup-frontend-demo-v1'); } catch { /* Legacy marketplace data is never used by the app. */ }
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(`${window.location.pathname}${window.location.search}`);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'light' ? '#f7f9f7' : '#070b09';
    try { localStorage.setItem('roup-theme', theme); } catch { /* Theme still applies for this visit. */ }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => {
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    return next;
  });

  const navigate = (to, options = {}) => {
    if (options.replace) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPath(`${window.location.pathname}${window.location.search}`);
    if (options.notice) setNotice(options.notice);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  };

  const currentPath = window.location.pathname;
  const isProtectedPath = ['/explore', '/markets', '/auctions', '/orders', '/listings', '/watchlist'].includes(currentPath) || currentPath.startsWith('/markets/') || currentPath.startsWith('/auctions/');

  useEffect(() => {
    if (isProtectedPath && !session) {
      const destination = `${window.location.pathname}${window.location.search}`;
      navigate(`/login?next=${encodeURIComponent(destination)}`, { replace: true });
    }
  }, [path, session]);

  const authenticate = (user) => {
    const { jwt, ...profile } = user;
    const nextSession = { user: profile, jwt };
    sessionStorage.setItem('roup-auth-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const updateUser = (patch) => {
    setSession((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev.user, ...patch };
      const nextSession = { ...prev, user: nextUser };
      sessionStorage.setItem('roup-auth-session', JSON.stringify(nextSession));
      return nextSession;
    });
  };

  const signOut = () => {
    try { sessionStorage.removeItem('roup-auth-session'); } catch { /* Clear the in-memory session regardless. */ }
    setSession(null);
  };

  const auth = { session, authenticate, signOut, updateUser };
  const authPath = currentPath === '/login' || currentPath === '/signup' || (isProtectedPath && !session);
  const protectedPage = currentPath === '/explore' ? <ExplorePage />
    : currentPath === '/markets' || currentPath.startsWith('/markets/') ? <MarketsPage path={currentPath} />
      : currentPath === '/auctions' || currentPath.startsWith('/auctions/') ? <AuctionsPage path={currentPath} />
        : currentPath === '/watchlist' ? <WatchlistPage />
        : currentPath === '/orders' ? <OrdersPage />
          : currentPath === '/listings' ? <ListingsPage /> : null;

  return <ThemeContext.Provider value={{ theme, toggleTheme }}><AuthContext.Provider value={auth}><NavigationContext.Provider value={navigate}>
    {currentPath === '/oauth-success' ? <OAuthSuccessPage /> : authPath ? <AuthPages path={isProtectedPath ? '/login' : currentPath} /> : protectedPage || <LandingPage session={session} notice={notice} onDismissNotice={() => setNotice('')} />}
  </NavigationContext.Provider></AuthContext.Provider></ThemeContext.Provider>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
