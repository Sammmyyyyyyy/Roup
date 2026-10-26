import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell, { AppIcon } from './AppShell.jsx';
import { useAuth, useNavigate } from './appContext.js';
import { createListing, getMarketSummary, getMyListings, getOrders, setListingStatus, updateListing } from './marketplaceApi.js';
import { auctionPriceMetrics, demoAuctions, demoMarkets, findDemoAuction, formatDemoPrice, marketSpread } from './marketplaceDemoData.js';
import './marketplacePages.css';

const money = (value) => value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value));
const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const errorText = (error) => error?.message || 'Something went wrong. Try again.';
const safeDecode = (value) => { try { return decodeURIComponent(value); } catch { return ''; } };

function PageHeading({ eyebrow, title, description, actions }) {
  return <div className="mp-heading"><div><p className="mp-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="mp-heading-actions">{actions}</div>}</div>;
}

function StatePanel({ kind = 'empty', title, children, onRetry }) {
  return <div className={`mp-state mp-state-${kind}`} role={kind === 'error' ? 'alert' : 'status'}><span className="mp-state-mark"><AppIcon name={kind === 'error' ? 'chart' : 'receipt'} size={20} /></span><b>{title}</b><div className="mp-state-copy">{children}</div>{onRetry && <button className="mp-button mp-button-secondary" type="button" onClick={onRetry}>Try again</button>}</div>;
}

function useLoad(loader, token, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await loader(token);
      setState({ data, loading: false, error: '' });
    } catch (error) { setState({ data: null, loading: false, error: errorText(error) }); }
  }, [loader, token, ...dependencies]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

export function MarketsPage({ path = '/markets' }) {
  const navigate = useNavigate();
  const detailId = path.startsWith('/markets/') ? safeDecode(path.slice('/markets/'.length)) : '';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [savedIds, setSavedIds] = useState(() => { try { return JSON.parse(sessionStorage.getItem('roup-market-demo-watchlist') || '[]'); } catch { return []; } });
  useEffect(() => { try { sessionStorage.setItem('roup-market-demo-watchlist', JSON.stringify(savedIds)); } catch { /* Local demo watchlist stays in memory. */ } }, [savedIds]);
  const items = useMemo(() => {
    const values = demoMarkets.filter((item) => {
      const haystack = `${item.itemName} ${item.eventName} ${item.category}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase()) && (category === 'all' || item.category === category);
    });
    return values.sort((a, b) => sort === 'price-low' ? Number(a.askingPrice) - Number(b.askingPrice) : sort === 'price-high' ? Number(b.askingPrice) - Number(a.askingPrice) : a.itemName.localeCompare(b.itemName));
  }, [query, category, sort]);
  const categories = [...new Set(demoMarkets.map((item) => item.category))].sort();
  const selectedMarket = demoMarkets.find((item) => item.id === detailId);

  return <AppShell currentPath="/markets" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search markets and events..." pageClass="marketplace-route-content">
    <div className="mp-page">
      {detailId ? <>
        <button className="mp-back" type="button" onClick={() => navigate('/markets')}>← All markets</button>
        {selectedMarket ? <MarketDetail item={selectedMarket} saved={savedIds.includes(selectedMarket.id)} onSave={() => setSavedIds((ids) => ids.includes(selectedMarket.id) ? ids.filter((id) => id !== selectedMarket.id) : [...ids, selectedMarket.id])} /> : <StatePanel title="Market not found"><button className="mp-button mp-button-secondary" type="button" onClick={() => navigate('/markets')}>Back to Markets</button></StatePanel>}
      </> : <>
        <PageHeading eyebrow="ILLUSTRATIVE MARKET DATA" title="A Clearer View of Every Market." description="Compare example listings and see how bid, ask, and spread information fits together. These local examples are not live exchange activity." />
        <div className="mp-metrics">
          <Metric label="Example markets" value={demoMarkets.length} detail="Local illustrative catalogue" />
          <Metric label="Example order books" value={demoMarkets.filter((item) => item.orderBook).length} detail="Fixed demo levels only" />
          <Metric label="Live market feed" value="Not connected" detail="No real orders or trades shown" />
        </div>
        <div className="mp-panel mp-market-panel">
          <div className="mp-panel-heading"><div><h2>Markets</h2><p>{items.length} example result{items.length === 1 ? '' : 's'}</p></div><label className="mp-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="mp-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Item name</option><option value="price-low">Asking price: low</option><option value="price-high">Asking price: high</option></select></label></div>
          {!items.length ? <StatePanel title="No markets match those filters">Clear the search or choose another category.</StatePanel> : <div className="mp-market-cards">{items.map((item) => <MarketCard key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => setSavedIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} onView={() => navigate(`/markets/${encodeURIComponent(item.id)}`)} />)}</div>}
          <p className="mp-disclosure">All prices and order levels are frontend-only examples. No live order book, trade history, seller activity, or checkout is connected.</p>
        </div>
      </>}
    </div>
  </AppShell>;
}

function MarketDetail({ item, saved, onSave }) {
  const spread = marketSpread(item);
  return <div className="mp-market-detail"><p className="mp-eyebrow">ILLUSTRATIVE MARKET · {item.category}</p><h1>{item.itemName}</h1><p className="mp-lead">{item.eventName} · Local demo listing and market example.</p><MarketCard item={item} saved={saved} onSave={onSave} onView={() => {}} showDetailsLink={false} />
    <div className="mp-panel mp-detail-panel"><h2>Market data notes</h2><p>Original face value and listing ask describe this example listing. Best bid and best ask appear only where this local sample includes an order book.</p>{spread ? <p>Example spread: <b>{formatDemoPrice(spread.spread)} · {spread.percent.toFixed(2)}%</b>. This is calculated from the sample bid and ask shown above.</p> : <p>No bid or ask sample is configured for this item.</p>}<span className="mp-status-tag">Demo only · no order entry</span></div>
  </div>;
}

function DemoArtwork({ item, large = false }) {
  const title = item.itemName || item.name;
  const event = item.eventName || item.event;
  const initials = title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return <div className={`mp-artwork art-${item.art || 'custom'}${large ? ' mp-artwork-large' : ''}`} role="img" aria-label={`Illustrative ${item.category} artwork for ${title}`}><span className="mp-art-kicker">ROUP EXAMPLE <i>·</i> {item.category.toUpperCase()}</span><span className="mp-art-ring"><b>{initials}</b><i /><i /></span><strong>{event.split(/[: ]/).filter(Boolean).slice(0, 2).join('\n').toUpperCase()}</strong><small>{title.toUpperCase()}</small></div>;
}

function MarketCard({ item, saved, onSave, onView, showDetailsLink = true }) {
  const book = item.orderBook;
  const spread = marketSpread(item);
  const hasBook = Boolean(book);
  const bids = book?.bids || [];
  const asks = book?.asks || [];
  const maxQty = Math.max(1, ...bids.map((level) => level.quantity), ...asks.map((level) => level.quantity));
  return <article className="mp-trading-card">
    <div className="mp-trading-art"><DemoArtwork item={item} /><span className="mp-demo-stamp">DEMO DATA</span></div>
    <div className="mp-trading-info"><span className="mp-market-category">{item.category}</span><h3>{item.itemName}</h3><p className="mp-market-event">{item.eventName}</p>{item.description && <p className="mp-market-description">{item.description}</p>}<div className="mp-market-facts"><div><span>ORIGINAL FACE VALUE</span><b>{formatDemoPrice(item.faceValue)}</b></div><div><span>AVAILABLE QTY</span><b>{item.quantity}</b></div><div><span>STATUS</span><b className="mp-market-active">{item.status}</b></div></div><p className="mp-market-listing-ask"><span>THIS LISTING'S ASK</span><b>{formatDemoPrice(item.askingPrice)}</b></p></div>
    <aside className="mp-trading-metrics" aria-label={`${item.itemName} illustrative market metrics`}>
      <div className="mp-trading-head"><span>ILLUSTRATIVE ORDER BOOK</span><i><b /> DEMO</i></div>
      <div className="mp-best-pair">
        <div><span className="mp-bid-label"><b>↘</b> BEST BID</span><strong>{hasBook ? (item.bestBid == null ? 'No bids' : formatDemoPrice(item.bestBid)) : 'Unavailable'}</strong><small>Highest buyer offer</small></div>
        <div><span className="mp-ask-label"><b>↗</b> BEST ASK</span><strong>{hasBook ? (item.bestAsk == null ? 'No asks' : formatDemoPrice(item.bestAsk)) : 'Unavailable'}</strong><small>Lowest seller offer</small></div>
      </div>
      <div className="mp-spread-wrap"><div><span>BID–ASK SPREAD</span><b>{spread ? `${formatDemoPrice(spread.spread)} · ${spread.percent.toFixed(2)}%` : 'Unavailable'}</b></div><div className={`mp-spread-track${spread ? '' : ' is-empty'}`} aria-label={spread ? `Bid ${formatDemoPrice(spread.bid)} to ask ${formatDemoPrice(spread.ask)}` : 'Bid and ask spread unavailable'}><span className="mp-spread-bid" /><span className="mp-spread-ask" /></div><div className="mp-spread-labels"><span>{spread ? `${formatDemoPrice(spread.bid)} Bid` : 'Bid unavailable'}</span><span>{spread ? `${formatDemoPrice(spread.ask)} Ask` : 'Ask unavailable'}</span></div></div>
      {hasBook && (bids.length + asks.length > 0) ? <div className="mp-depth-preview"><span>DEMO DEPTH · QTY</span><div>{[...bids.slice(0, 3).map((level) => ({ ...level, side: 'bid' })), ...asks.slice(0, 3).map((level) => ({ ...level, side: 'ask' }))].map((level) => <div className={`mp-depth-row ${level.side}`} key={`${level.side}-${level.price}`} title={`${level.side === 'bid' ? 'Bid' : 'Ask'} ${formatDemoPrice(level.price)} · quantity ${level.quantity}`}><span>{formatDemoPrice(level.price)}</span><i style={{ width: `${level.quantity / maxQty * 100}%` }} /><b>{level.quantity}</b></div>)}</div></div> : <p className="mp-depth-unavailable">No example depth levels configured.</p>}
      <div className="mp-market-actions">{showDetailsLink && <button className="mp-button mp-button-primary" type="button" onClick={onView}>View Market <span aria-hidden="true">↗</span></button>}<button className={`mp-watch-button${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={onSave}><AppIcon name="bookmark" size={15} />{saved ? 'Saved' : 'Watchlist'}</button></div>
    </aside>
  </article>;
}

function AuctionCard({ auction, onView }) {
  const metrics = auctionPriceMetrics(auction);
  const displayPrice = auction.status === 'ACTIVE' ? auction.currentPrice : auction.status === 'ENDED' ? auction.finalPrice : null;
  return <article className="mp-auction-card">
    <div className="mp-auction-art-wrap"><DemoArtwork item={auction} /><span className={`mp-auction-status status-${auction.status.toLowerCase()}`}>{auction.status}</span><span className="mp-auction-id">{auction.id}</span></div>
    <div className="mp-auction-card-body"><div className="mp-auction-category">{auction.category} <i>· DEMO</i></div><h2>{auction.itemName}</h2><p className="mp-auction-event">{auction.eventName}</p><p className="mp-auction-description">{auction.description}</p>
      <div className="mp-auction-prices"><div><span>FACE VALUE</span><b>{formatDemoPrice(auction.faceValue)}</b></div><div><span>STARTING PRICE</span><b>{formatDemoPrice(auction.startingPrice)}</b></div><div><span>{auction.status === 'ENDED' ? 'FINAL PRICE' : auction.status === 'ACTIVE' ? 'CURRENT PRICE' : 'FLOOR PRICE'}</span><b>{formatDemoPrice(displayPrice ?? auction.floorPrice)}</b></div></div>
      <div className="mp-auction-progress-label"><span>PRICE DECAY</span><b>{metrics ? `${metrics.reductionPercent.toFixed(1)}% from start` : auction.status === 'UPCOMING' ? 'Not started' : 'Unavailable'}</b></div><div className="mp-auction-progress"><i style={{ width: `${metrics?.progress || 0}%` }} /></div>
      <div className="mp-auction-card-foot"><span>{auction.status === 'ACTIVE' ? `Remaining · ${auction.timingLabel}` : auction.status === 'UPCOMING' ? `Starts · ${auction.startsLabel}` : `Ended · ${auction.endsLabel}`}</span><span>{auction.quantity} available</span></div>
      <button className="mp-button mp-button-primary mp-view-auction" type="button" onClick={onView}>View Auction <span aria-hidden="true">↗</span></button>
    </div>
  </article>;
}

function AuctionPriceChart({ auction }) {
  const points = auction.schedule;
  const width = 720; const height = 270; const left = 54; const right = 24; const top = 28; const bottom = 42;
  const minMinute = Math.min(...points.map((point) => point.minute));
  const maxMinute = Math.max(...points.map((point) => point.minute));
  const minPrice = Math.min(...points.map((point) => point.price));
  const maxPrice = Math.max(...points.map((point) => point.price));
  const x = (minute) => left + (minute - minMinute) / Math.max(1, maxMinute - minMinute) * (width - left - right);
  const y = (price) => top + (maxPrice - price) / Math.max(1, maxPrice - minPrice) * (height - top - bottom);
  const line = points.map((point) => `${x(point.minute)},${y(point.price)}`).join(' ');
  const area = `${left},${height - bottom} ${line} ${width - right},${height - bottom}`;
  const markerPrice = auction.status === 'ACTIVE' ? auction.currentPrice : auction.status === 'ENDED' ? auction.finalPrice : null;
  const markerPoint = markerPrice == null ? null : points.reduce((nearest, point) => Math.abs(point.price - markerPrice) < Math.abs(nearest.price - markerPrice) ? point : nearest, points[0]);
  return <div className="mp-auction-chart" role="img" aria-label={`Configured price schedule from ${formatDemoPrice(auction.startingPrice)} down to ${formatDemoPrice(auction.floorPrice)} over ${maxMinute} minutes${markerPrice == null ? '' : `, ${auction.status.toLowerCase()} example price ${formatDemoPrice(markerPrice)}`}`}>
    <div className="mp-chart-head"><div><span className="mp-eyebrow">PRICE DECAY</span><b>Configured schedule</b></div><span className="mp-chart-demo"><i /> LOCAL DEMO</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="auctionDemoFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--mint)" stopOpacity=".24" /><stop offset="1" stopColor="var(--mint)" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3].map((index) => { const gy = top + index * (height - top - bottom) / 3; return <g key={index}><line x1={left} y1={gy} x2={width - right} y2={gy} className="mp-chart-gridline" /><text x={left - 10} y={gy + 4} textAnchor="end" className="mp-chart-label">{formatDemoPrice(maxPrice - index * (maxPrice - minPrice) / 3)}</text></g>; })}
      <polygon points={area} fill="url(#auctionDemoFill)" /><polyline points={line} className="mp-chart-line" />
      {points.map((point) => <g key={point.minute}><circle cx={x(point.minute)} cy={y(point.price)} r="4" className="mp-chart-point" /><title>{point.minute === 0 ? 'Start' : `+${point.minute} minutes`}: {formatDemoPrice(point.price)}</title></g>)}
      {markerPoint && <g><line x1={x(markerPoint.minute)} y1={top} x2={x(markerPoint.minute)} y2={height - bottom} className="mp-chart-marker-line" /><circle cx={x(markerPoint.minute)} cy={y(markerPoint.price)} r="7" className="mp-chart-current" /><title>{auction.status === 'ENDED' ? 'Final demo price' : 'Current demo price'}: {formatDemoPrice(markerPrice)}</title></g>}
      <text x={left} y={height - 12} className="mp-chart-label">START</text><text x={width - right} y={height - 12} textAnchor="end" className="mp-chart-label">{maxMinute} MIN</text>
    </svg>
    <div className="mp-chart-ends"><span>Start · {formatDemoPrice(auction.startingPrice)}</span><span>Floor · {formatDemoPrice(auction.floorPrice)}</span></div>
  </div>;
}

function AuctionDetail({ auction, onBack }) {
  const [quantity, setQuantity] = useState('1');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const currentPrice = auction.status === 'ACTIVE' ? auction.currentPrice : null;
  const metrics = auctionPriceMetrics(auction);
  const selectedQuantity = Number(quantity);
  const validQuantity = Number.isInteger(selectedQuantity) && selectedQuantity > 0 && selectedQuantity <= auction.quantity;
  const total = currentPrice != null && validQuantity ? currentPrice * selectedQuantity : null;
  return <div className="mp-auction-detail">
    <nav className="mp-breadcrumb" aria-label="Breadcrumb"><button type="button" onClick={onBack}>Auctions</button><span>/</span><span>Auction Details</span></nav>
    <header className="mp-auction-detail-heading"><div><p className="mp-eyebrow">DUTCH AUCTION · {auction.id}</p><h1>{auction.itemName}</h1><p>{auction.eventName} · {auction.category}</p></div><span className={`mp-auction-status status-${auction.status.toLowerCase()}`}>{auction.status} · DEMO</span></header>
    <div className="mp-auction-detail-grid">
      <section className="mp-auction-detail-main"><div className="mp-panel mp-auction-item-panel"><DemoArtwork item={auction} large /><div className="mp-auction-item-copy"><span className="mp-demo-tag">ILLUSTRATIVE ITEM</span><h2>{auction.itemName}</h2><p>{auction.description}</p><div className="mp-detail-pairs"><div><span>Event / collection</span><b>{auction.eventName}</b></div><div><span>Category</span><b>{auction.category}</b></div><div><span>Original face value</span><b>{formatDemoPrice(auction.faceValue)}</b></div><div><span>Available quantity</span><b>{auction.quantity}</b></div><div><span>Auction ID</span><b>{auction.id}</b></div><div><span>Status</span><b>{auction.status} · local demo</b></div></div></div></div>
        <AuctionPriceChart auction={auction} />
        <section className="mp-panel mp-schedule-panel"><div className="mp-panel-heading"><div><h2>Price schedule</h2><p>Configured example price levels · no historical trades</p></div></div><div className="mp-schedule-meta"><span>Starts · {auction.startsLabel}</span><span>Ends · {auction.endsLabel}</span></div><ol className="mp-schedule-list">{auction.schedule.map((point, index) => <li key={`${point.minute}-${point.price}`} className={currentPrice === point.price ? 'is-current' : ''}><span className="mp-schedule-dot" /><div><b>{index === 0 ? 'Starting price' : index === auction.schedule.length - 1 ? 'Configured floor' : `Scheduled step ${String(index).padStart(2, '0')}`}</b><small>{point.minute === 0 ? 'At auction start' : `${point.minute} minutes from start`}</small></div><strong>{formatDemoPrice(point.price)}</strong>{currentPrice === point.price && <i>Current demo step</i>}</li>)}</ol></section>
      </section>
      <aside className="mp-auction-detail-side">
        <section className="mp-panel mp-auction-price-panel"><div className="mp-panel-heading"><div><h2>Price overview</h2><p>Local illustrative schedule</p></div></div><div className="mp-current-price"><span>{auction.status === 'ACTIVE' ? 'CURRENT DEMO PRICE' : auction.status === 'UPCOMING' ? 'STARTING PRICE' : 'FINAL DEMO PRICE'}</span><b>{formatDemoPrice(currentPrice ?? (auction.status === 'ENDED' ? auction.finalPrice : auction.startingPrice))}</b><small>{auction.status === 'ACTIVE' ? `Remaining · ${auction.timingLabel}` : auction.status === 'UPCOMING' ? `Starts · ${auction.startsLabel}` : `Ended · ${auction.endsLabel}`}</small></div><div className="mp-detail-price-grid"><div><span>START</span><b>{formatDemoPrice(auction.startingPrice)}</b></div><div><span>FLOOR</span><b>{formatDemoPrice(auction.floorPrice)}</b></div><div><span>REDUCTION</span><b>{metrics ? `${formatDemoPrice(metrics.reduction)} · ${metrics.reductionPercent.toFixed(1)}%` : 'Not started'}</b></div></div><div className="mp-auction-progress-label"><span>PRICE-DECAY PROGRESS</span><b>{metrics ? `${metrics.progress.toFixed(0)}%` : '—'}</b></div><div className="mp-auction-progress"><i style={{ width: `${metrics?.progress || 0}%` }} /></div></section>
        <section className="mp-panel mp-purchase-panel"><span className="mp-eyebrow">DEMO PURCHASE SUMMARY</span>{auction.status === 'ACTIVE' ? <><h2>Buy at the current price</h2><p>Frontend simulation only. This does not reserve a pass or charge a payment method.</p><label className="mp-quantity-control">Quantity<input type="number" min="1" max={auction.quantity} step="1" value={quantity} onChange={(event) => { setQuantity(event.target.value); setComplete(false); }} /></label>{!validQuantity && <p className="mp-form-error" role="alert">Enter a whole quantity from 1 to {auction.quantity}.</p>}<div className="mp-total-row"><span>{validQuantity ? `${formatDemoPrice(currentPrice)} × ${selectedQuantity}` : 'Estimated total'}</span><b>{total == null ? '—' : formatDemoPrice(total)}</b></div><small className="mp-floor-note">Floor {formatDemoPrice(auction.floorPrice)} · {auction.timingLabel} left in this example schedule.</small><button className="mp-button mp-button-primary mp-buy-demo" type="button" disabled={!validQuantity} onClick={() => setConfirmOpen(true)}>Buy at Current Price</button>{complete && <p className="mp-demo-complete" role="status">Demo confirmation recorded locally. No transaction, payment, or reservation occurred.</p>}</> : auction.status === 'UPCOMING' ? <><h2>Auction starts soon</h2><p>This example is scheduled to start {auction.startsLabel}. No active price or purchase action is available yet.</p><button className="mp-button mp-button-secondary mp-buy-demo" type="button" disabled>Auction Starts Soon</button></> : <><h2>Auction ended</h2><p>This example schedule has ended. Purchases are disabled.</p><button className="mp-button mp-button-secondary mp-buy-demo" type="button" disabled>Ended</button></>}</section>
      </aside>
    </div>
    {confirmOpen && <div className="mp-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConfirmOpen(false)}><section className="mp-modal mp-demo-confirm" role="dialog" aria-modal="true" aria-labelledby="auction-confirm-title"><button className="mp-modal-close" type="button" onClick={() => setConfirmOpen(false)} aria-label="Close demo confirmation">×</button><p className="mp-eyebrow">SIMULATED ONLY</p><h2 id="auction-confirm-title">Review example purchase</h2><p>No real purchase or payment will occur. This confirmation only demonstrates the future flow.</p><div className="mp-confirm-breakdown"><span>Quantity</span><b>{selectedQuantity}</b><span>Unit price</span><b>{formatDemoPrice(currentPrice)}</b><span>Estimated total</span><b>{formatDemoPrice(total)}</b></div><div className="mp-form-actions"><button className="mp-button mp-button-secondary" type="button" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="mp-button mp-button-primary" type="button" onClick={() => { setConfirmOpen(false); setComplete(true); }}>Confirm Demo</button></div></section></div>}
  </div>;
}

function Metric({ label, value, detail }) {
  return <article className="mp-metric"><span>{label}</span><b>{value}</b><small>{detail}</small></article>;
}

export function AuctionsPage({ path = '/auctions' }) {
  const navigate = useNavigate();
  const detailId = path.startsWith('/auctions/') ? safeDecode(path.slice('/auctions/'.length)) : '';
  const [tab, setTab] = useState('ACTIVE');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('ending');
  const [query, setQuery] = useState('');
  const detail = detailId ? findDemoAuction(detailId) : null;
  const categories = [...new Set(demoAuctions.map((auction) => auction.category))].sort();
  const visible = useMemo(() => demoAuctions.filter((auction) => auction.status === tab && (category === 'all' || auction.category === category) && `${auction.itemName} ${auction.eventName} ${auction.category}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => {
    if (sort === 'price') return (a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice);
    if (sort === 'added') return demoAuctions.indexOf(a) - demoAuctions.indexOf(b);
    return (parseInt(a.timingLabel, 10) || Infinity) - (parseInt(b.timingLabel, 10) || Infinity);
  }), [tab, category, sort, query]);
  return <AppShell currentPath="/auctions" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search example auctions..." pageClass="marketplace-route-content"><div className="mp-page">
    {detailId ? (detail ? <AuctionDetail auction={detail} onBack={() => navigate('/auctions')} /> : <><PageHeading eyebrow="DUTCH AUCTION" title="Auction not found." description="That example auction ID is not in the local Roup demo catalogue." /><StatePanel title="No matching auction"><button className="mp-button mp-button-primary" type="button" onClick={() => navigate('/auctions')}>Back to Auctions</button></StatePanel></>) : <>
      <PageHeading eyebrow="DUTCH PRICE-DECAY AUCTIONS" title="Watch the Price. Choose Your Moment." description="Explore festival passes and exclusive collectibles through auctions where prices decrease according to a predefined schedule." />
      <div className="mp-tabs" role="tablist" aria-label="Auction status">{['ACTIVE', 'UPCOMING', 'ENDED'].map((value) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} key={value} onClick={() => setTab(value)}>{value[0] + value.slice(1).toLowerCase()} <span>{demoAuctions.filter((auction) => auction.status === value).length}</span></button>)}</div>
      <div className="mp-auction-controls"><label className="mp-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="mp-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="ending">Ending soon</option><option value="added">Recently added</option><option value="price">Current price</option></select></label></div>
      {visible.length ? <div className="mp-auction-grid">{visible.map((auction) => <AuctionCard key={auction.id} auction={auction} onView={() => navigate(`/auctions/${encodeURIComponent(auction.id)}`)} />)}</div> : <StatePanel title={`No ${tab.toLowerCase()} auctions match`} >Try a different search or category.</StatePanel>}
      <p className="mp-disclosure">Auction cards and schedules are deterministic local examples. Prices are not live or server-synchronised; no real purchase or reservation is made.</p>
    </>}
  </div></AppShell>;
}

export function OrdersPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState('ALL');
  const orders = useLoad(getOrders, session?.jwt);
  const tabs = ['ALL', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED'];
  const unavailable = !orders.loading && !orders.error && !orders.data?.available;
  return <AppShell currentPath="/orders" pageClass="marketplace-route-content"><div className="mp-page">
    <PageHeading eyebrow="ACCOUNT ACTIVITY" title="My Orders" description="Track orders, execution status, and open order actions." />
    <div className="mp-metrics mp-order-metrics">{['Open', 'Partially filled', 'Filled', 'Cancelled'].map((label) => <Metric key={label} label={label} value="Unavailable" detail="Order service not connected" />)}</div>
    <div className="mp-tabs" role="tablist" aria-label="Filter orders">{tabs.map((value) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} key={value} disabled={unavailable} title={unavailable ? 'Order history is not available' : undefined} onClick={() => setTab(value)}>{value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</button>)}</div>
    {orders.loading ? <StatePanel title="Loading your orders">Checking authenticated order history.</StatePanel> : orders.error ? <StatePanel kind="error" title="Order history could not be loaded" onRetry={orders.reload}>{orders.error}</StatePanel> : !orders.data?.available ? <StatePanel title="Order history is not connected">The backend does not yet provide order persistence, execution, or cancellation. No order activity is being represented as real.</StatePanel> : <StatePanel title="You don't have any orders yet">When an order service is available, your order history will appear here.</StatePanel>}
  </div></AppShell>;
}

const emptyForm = { itemName: '', eventName: '', category: 'Festival Pass', description: '', faceValue: '', askingPrice: '', quantity: '1', authorizedToResell: false };

function ListingForm({ initial, onClose, onSave, busy, error, maxResaleMultiplier = 1.2 }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [formError, setFormError] = useState('');
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: key === 'authorizedToResell' ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const faceValue = Number(form.faceValue);
    const askingPrice = Number(form.askingPrice);
    const quantity = Number(form.quantity);
    if (!form.itemName.trim() || !form.eventName.trim() || !form.category) return setFormError('Enter the item, event or collection, and category.');
    if (!Number.isFinite(faceValue) || !Number.isFinite(askingPrice) || faceValue <= 0 || askingPrice <= 0) return setFormError('Face value and asking price must be greater than zero.');
    if (askingPrice > faceValue * maxResaleMultiplier) return setFormError(`The asking price is above the configured ${Math.round(maxResaleMultiplier * 100)}% resale ceiling.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return setFormError('Quantity must be between 1 and 20.');
    if (!form.authorizedToResell) return setFormError('Confirm you are authorized to resell this item.');
    setFormError('');
    await onSave({ ...form, itemName: form.itemName.trim(), eventName: form.eventName.trim(), faceValue, askingPrice, quantity });
  };
  return <div className="mp-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="listing-form-title"><button className="mp-modal-close" type="button" onClick={onClose} aria-label="Close listing form">×</button><p className="mp-eyebrow">SELLER LISTING</p><h2 id="listing-form-title">{initial ? 'Edit listing' : 'Create a listing'}</h2><p className="mp-modal-note">Listings are visible marketplace data. Roup cannot verify item ownership, ticket authenticity, or delivery yet; purchases are not enabled.</p>
    <form onSubmit={submit} className="mp-form"><label>Item name<input maxLength="120" value={form.itemName} onChange={set('itemName')} required /></label><label>Event or collection<input maxLength="140" value={form.eventName} onChange={set('eventName')} required /></label><label>Category<select value={form.category} onChange={set('category')}><option>Festival Pass</option><option>VIP Pass</option><option>Merchandise</option><option>Collectible</option><option>Event Ticket</option></select></label><label>Description<textarea maxLength="1200" rows="3" value={form.description} onChange={set('description')} /></label><div className="mp-form-pair"><label>Original face value<input type="number" min="0.01" step="0.01" value={form.faceValue} onChange={set('faceValue')} required /></label><label>Asking price<input type="number" min="0.01" step="0.01" value={form.askingPrice} onChange={set('askingPrice')} required /></label></div><label>Quantity<input type="number" min="1" max="20" step="1" value={form.quantity} onChange={set('quantity')} required /></label><label className="mp-attest"><input type="checkbox" checked={form.authorizedToResell} onChange={set('authorizedToResell')} />I confirm I am authorized to resell this item.</label>{(formError || error) && <p className="mp-form-error" role="alert">{formError || error}</p>}<div className="mp-form-actions"><button className="mp-button mp-button-secondary" type="button" onClick={onClose}>Cancel</button><button className="mp-button mp-button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create listing'}</button></div></form>
    </section></div>;
}

export function ListingsPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const listings = useLoad(getMyListings, session?.jwt);
  const marketplaceSummary = useLoad(getMarketSummary, session?.jwt);
  const values = Array.isArray(listings.data) ? listings.data : [];
  const visible = values.filter((item) => (tab === 'ALL' || item.status === tab) && `${item.itemName} ${item.eventName} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const save = async (body) => {
    setBusy(true); setOperationError('');
    const payload = {
      itemName: body.itemName, eventName: body.eventName, category: body.category,
      description: body.description, faceValue: body.faceValue, askingPrice: body.askingPrice,
      quantity: body.quantity, authorizedToResell: body.authorizedToResell,
    };
    try {
      if (dialog?.item) await updateListing(session?.jwt, dialog.item.id, payload);
      else await createListing(session?.jwt, payload);
      setDialog(null); await listings.reload();
    } catch (error) { setOperationError(errorText(error)); }
    finally { setBusy(false); }
  };
  const changeStatus = async (item, status) => {
    if (status === 'REMOVED' && !window.confirm('Remove this listing from the marketplace? This cannot be undone.')) return;
    setOperationError('');
    try { await setListingStatus(session?.jwt, item.id, status); await listings.reload(); }
    catch (error) { setOperationError(errorText(error)); }
  };
  const editForm = (item) => ({ ...item, authorizedToResell: true, faceValue: String(item.faceValue), askingPrice: String(item.askingPrice), quantity: String(item.quantity) });
  return <AppShell currentPath="/listings" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search your listings..." pageClass="marketplace-route-content"><div className="mp-page">
    <PageHeading eyebrow="SELLER TOOLS" title="My Listings" description="Manage your marketplace listings and available quantities." actions={<button className="mp-button mp-button-primary" type="button" onClick={() => { setOperationError(''); setDialog({ item: null }); }}>＋ Create new listing</button>} />
    <div className="mp-metrics mp-listing-metrics"><Metric label="Active listings" value={listings.loading ? '…' : listings.error ? '—' : values.filter((item) => item.status === 'ACTIVE').length} detail="Visible on the market" /><Metric label="Paused listings" value={listings.loading ? '…' : listings.error ? '—' : values.filter((item) => item.status === 'PAUSED').length} detail="Not shown to buyers" /><Metric label="Sold listings" value="Unavailable" detail="No settlement service connected" /></div>
    <div className="mp-tabs" role="tablist" aria-label="Filter listings">{['ALL', 'ACTIVE', 'PAUSED', 'REMOVED'].map((value) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} key={value} onClick={() => setTab(value)}>{value[0] + value.slice(1).toLowerCase()}</button>)}</div>
    {operationError && !dialog && <p className="mp-inline-error" role="alert">{operationError}</p>}
    {listings.loading ? <StatePanel title="Loading your listings">Retrieving listings linked to your account.</StatePanel> : listings.error ? <StatePanel kind="error" title="Your listings could not be loaded" onRetry={listings.reload}>{listings.error}</StatePanel> : visible.length === 0 ? <StatePanel title={tab === 'ALL' ? 'Your listed items will appear here.' : `No ${tab.toLowerCase()} listings`}>Create a listing to add seller-submitted item information to the marketplace. Roup does not currently verify item ownership or handle purchases.</StatePanel> : <div className="mp-panel mp-listings-table-wrap"><div className="mp-table-scroll" tabIndex="0" role="region" aria-label="Scrollable listing management table"><table className="mp-table mp-listings-table"><thead><tr><th>Item / event</th><th>Category</th><th>Face value</th><th>Asking price</th><th>Quantity</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><span className="mp-item-title">{item.itemName}</span><span className="mp-item-subtitle">{item.eventName}</span></td><td>{item.category}</td><td>{money(item.faceValue)}</td><td>{money(item.askingPrice)}</td><td>{item.quantity}</td><td><span className={`mp-status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td><td>{date(item.updatedAt)}</td><td><div className="mp-row-actions">{['ACTIVE', 'PAUSED'].includes(item.status) && <><button type="button" onClick={() => { setOperationError(''); setDialog({ item, initial: editForm(item) }); }}>Edit</button><button type="button" onClick={() => changeStatus(item, item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}>{item.status === 'ACTIVE' ? 'Pause' : 'Resume'}</button><button className="is-danger" type="button" onClick={() => changeStatus(item, 'REMOVED')}>Remove</button></>}</div></td></tr>)}</tbody></table></div><p className="mp-disclosure">These are seller-submitted listing details, not verified inventory. Roup does not yet validate ownership, ticket delivery, or settlement.</p></div>}
    {dialog && <ListingForm initial={dialog.initial} onClose={() => setDialog(null)} onSave={save} busy={busy} error={operationError} maxResaleMultiplier={Number(marketplaceSummary.data?.maxResaleMultiplier) || 1.2} />}
  </div></AppShell>;
}
