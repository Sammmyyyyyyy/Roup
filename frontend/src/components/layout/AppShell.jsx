import React, { useEffect, useRef, useState } from 'react';
import { useAuth, useNavigate } from '../../store/appContext.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const iconPaths = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7 4.7-2.3Z" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-7" /></>,
  hammer: <><path d="m14 6 4 4M7 17l8-8m-4-3 6 6M5 19l3-3m8-11 3-3 4 4-3 3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6m-6 4h6m-6 4h3" /></>,
  tag: <><path d="M20 13 12 21 3 12V4h8l9 9Z" /><circle cx="7.5" cy="8" r="1" /></>,
  bookmark: <><path d="M6 4h12v17l-6-4-6 4V4Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.3 4.3" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

export function AppIcon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name] || iconPaths.chart}</svg>;
}

function Brand() {
  return <a className="brand explore-brand" href="/" aria-label="Roup home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>roup<span className="brand-dot">.</span></span></a>;
}

function SideNav({ mobileOpen, closeMobile, currentPath }) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const items = [
    ['Explore', 'compass', '/explore'],
    ['Markets', 'chart', '/markets'],
    ['Auctions', 'hammer', '/auctions'],
    ['Watchlist', 'bookmark', '/watchlist'],
    ['My Orders', 'receipt', '/orders'],
    ['My Listings', 'tag', '/listings'],
  ];
  const go = (href) => { closeMobile(); navigate(href); };
  return <>
    {mobileOpen && <button className="explore-scrim" type="button" aria-label="Close navigation" onClick={closeMobile} />}
    <aside className={`explore-sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="Marketplace navigation">
      <div className="explore-side-top"><Brand /><span className="sidebar-product-label">SECONDARY MARKETPLACE</span></div>
      <nav className="explore-side-nav" aria-label="Marketplace sections"><span className="side-nav-label">DISCOVER</span>
        {items.map(([label, icon, href]) => {
          const active = currentPath === href || (href === '/markets' && currentPath.startsWith('/markets/')) || (href === '/auctions' && currentPath.startsWith('/auctions/'));
          return <a key={href} className={`side-nav-item${active ? ' is-active' : ''}`} href={href} aria-current={active ? 'page' : undefined} onClick={(event) => { event.preventDefault(); go(href); }}><AppIcon name={icon} /><span>{label}</span>{active && <i aria-hidden="true" />}</a>;
        })}
      </nav>
      <div className="explore-sidebar-bottom"><div className="side-session-note"><span className="session-dot" /><span>Signed in as<br /><b>{session?.user?.name || session?.user?.emailId || 'Roup member'}</b></span></div>
        <ThemeToggle />
        <button className="side-signout" type="button" onClick={() => { signOut(); navigate('/'); }}><span>Log Out</span></button>
        <span className="sidebar-legal">Roup Exchange · Marketplace</span>
      </div>
    </aside>
  </>;
}

function UserMenu() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const user = session?.user;
  useEffect(() => {
    const close = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <div className="user-menu-wrap" ref={ref}>
    <button className="user-menu-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="user-avatar"><i>{(user?.name || user?.emailId || 'R').trim().charAt(0).toUpperCase()}</i></span><span className="user-menu-name"><b>{user?.name || 'Roup member'}</b><small>{user?.emailId}</small></span><AppIcon name="chevron" size={15} /></button>
    {open && <div className="user-dropdown" role="menu"><div className="dropdown-identity"><b>{user?.name || 'Roup member'}</b><span>{user?.emailId}</span></div><button type="button" role="menuitem" onClick={() => { setOpen(false); signOut(); navigate('/'); }}>Log Out</button></div>}
  </div>;
}

export default function AppShell({ children, currentPath, searchValue = '', onSearchChange, searchPlaceholder = 'Search the marketplace…', pageClass = '' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  return <div className="explore-page">
    <SideNav mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} currentPath={currentPath} />
    <div className="explore-app-main">
      <header className="explore-topbar">
        <button className="mobile-drawer-trigger" type="button" aria-label="Open marketplace navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><AppIcon name="menu" /></button>
        {onSearchChange && <label className="market-search"><AppIcon name="search" size={17} /><span className="visually-hidden">Search</span><input type="search" placeholder={searchPlaceholder} value={searchValue} onChange={(event) => onSearchChange(event.target.value)} /><kbd>/</kbd></label>}
        <UserMenu />
      </header>
      <main className={`app-page-content ${pageClass}`}>{children}</main>
    </div>
  </div>;
}
