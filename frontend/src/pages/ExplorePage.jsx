import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../store/appContext.js';
import AppShell from '../components/layout/AppShell.jsx';
import { getMarkets } from '../api/marketplaceService.js';
import '../styles/marketplacePages.css';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const load = async () => {
    setStatus('loading'); setError('');
    try { const result = await getMarkets(); setMarkets(Array.isArray(result) ? result : []); setStatus('ready'); }
    catch (e) { setError(e.message); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => markets.filter((market) => `${market.assetName || ''} ${market.assetDescription || ''} ${market.assetId || ''}`.toLowerCase().includes(query.toLowerCase())), [markets, query]);
  return <AppShell currentPath="/explore" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search available markets…" pageClass="marketplace-route-content">
    <div className="mp-page"><header className="mp-heading"><div><p className="mp-eyebrow">ROUp MARKETPLACE</p><h1>Explore markets</h1><p>Active market configuration returned by the Roup backend.</p></div><button className="mp-button mp-button-secondary" onClick={load}>Refresh</button></header>
      {status === 'loading' && <p role="status">Loading markets…</p>}
      {status === 'error' && <div role="alert"><p>Markets are unavailable: {error}</p><button className="mp-button mp-button-secondary" onClick={load}>Try again</button></div>}
      {status === 'ready' && !visible.length && <p role="status">{markets.length ? 'No markets match this search.' : 'There are no active markets.'}</p>}
      {status === 'ready' && visible.length > 0 && <div className="mp-market-cards">{visible.map((market) => <article className="mp-panel" key={market.assetId}><div className="mp-panel-heading"><div><h2>{market.assetName || 'Unnamed asset'}</h2><p>{market.assetDescription || 'No description supplied.'}</p></div><span>{market.isTradingActive ? 'Trading active' : 'Trading inactive'}</span></div><div className="mp-detail-pairs"><span>Asset ID <b>{market.assetId}</b></span><span>Face value <b>{market.originalFaceValue ?? 'Unavailable'}</b></span><span>Resale cap <b>{market.maximumResalePrice ?? 'Unavailable'}</b></span><span>Original quantity <b>{market.totalOriginalQuantity ?? 'Unavailable'}</b></span></div><button className="mp-button mp-button-primary" onClick={() => navigate(`/markets/${encodeURIComponent(market.assetId)}`)}>View market</button></article>)}</div>}
    </div>
  </AppShell>;
}
