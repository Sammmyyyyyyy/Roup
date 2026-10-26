import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../store/appContext.js';
import AppShell from '../components/layout/AppShell.jsx';
import { filterMarketplaceItems, getItemArtworkLabel, marketplaceCategories } from '../utils/marketplaceData.js';
import { useDemoData } from '../store/demoDataStore.jsx';
import { demoMarkets } from '../data/demo/marketplace.js';
import '../styles/explore.css';

const icons = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7 4.7-2.3Z" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-7" /></>,
  hammer: <><path d="m14 6 4 4M7 17l8-8m-4-3 6 6M5 19l3-3m8-11 3-3 4 4-3 3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6m-6 4h6m-6 4h3" /></>,
  tag: <><path d="M20 13 12 21 3 12V4h8l9 9Z" /><circle cx="7.5" cy="8" r="1" /></>,
  bookmark: <><path d="M6 4h12v17l-6-4-6 4V4Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.3 4.3" /></>,
  arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7-2.7L12 2Z" />,
};

function Icon({ name, size = 18, ...props }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" {...props}>{icons[name] || icons.spark}</svg>;
}

function Artwork({ item, featured = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const monogram = ({ shore: 'NS', solstice: 'SD', afterhours: 'AH', afterglow: 'AG', nightgarden: 'NG', fieldnotes: 'FN' })[item.art]
    || item.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  useEffect(() => setImageFailed(false), [item.imageUrl]);
  return <div className={`listing-art art-${item.art}${featured ? ' listing-art-featured' : ''}`} role="img" aria-label={getItemArtworkLabel(item)}>
    {item.imageUrl && !imageFailed && <img className="listing-art-image" src={item.imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
    <span className="art-kicker">{item.isDemo ? 'ROUP EXAMPLE' : 'SELLER SUBMITTED'} <i>·</i> {item.category.toUpperCase()}</span>
    <div className="art-emblem"><span>{monogram}</span><i /><i /><i /></div>
    <strong>{item.event.split(/[: ]/).filter(Boolean).slice(0, 2).join('\n').toUpperCase()}</strong>
    <small>{item.name.toUpperCase()} <i>—</i> {item.isDemo ? 'EXAMPLE' : 'LISTING'}</small>
    <span className="art-ticket-notch notch-one" /><span className="art-ticket-notch notch-two" />
  </div>;
}

function DemoLabel({ children = 'DEMO DATA' }) {
  return <span className="demo-label"><i />{children}</span>;
}

function BookmarkButton({ saved, onClick, label }) {
  return <button className={`bookmark-button${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} aria-label={saved ? `Remove ${label} from your local watchlist` : `Save ${label} to your local watchlist`} title={saved ? 'Remove from your browser watchlist' : 'Save to your browser watchlist'} onClick={onClick}><Icon name="bookmark" size={16} /></button>;
}

function PriceLine({ item }) {
  return <div className="listing-prices"><div><span>FACE VALUE</span><b>${item.faceValue.toFixed(2)}</b></div><div><span>{item.isDemo ? 'EXAMPLE ASK' : 'ASKING PRICE'}</span><b>${item.askingPrice.toFixed(2)}</b></div></div>;
}

function ListingCard({ item, saved, onSave, onView }) {
  return <article className="listing-card">
    <div className="listing-card-art"><Artwork item={item} /><BookmarkButton saved={saved} onClick={onSave} label={item.name} /></div>
    <div className="listing-card-body">
      <span className="market-art-category">{item.category}</span>
      <div className="listing-card-heading"><div><span className="listing-category">{item.isDemo ? 'EXAMPLE LISTING' : 'SELLER SUBMITTED'}</span><h3>{item.name}</h3><p>{item.event}</p></div></div>
      {item.description && <p className="explore-card-description">{item.description}</p>}
      <PriceLine item={item} />
      <div className="listing-card-foot"><span className="listing-status"><i /> {item.status === 'ACTIVE' ? 'Active listing' : item.status || 'Availability unknown'} <b>·</b> {item.isDemo ? `Example qty ${item.quantity}` : `Seller-reported qty ${item.quantity}`}</span>{item.isDemo ? <DemoLabel /> : <span className="seller-submitted-label">SELLER SUBMITTED</span>}</div>
      <button className="market-link-button" type="button" onClick={onView}>View Market <Icon name="arrow" size={15} /></button>
    </div>
  </article>;
}

function FeaturedDrop({ item, onView }) {
  return <section className="featured-drop" aria-labelledby="featured-heading">
    <div className="featured-copy"><span className="eyebrow">FEATURED DROP <i>·</i> {item.isDemo ? 'ILLUSTRATIVE EXAMPLE' : 'SELLER SUBMITTED'}</span><h2 id="featured-heading">Made for the<br /><em>Moments That Matter.</em></h2><p>Explore a standout listing and the market context around it.</p>
      <div className="featured-item-name"><span>{item.category}</span><b>{item.event} <i>·</i> {item.name}</b></div>
      <PriceLine item={item} />
    <div className="featured-availability"><span><i /> {item.isDemo ? `Example qty: ${item.quantity}` : `Seller-reported qty: ${item.quantity}`}</span>{item.isDemo ? <DemoLabel /> : <span className="seller-submitted-label">SELLER SUBMITTED</span>}</div>
      <button className="explore-primary-button" type="button" onClick={onView}>View Market <Icon name="arrow" size={16} /></button>
    </div>
    <div className="featured-art-wrap"><Artwork item={item} featured /><div className="featured-orbit orbit-a" /><div className="featured-orbit orbit-b" /><span className="featured-art-caption"><Icon name="spark" size={14} /> A pass for the next chapter</span></div>
  </section>;
}

function MarketPulse({ count }) {
  return <section className="market-info-panel" id="market-pulse" aria-labelledby="pulse-title"><div className="panel-heading"><span className="panel-icon"><Icon name="chart" size={16} /></span><h2 id="pulse-title">Market Pulse</h2></div>
    <div className="pulse-count"><span>Active listings</span><b>{String(count).padStart(2, '0')}</b><small>includes labelled examples</small></div>
    <div className="pulse-unavailable"><span className="pulse-status-icon"><Icon name="clock" size={14} /></span><p>Order book, auction, and completed-trade data are not connected.</p></div>
    <DemoLabel>CATALOG DATA</DemoLabel>
  </section>;
}

function AuctionsPanel() {
  return <section className="market-info-panel auctions-panel" id="auctions" aria-labelledby="auctions-title"><div className="panel-heading"><span className="panel-icon"><Icon name="hammer" size={16} /></span><h2 id="auctions-title">Auctions to Watch</h2></div>
    <p>Explore items currently available through Dutch auctions.</p>
    <div className="panel-empty"><span className="empty-art"><Icon name="clock" size={18} /></span><b>No live auctions connected</b><small>Auction examples elsewhere on Roup are illustrative only.</small></div>
  </section>;
}

function WatchlistPanel({ items, onView }) {
  return <section className="market-info-panel watchlist-panel" id="watchlist" aria-labelledby="watchlist-title"><div className="panel-heading"><span className="panel-icon"><Icon name="bookmark" size={16} /></span><h2 id="watchlist-title">Your Watchlist</h2></div>
    {items.length ? <><p className="watchlist-note">Saved in this browser. Not synced to an account.</p><ul className="watchlist-list">{items.map((item) => <li key={item.id}><Artwork item={item} /><div><b>{item.name}</b><small>{item.event}</small><strong>${item.askingPrice.toFixed(2)} <i>{item.isDemo ? 'example ask' : 'asking price'}</i></strong></div><button type="button" aria-label={`View ${item.name} market details`} onClick={() => onView(item)}><Icon name="chevron" size={15} /></button></li>)}</ul></>
      : <div className="panel-empty watchlist-empty"><span className="empty-art"><Icon name="bookmark" size={18} /></span><b>Nothing saved yet.</b><small>Save items you like to find them here later.</small><a href="#market-list">Explore Items <Icon name="arrow" size={13} /></a></div>}
  </section>;
}

function ExploreCardSkeleton() {
  return <article className="listing-card explore-card-skeleton" aria-hidden="true"><div className="explore-skeleton-art" /><div className="explore-skeleton-copy"><i /><b /><span /><span /><div><i /><i /></div></div></article>;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const demo = useDemoData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(12);
  const listings = useMemo(() => [
    ...demoMarkets.map((item, index) => ({ id: item.id, name: item.itemName, event: item.eventName, category: item.category, filter: /vip/i.test(item.category) ? 'vip' : /merch/i.test(item.category) ? 'merchandise' : /collect/i.test(item.category) ? 'collectibles' : 'festival', faceValue: item.faceValue, askingPrice: item.askingPrice, quantity: item.quantity, description: item.description, imageUrl: '', art: item.art, artLabel: `${item.eventName} illustrative listing artwork`, isDemo: true, status: item.status, listedOrder: index, bestBid: item.bestBid ?? null, bestAsk: item.bestAsk ?? null })),
    ...demo.listings.filter((item) => item.status === 'ACTIVE').map((item, index) => ({ ...item, name: item.itemName, event: item.eventName, filter: /vip/i.test(item.category) ? 'vip' : /merch/i.test(item.category) ? 'merchandise' : /collect/i.test(item.category) ? 'collectibles' : 'festival', imageUrl: item.imageUrl || '', isDemo: true, listedOrder: Date.parse(item.createdAt) || -index, artLabel: `${item.eventName} demo listing artwork` })),
  ], [demo.listings]);
  const savedIds = demo.watchlist.filter((key) => key.startsWith('market:')).map((key) => key.slice(7));
  const toggleSaved = (id) => demo.toggleWatchlist('market', id);
  const loading = false;
  const loadError = '';

  useEffect(() => {
    document.title = 'Explore Marketplace | Roup';
    return () => { document.title = 'Roup — Rare Passes. Real Markets. Fairer Trades.'; };
  }, []);

  const filteredListings = useMemo(() => filterMarketplaceItems(listings, { category, query, sort }), [listings, query, category, sort]);
  const visibleListings = filteredListings.slice(0, visibleCount);
  useEffect(() => setVisibleCount(12), [query, category, sort]);

  const featured = listings[0];
  const savedItems = listings.filter((item) => savedIds.includes(item.id));
  const openMarket = useCallback((item) => navigate(`/markets/${encodeURIComponent(item.id)}`), [navigate]);

  return <AppShell currentPath="/explore" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search festival passes, events, and collectibles..." pageClass="explore-route-content">
      <div className="explore-main-shell">
        <main className="explore-content" id="explore">
          <div className="explore-heading"><div><p className="eyebrow">THE ROUP MARKETPLACE</p><h1>Discover Your<br /><span>Next Find.</span></h1><p className="explore-description">Explore festival passes, exclusive event tickets, and limited-edition collectibles across the Roup marketplace.</p></div><DemoLabel>SELLER LISTINGS · EXAMPLES</DemoLabel></div>
          <div className="category-tabs" role="group" aria-label="Filter items by category">{marketplaceCategories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
          {loading ? <div className="explore-loading" role="status"><span className="explore-spinner" />Loading marketplace listings…</div> : loadError ? <div className="explore-empty-state" role="alert"><Icon name="spark" /><b>Listings unavailable</b><p>{loadError}</p></div> : featured && <FeaturedDrop item={featured} onView={() => openMarket(featured)} />}
          <p className="market-disclosure"><Icon name="lock" size={13} /> Example catalog items are labelled. Seller listings are user-submitted and are not independently verified; no purchase or settlement flow is connected.</p>
        </main>
        <aside className="market-info-sidebar" aria-label="Marketplace information">
          <MarketPulse count={listings.length} />
          <AuctionsPanel />
          <WatchlistPanel items={savedItems} onView={openMarket} />
          <p className="info-sidebar-foot">Marketplace data connection<br /><b>Not configured</b></p>
        </aside>
        <section className="market-list-section explore-marketplace-wide" id="market-list" aria-labelledby="market-list-title">
          <div className="market-list-heading"><div><p className="eyebrow">PASSES, TICKETS & OBJECTS</p><h2 id="market-list-title">Explore the Marketplace</h2><p>Find the passes and collectibles worth discovering.</p></div><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option value="recent">Recently Listed</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></label></div>
          <div className="result-meta"><span>{loading ? 'Preparing listings…' : `${filteredListings.length} ${filteredListings.length === 1 ? 'item' : 'items'}`}</span><DemoLabel /></div>
          {loading ? <div className="listing-grid explore-skeleton-list" role="status" aria-label="Loading marketplace listings">{Array.from({ length: 3 }, (_, index) => <ExploreCardSkeleton key={index} />)}<span className="visually-hidden">Loading marketplace listings</span></div> : !loadError && (filteredListings.length ? <><div className="listing-grid">{visibleListings.map((item) => <ListingCard key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => toggleSaved(item.id)} onView={() => openMarket(item)} />)}</div>{visibleCount < filteredListings.length && <button className="market-load-more" type="button" onClick={() => setVisibleCount((count) => count + 12)}>Load more items <span>({filteredListings.length - visibleCount} remaining)</span></button>}</> : !loadError && <div className="explore-empty-state"><span className="empty-art"><Icon name="search" /></span><b>No items found</b><p>Try another search or choose a different category.</p><button className="explore-secondary-button" type="button" onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters</button></div>)}
        </section>
      </div>
  </AppShell>;
}
