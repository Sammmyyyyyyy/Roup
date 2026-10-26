import React from 'react';
import { useTheme } from './appContext.js';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const targetTheme = theme === 'dark' ? 'light' : 'dark';
  return <button className={`theme-toggle${compact ? ' theme-toggle-compact' : ''}`} type="button" onClick={toggleTheme} aria-label={`Switch to ${targetTheme} mode`} aria-pressed={theme === 'light'} title={`Switch to ${targetTheme} mode`}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></> : <><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.7 8.7 0 1 0 20.5 15.2Z" /><path d="M16.5 3v3m-1.5-1.5h3" /></>}
    </svg>
    <span>{theme === 'dark' ? 'Day' : 'Night'}</span>
  </button>;
}
