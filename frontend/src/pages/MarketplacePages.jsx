import React, { useMemo, useState } from 'react';
import AppShell, { AppIcon } from '../components/layout/AppShell.jsx';
import { useNavigate } from '../store/appContext.js';
import { useDemoData, auctionWatchKey } from '../store/demoDataStore.jsx';
import { auctionPriceMetrics, demoAuctions, demoMarkets, findDemoAuction, formatDemoPrice, marketSpread } from '../data/demo/marketplace.js';
import '../styles/marketplacePages.css';

const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const safeDecode = (value) => { try { return decodeURIComponent(value); } catch { return ''; } };

function PageHeading({ eyebrow, title, description, actions }) {
  return <div className="mp-heading"><div><p className="mp-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="mp-heading-actions">{actions}</div>}</div>;
}

function StatePanel({ kind = 'empty', title, children, onRetry }) {
  return <div className={`mp-state mp-state-${kind}`} role={kind === 'error' ? 'alert' : 'status'}><span className="mp-state-mark"><AppIcon name={kind === 'error' ? 'chart' : 'receipt'} size={20} /></span><b>{title}</b><div className="mp-state-copy">{children}</div>{onRetry && <button className="mp-button mp-button-secondary" type="button" onClick={onRetry}>Try again</button>}</div>;
}

export function MarketsPage({ path = '/markets' }) {
  const navigate = useNavigate();
  const demo = useDemoData();
  const detailId = path.startsWith('/markets/') ? safeDecode(path.slice('/markets/'.length)) : '';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const savedIds = demo.watchlist.filter((key) => key.startsWith('market:')).map((key) => key.slice(7));
  const marketCatalog = useMemo(() => [
    ...demoMarkets,
    ...demo.listings.filter((listing) => listing.status === 'ACTIVE').map((listing) => ({ ...listing, status: 'ACTIVE', art: listing.art || 'custom', demo: true })),
  ], [demo.listings]);
  const items = useMemo(() => {
    const values = marketCatalog.filter((item) => {
      const haystack = `${item.itemName} ${item.eventName} ${item.category}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase()) && (category === 'all' || item.category === category);
    });
    return values.sort((a, b) => sort === 'price-low' ? Number(a.askingPrice) - Number(b.askingPrice) : sort === 'price-high' ? Number(b.askingPrice) - Number(a.askingPrice) : a.itemName.localeCompare(b.itemName));
  }, [marketCatalog, query, category, sort]);
  const categories = [...new Set(marketCatalog.map((item) => item.category))].sort();
  const selectedMarket = marketCatalog.find((item) => item.id === detailId);
  const toggleSaved = (id) => demo.toggleWatchlist('market', id);

  return <AppShell currentPath="/markets" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search markets and events..." pageClass="marketplace-route-content">
    <div className="mp-page">
      {detailId ? <>
        <button className="mp-back" type="button" onClick={() => navigate('/markets')}>← All markets</button>
        {selectedMarket ? <MarketDetail item={selectedMarket} saved={savedIds.includes(selectedMarket.id)} onSave={() => toggleSaved(selectedMarket.id)} /> : <StatePanel title="Market not found"><button className="mp-button mp-button-secondary" type="button" onClick={() => navigate('/markets')}>Back to Markets</button></StatePanel>}
      </> : <>
        <PageHeading eyebrow="ILLUSTRATIVE MARKET DATA" title="A Clearer View of Every Market." description="Compare example listings and see how bid, ask, and spread information fits together. These local examples are not live exchange activity." />
        <div className="mp-metrics">
          <Metric label="Example markets" value={marketCatalog.length} detail="Local illustrative catalogue" />
          <Metric label="Example order books" value={marketCatalog.filter((item) => item.orderBook).length} detail="Fixed demo levels only" />
          <Metric label="Live market feed" value="Not connected" detail="No real orders or trades shown" />
        </div>
        <div className="mp-panel mp-market-panel">
          <div className="mp-panel-heading"><div><h2>Markets</h2><p>{items.length} example result{items.length === 1 ? '' : 's'}</p></div><label className="mp-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="mp-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Item name</option><option value="price-low">Asking price: low</option><option value="price-high">Asking price: high</option></select></label></div>
          {!items.length ? <StatePanel title="No markets match those filters">Clear the search or choose another category.</StatePanel> : <div className="mp-market-cards">{items.map((item) => <MarketCard key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => toggleSaved(item.id)} onView={() => navigate(`/markets/${encodeURIComponent(item.id)}`)} />)}</div>}
          <p className="mp-disclosure">All prices and order levels are frontend-only examples. No live order book, trade history, seller activity, or checkout is connected.</p>
        </div>
      </>}
    </div>
  </AppShell>;
}

function MarketDetail({ item, saved, onSave }) {
  const demo = useDemoData();
  const spread = marketSpread(item);
  const bids = item.orderBook?.bids || [];
  const asks = item.orderBook?.asks || [];
  const openOrders = demo.orders.filter((order) => order.marketId === item.id && ['OPEN', 'PARTIALLY_FILLED'].includes(order.status));
  const reservedBuy = openOrders.filter((order) => order.side === 'BUY').reduce((total, order) => total + order.price * order.remainingQuantity, 0);
  const reservedSell = openOrders.filter((order) => order.side === 'SELL').reduce((total, order) => total + order.remainingQuantity, 0);
  const availableFunds = Math.max(0, demo.balance - reservedBuy);
  const availableHoldings = Math.max(0, (demo.holdings[item.id] || 0) - reservedSell);
  return <div className="mp-market-detail-terminal">
    <div className="mp-market-detail-top"><div className="mp-market-product"><DemoArtwork item={item} large /><div><p className="mp-eyebrow">MARKET DETAIL · LOCAL SAMPLE</p><h1>{item.itemName}</h1><p>{item.eventName} · {item.category}</p><div className="mp-detail-badges"><span>{item.status}</span><span>{item.quantity} example units available</span><span>Face value {formatDemoPrice(item.faceValue)}</span></div></div></div><button className={`mp-watch-button${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={onSave}><AppIcon name="bookmark" size={16} />{saved ? 'Saved' : 'Save market'}</button></div>
    <div className="mp-detail-metrics"><Metric label="Best Bid" value={item.bestBid == null ? 'Unavailable' : formatDemoPrice(item.bestBid)} detail="Highest sample buyer offer" /><Metric label="Best Ask" value={item.bestAsk == null ? 'Unavailable' : formatDemoPrice(item.bestAsk)} detail="Lowest sample seller offer" /><Metric label="Last Sample Trade" value={item.lastTrade == null ? 'Unavailable' : formatDemoPrice(item.lastTrade)} detail={item.lastTrade == null ? 'No sample trade configured' : 'Illustrative only'} /><Metric label="Bid–Ask Spread" value={spread ? formatDemoPrice(spread.spread) : 'Unavailable'} detail={spread ? `${spread.percent.toFixed(2)}% of midpoint` : 'No complete sample quote'} /></div>
    <div className="mp-terminal-grid"><div className="mp-terminal-main"><MarketHistoryChart item={item} /><OrderBookPanel item={item} bids={bids} asks={asks} /><MarketHistoryPanel item={item} /></div><aside className="mp-terminal-side"><OrderEntryPanel item={item} demo={demo} availableFunds={availableFunds} availableHoldings={availableHoldings} bids={bids} asks={asks} /><section className="mp-panel mp-demo-account"><div className="mp-panel-heading"><div><h2>Demo account</h2><p>Local-only simulated values</p></div></div><div><span>Available balance</span><b>{formatDemoPrice(availableFunds)}</b></div><div><span>Available holdings</span><b>{availableHoldings} units</b></div><p>Open orders reserve displayed buying capacity or holdings in this browser demo.</p></section></aside></div>
    <p className="mp-disclosure">All chart points, orders, quotes and histories on this page are deterministic examples. No live prices, real trades, payments or exchange orders are connected.</p>
  </div>;
}

function MarketHistoryChart({ item }) {
  const [range, setRange] = useState('ALL');
  const [active, setActive] = useState(null);
  const history = item.priceHistory || [];
  const ranges = ['1D', '1W', '1M', 'ALL'];
  const selected = history.filter((point) => range === 'ALL' || (range === '1D' && Date.now() - Date.parse(point.timestamp) <= 86400000) || (range === '1W' && Date.now() - Date.parse(point.timestamp) <= 604800000) || (range === '1M' && Date.now() - Date.parse(point.timestamp) <= 2592000000));
  const chartPoints = selected.length > 1 ? selected : history;
  const values = chartPoints.map((point) => point.price);
  const min = Math.min(...values) - 3; const max = Math.max(...values) + 3;
  const width = 840; const height = 280; const plotLeft = 118; const plotRight = 816; const x = (index) => plotLeft + index / Math.max(chartPoints.length - 1, 1) * (plotRight - plotLeft); const y = (price) => 20 + (max - price) / Math.max(max - min, 1) * 207;
  const line = chartPoints.map((point, index) => `${x(index)},${y(point.price)}`).join(' ');
  const latest = chartPoints.at(-1);
  return <section className="mp-panel mp-price-chart-panel"><div className="mp-panel-heading"><div><h2>Price history</h2><p>Sample indicative prices · not executed trades</p></div><div className="mp-range-controls" role="group" aria-label="Price chart time range">{ranges.map((value) => <button key={value} className={range === value ? 'is-active' : ''} disabled={value !== 'ALL' && history.filter((point) => value === '1D' ? Date.now() - Date.parse(point.timestamp) <= 86400000 : value === '1W' ? Date.now() - Date.parse(point.timestamp) <= 604800000 : Date.now() - Date.parse(point.timestamp) <= 2592000000).length < 2} onClick={() => { setRange(value); setActive(null); }}>{value}</button>)}</div></div>
    {history.length > 1 ? <div className="mp-chart-scroller"><div className="mp-chart-tooltip-space"><svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${item.itemName} sample price history chart; focus each point for its timestamp and sample price.`}><defs><linearGradient id="marketChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--mint)" stopOpacity=".24" /><stop offset="1" stopColor="var(--mint)" stopOpacity="0" /></linearGradient></defs>{[0,1,2,3].map((i) => { const yy = 20 + i * 69; return <g key={i}><line x1={plotLeft} y1={yy} x2={plotRight} y2={yy} className="mp-chart-gridline"/><text x="108" y={yy + 4} textAnchor="end" className="mp-chart-label">{formatDemoPrice(max - i * (max - min) / 3)}</text></g>; })}<polygon points={`${plotLeft},239 ${line} ${plotRight},239`} fill="url(#marketChartFill)"/><polyline points={line} className="mp-market-chart-line"/>{chartPoints.map((point,index)=><g key={point.timestamp}><circle cx={x(index)} cy={y(point.price)} r="11" className="mp-chart-hover-hit" tabIndex="0" role="button" aria-label={`${new Date(point.timestamp).toLocaleString()}, sample price ${formatDemoPrice(point.price)}, quantity ${point.volume}`} onMouseEnter={()=>setActive({point,index})} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive({point,index})} onBlur={()=>setActive(null)}/><circle cx={x(index)} cy={y(point.price)} r={index===chartPoints.length-1?5:3} className={index===chartPoints.length-1?'mp-chart-latest-point':'mp-market-chart-point'}/></g>)}<text x={plotLeft} y="269" className="mp-chart-label">{new Date(chartPoints[0].timestamp).toLocaleDateString()}</text><text x={plotRight} y="269" textAnchor="end" className="mp-chart-label">{new Date(latest.timestamp).toLocaleDateString()}</text></svg>{active && <div className="mp-market-tooltip" style={{left:`${x(active.index)/width*100}%`,top:`${y(active.point.price)/height*100}%`}}><b>{formatDemoPrice(active.point.price)}</b><span>{new Date(active.point.timestamp).toLocaleString()}</span><span>Sample quantity · {active.point.volume}</span></div>}</div><div className="mp-chart-legend"><span><i/> Indicative sample price</span><b>Latest · {formatDemoPrice(latest.price)}</b></div></div> : <StatePanel title="Price history unavailable">This listing has no timestamped sample price points.</StatePanel>}
  </section>;
}

function OrderBookPanel({ item, bids, asks }) {
  const bestBid = bids.length ? Math.max(...bids.map((level) => level.price)) : null;
  const bestAsk = asks.length ? Math.min(...asks.map((level) => level.price)) : null;
  const rows = [...asks.map((level)=>({...level,side:'ASK'})).sort((a,b)=>b.price-a.price),...bids.map((level)=>({...level,side:'BID'})).sort((a,b)=>b.price-a.price)];
  const maxTotal = Math.max(1,...rows.reduce((acc,row)=>{const prior=acc.at(-1)?.side===row.side?acc.at(-1).total:0;acc.push({side:row.side,total:prior+row.quantity});return acc;},[]).map((row)=>row.total));
  let askCumulative=0; let bidCumulative=0;
  return <section className="mp-panel mp-order-book-panel"><div className="mp-panel-heading"><div><h2>Order book</h2><p>Fixed sample levels · quantity and cumulative depth</p></div></div>{!rows.length ? <StatePanel title="No sample order book">No bid or ask levels are configured for this market.</StatePanel> : <><div className="mp-book-head"><span>Side</span><span>Price</span><span>Qty</span><span>Cumulative</span></div><div className="mp-book-rows">{rows.map((row,index)=>{const total=row.side==='ASK'?(askCumulative+=row.quantity):(bidCumulative+=row.quantity);const isBest=row.side==='BID'?row.price===bestBid:row.price===bestAsk;return <div className={`mp-book-row ${row.side.toLowerCase()}`} key={`${row.side}-${row.price}`}><span>{row.side} {isBest&&<b>BEST</b>}</span><strong>{formatDemoPrice(row.price)}</strong><span>{row.quantity}</span><span>{total}</span><i style={{width:`${total/maxTotal*100}%`}}/></div>;})}</div><div className="mp-book-spread"><span>Best bid <b>{bestBid==null?'Unavailable':formatDemoPrice(bestBid)}</b></span><span>Midpoint <b>{bestAsk==null||bestBid==null?'Unavailable':formatDemoPrice((bestAsk+bestBid)/2)}</b></span><span>Best ask <b>{bestAsk==null?'Unavailable':formatDemoPrice(bestAsk)}</b></span></div></>}</section>;
}

function MarketHistoryPanel({ item }) {
  const [tab,setTab]=useState('trades');
  const trades=item.recentTrades||[];const history=item.bidAskHistory||[];
  return <section className="mp-panel mp-history-panel"><div className="mp-panel-heading"><div><h2>Market activity</h2><p>Separate illustrative trades and sample resting orders</p></div></div><div className="mp-tabs" role="tablist" aria-label="Market activity views"><button role="tab" aria-selected={tab==='trades'} className={tab==='trades'?'is-active':''} onClick={()=>setTab('trades')}>Recent Trades</button><button role="tab" aria-selected={tab==='history'} className={tab==='history'?'is-active':''} onClick={()=>setTab('history')}>Bid/Ask History</button></div>{tab==='trades'?trades.length?<div className="mp-table-scroll"><table className="mp-table"><thead><tr><th>Time</th><th>Sample price</th><th>Quantity</th><th>Side</th></tr></thead><tbody>{trades.map((trade)=><tr key={trade.id}><td>{new Date(trade.timestamp).toLocaleString()}</td><td>{formatDemoPrice(trade.price)}</td><td>{trade.quantity}</td><td>{trade.side}</td></tr>)}</tbody></table></div>:<StatePanel title="No sample trades">No trade records are configured; bids and asks are not treated as executed trades.</StatePanel>:history.length?<div className="mp-table-scroll"><table className="mp-table"><thead><tr><th>Time</th><th>Side</th><th>Price</th><th>Quantity</th><th>Sample event</th></tr></thead><tbody>{history.map((record)=><tr key={record.id}><td>{new Date(record.timestamp).toLocaleString()}</td><td>{record.side}</td><td>{formatDemoPrice(record.price)}</td><td>{record.quantity}</td><td>{record.event}</td></tr>)}</tbody></table></div>:<StatePanel title="No bid/ask history">No timestamped order-history samples are configured.</StatePanel>}</section>;
}

function OrderEntryPanel({ item, demo, availableFunds, availableHoldings, bids, asks }) {
  const [side,setSide]=useState('BUY');const [type,setType]=useState('LIMIT');const [price,setPrice]=useState(String(item.bestAsk??item.askingPrice??''));const [quantity,setQuantity]=useState('1');const [confirm,setConfirm]=useState(false);const [feedback,setFeedback]=useState('');
  const qty=Number(quantity);const limitPrice=Number(price);const levels=side==='BUY'?[...asks].sort((a,b)=>a.price-b.price):[...bids].sort((a,b)=>b.price-a.price);const marketAvailable=levels.reduce((sum,level)=>sum+level.quantity,0);let simulatedCost=0;let filled=0;
  if(type==='MARKET'){for(const level of levels){if(filled>=qty)break;const take=Math.min(qty-filled,level.quantity);filled+=take;simulatedCost+=take*level.price;}}
  const unit=type==='MARKET'?(filled?simulatedCost/filled:0):limitPrice;const total=type==='MARKET'?simulatedCost:unit*qty;const isValid=Number.isInteger(qty)&&qty>0&&qty<=100&&(type==='MARKET'?filled>0:Number.isFinite(limitPrice)&&limitPrice>0)&& (side==='BUY'?total<=availableFunds:qty<=availableHoldings);
  const submit=()=>{let remaining=qty;let fillQty=0;let fillTotal=0;if(type==='MARKET'||(side==='BUY'&&limitPrice>0)||(side==='SELL'&&limitPrice>0)){for(const level of levels){if(remaining<=0)break;const crosses=type==='MARKET'||(side==='BUY'?level.price<=limitPrice:level.price>=limitPrice);if(!crosses)break;const take=Math.min(remaining,level.quantity);remaining-=take;fillQty+=take;fillTotal+=take*level.price;}}
    const unfilledMarketQuantity = type === 'MARKET' ? remaining : 0;
    const openQuantity = type === 'MARKET' ? 0 : remaining;
    const status=fillQty===0?'OPEN':remaining===0?'FILLED':'PARTIALLY_FILLED';demo.createOrder({marketId:item.id,itemName:item.itemName,side,type,price:type==='MARKET'?(fillQty?fillTotal/fillQty:null):limitPrice,requestedQuantity:qty,filledQuantity:fillQty,remainingQuantity:openQuantity,unfilledQuantity:unfilledMarketQuantity,status,filledNotional:fillTotal});setFeedback(`Demo order ${status.toLowerCase().replace('_',' ')} locally${unfilledMarketQuantity ? `; ${unfilledMarketQuantity} unfilled market unit(s) expired` : ''}. No real exchange order was sent.`);setConfirm(false);};
  return <section className="mp-panel mp-order-entry"><div className="mp-panel-heading"><div><h2>Place a demo order</h2><p>Nothing is sent to an exchange</p></div></div><div className="mp-side-switch"><button className={side==='BUY'?'is-active':''} onClick={()=>setSide('BUY')}>Buy</button><button className={side==='SELL'?'is-active sell-active':''} onClick={()=>setSide('SELL')}>Sell</button></div><div className="mp-type-switch"><button className={type==='LIMIT'?'is-active':''} onClick={()=>setType('LIMIT')}>Limit</button><button className={type==='MARKET'?'is-active':''} onClick={()=>setType('MARKET')}>Market</button></div>{type==='LIMIT'&&<label className="mp-order-field">Limit price<input type="number" min="0.01" step="0.01" value={price} onChange={(event)=>setPrice(event.target.value)}/></label>}<label className="mp-order-field">Quantity<input type="number" min="1" max="100" step="1" value={quantity} onChange={(event)=>setQuantity(event.target.value)}/></label><div className="mp-order-capacity"><span>{side==='BUY'?'Demo buying capacity':'Available demo holdings'}</span><b>{side==='BUY'?formatDemoPrice(availableFunds):`${availableHoldings} units`}</b>{type==='MARKET'&&<small>Sample liquidity · {marketAvailable} units</small>}</div><div className="mp-order-estimate"><span>Estimated total</span><b>{formatDemoPrice(total)}</b><small>{type==='MARKET'&&filled<qty?`Available sample liquidity fills ${filled} of ${qty} requested unit(s).`:type==='MARKET'?'Weighted from displayed sample levels.':`${formatDemoPrice(unit)} × ${qty}`}</small></div>{feedback&&<p className="mp-demo-feedback" role="status">{feedback}</p>}<button className="mp-button mp-button-primary mp-submit-order" disabled={!isValid} onClick={()=>setConfirm(true)}>Review {side.toLowerCase()} order</button>{!isValid&&<p className="mp-validation-note">{side==='SELL'&&qty>availableHoldings?'Quantity exceeds available demo holdings.':type==='MARKET'&&filled===0?'No sample liquidity is available.':side==='BUY'&&total>availableFunds?'Estimated order exceeds demo buying capacity.':'Enter a valid positive price and whole quantity.'}</p>}{confirm&&<div className="mp-modal-backdrop" role="presentation"><section className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="order-confirm-title"><button className="mp-modal-close" aria-label="Close order confirmation" onClick={()=>setConfirm(false)}>×</button><p className="mp-eyebrow">SIMULATED ORDER</p><h2 id="order-confirm-title">Confirm {side.toLowerCase()} order</h2><p>{type} · {qty} × {type==='MARKET'?'available sample liquidity':formatDemoPrice(unit)} · estimated {formatDemoPrice(total)}</p><p className="mp-modal-note">This stores a local demo order and never charges money or sends a real trade.</p><div className="mp-form-actions"><button className="mp-button mp-button-secondary" onClick={()=>setConfirm(false)}>Back</button><button className="mp-button mp-button-primary" onClick={submit}>Confirm demo order</button></div></section></div>}</section>;
}

function DemoArtwork({ item, large = false }) {
  const title = item.itemName || item.name;
  const event = item.eventName || item.event;
  const initials = title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return <div className={`mp-artwork art-${item.art || 'custom'}${large ? ' mp-artwork-large' : ''}`} role="img" aria-label={`Illustrative ${item.category} artwork for ${title}`}>{item.imageUrl && <img className="mp-artwork-image" src={item.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<span className="mp-art-kicker">ROUP EXAMPLE <i>·</i> {item.category.toUpperCase()}</span><span className="mp-art-ring"><b>{initials}</b><i /><i /></span><strong>{event.split(/[: ]/).filter(Boolean).slice(0, 2).join('\n').toUpperCase()}</strong><small>{title.toUpperCase()}</small></div>;
}

function MarketCard({ item, saved, onSave, onView, showDetailsLink = true }) {
  const book = item.orderBook;
  const spread = marketSpread(item);
  const hasBook = Boolean(book);
  const bids = book?.bids || [];
  const asks = book?.asks || [];
  const maxQty = Math.max(1, ...bids.map((level) => level.quantity), ...asks.map((level) => level.quantity));
  return <article className="mp-trading-card">
    <div className="mp-trading-art"><DemoArtwork item={item} /></div>
    <div className="mp-trading-info"><span className="mp-market-category">{item.category}</span><h3>{item.itemName}</h3><p className="mp-market-event">{item.eventName}</p>{item.description && <p className="mp-market-description">{item.description}</p>}<div className="mp-market-facts"><div><span>ORIGINAL FACE VALUE</span><b>{formatDemoPrice(item.faceValue)}</b></div><div><span>AVAILABLE QTY</span><b>{item.quantity}</b></div><div><span>STATUS</span><b className="mp-market-active">{item.status}</b></div></div><p className="mp-market-listing-ask"><span>THIS LISTING'S ASK</span><b>{formatDemoPrice(item.askingPrice)}</b></p></div>
    <aside className="mp-trading-metrics" aria-label={`${item.itemName} illustrative market metrics`}>
      <div className="mp-best-pair">
        <div><span className="mp-bid-label"><b>↘</b> BEST BID</span><strong>{hasBook ? (item.bestBid == null ? 'No bids' : formatDemoPrice(item.bestBid)) : 'Unavailable'}</strong><small>Highest buyer offer</small></div>
        <div><span className="mp-ask-label"><b>↗</b> BEST ASK</span><strong>{hasBook ? (item.bestAsk == null ? 'No asks' : formatDemoPrice(item.bestAsk)) : 'Unavailable'}</strong><small>Lowest seller offer</small></div>
      </div>
      <div className="mp-spread-wrap"><div><span>BID–ASK SPREAD</span><b>{spread ? `${formatDemoPrice(spread.spread)} · ${spread.percent.toFixed(2)}%` : 'Unavailable'}</b></div><div className={`mp-spread-track${spread ? '' : ' is-empty'}`} aria-label={spread ? `Bid ${formatDemoPrice(spread.bid)} to ask ${formatDemoPrice(spread.ask)}` : 'Bid and ask spread unavailable'}><span className="mp-spread-bid" /><span className="mp-spread-ask" /></div><div className="mp-spread-labels"><span>{spread ? `${formatDemoPrice(spread.bid)} Bid` : 'Bid unavailable'}</span><span>{spread ? `${formatDemoPrice(spread.ask)} Ask` : 'Ask unavailable'}</span></div></div>
      {hasBook && (bids.length + asks.length > 0) ? <div className="mp-depth-preview"><span>DEPTH · QTY</span><div>{[...bids.slice(0, 3).map((level) => ({ ...level, side: 'bid' })), ...asks.slice(0, 3).map((level) => ({ ...level, side: 'ask' }))].map((level) => <div className={`mp-depth-row ${level.side}`} key={`${level.side}-${level.price}`} title={`${level.side === 'bid' ? 'Bid' : 'Ask'} ${formatDemoPrice(level.price)} · quantity ${level.quantity}`}><span>{formatDemoPrice(level.price)}</span><i style={{ width: `${level.quantity / maxQty * 100}%` }} /><b>{level.quantity}</b></div>)}</div></div> : <p className="mp-depth-unavailable">No example depth levels configured.</p>}
      <div className="mp-market-actions">{showDetailsLink && <button className="mp-button mp-button-primary" type="button" onClick={onView}>View Market <span aria-hidden="true">↗</span></button>}<button className={`mp-watch-button${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={onSave}><AppIcon name="bookmark" size={15} />{saved ? 'Saved' : 'Watchlist'}</button></div>
    </aside>
  </article>;
}

function AuctionCard({ auction, onView, saved, onSave }) {
  const metrics = auctionPriceMetrics(auction);
  const displayPrice = auction.status === 'ACTIVE' ? auction.currentPrice : auction.status === 'ENDED' ? auction.finalPrice : null;
  return <article className="mp-auction-card">
    <div className="mp-auction-art-wrap"><DemoArtwork item={auction} /><span className={`mp-auction-status status-${auction.status.toLowerCase()}`}>{auction.status}</span><span className="mp-auction-id">{auction.id}</span></div>
    <div className="mp-auction-card-body"><div className="mp-auction-card-title"><div><div className="mp-auction-category">{auction.category} <i>· DEMO</i></div><h2>{auction.itemName}</h2></div><button className={`mp-watch-button${saved?' is-saved':''}`} type="button" aria-pressed={saved} onClick={onSave}>{saved?'Saved':'Watch'}</button></div><p className="mp-auction-event">{auction.eventName}</p><p className="mp-auction-description">{auction.description}</p>
      <div className="mp-auction-prices"><div><span>FACE VALUE</span><b>{formatDemoPrice(auction.faceValue)}</b></div><div><span>STARTING PRICE</span><b>{formatDemoPrice(auction.startingPrice)}</b></div><div><span>{auction.status === 'ENDED' ? 'FINAL PRICE' : auction.status === 'ACTIVE' ? 'CURRENT PRICE' : 'FLOOR PRICE'}</span><b>{formatDemoPrice(displayPrice ?? auction.floorPrice)}</b></div></div>
      <div className="mp-auction-progress-label"><span>PRICE DECAY</span><b>{metrics ? `${metrics.reductionPercent.toFixed(1)}% from start` : auction.status === 'UPCOMING' ? 'Not started' : 'Unavailable'}</b></div><div className="mp-auction-progress"><i style={{ width: `${metrics?.progress || 0}%` }} /></div>
      <div className="mp-auction-card-foot"><span>{auction.status === 'ACTIVE' ? `Remaining · ${auction.timingLabel}` : auction.status === 'UPCOMING' ? `Starts · ${auction.startsLabel}` : `Ended · ${auction.endsLabel}`}</span><span>{auction.quantity} available</span></div>
      <button className="mp-button mp-button-primary mp-view-auction" type="button" onClick={onView}>View Auction <span aria-hidden="true">↗</span></button>
    </div>
  </article>;
}

function AuctionPriceChart({ auction }) {
  const [activePoint,setActivePoint]=useState(null);
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
  return <div className="mp-auction-chart" aria-label={`Configured price schedule from ${formatDemoPrice(auction.startingPrice)} down to ${formatDemoPrice(auction.floorPrice)} over ${maxMinute} minutes${markerPrice == null ? '' : `, ${auction.status.toLowerCase()} example price ${formatDemoPrice(markerPrice)}`}`}>
    <div className="mp-chart-head"><div><span className="mp-eyebrow">PRICE DECAY</span><b>Configured schedule</b></div><span className="mp-chart-demo"><i /> LOCAL DEMO</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="group" aria-label="Focusable example auction price schedule points"><defs><linearGradient id="auctionDemoFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--mint)" stopOpacity=".24" /><stop offset="1" stopColor="var(--mint)" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3].map((index) => { const gy = top + index * (height - top - bottom) / 3; return <g key={index}><line x1={left} y1={gy} x2={width - right} y2={gy} className="mp-chart-gridline" /><text x={left - 10} y={gy + 4} textAnchor="end" className="mp-chart-label">{formatDemoPrice(maxPrice - index * (maxPrice - minPrice) / 3)}</text></g>; })}
      <polygon points={area} fill="url(#auctionDemoFill)" /><polyline points={line} className="mp-chart-line" />
      {points.map((point) => <g key={point.minute}><circle cx={x(point.minute)} cy={y(point.price)} r="13" className="mp-chart-hover-hit" tabIndex="0" role="button" aria-label={`${point.minute===0?'At start':`${point.minute} minutes from start`}, ${formatDemoPrice(point.price)}`} onMouseEnter={()=>setActivePoint(point)} onMouseLeave={()=>setActivePoint(null)} onFocus={()=>setActivePoint(point)} onBlur={()=>setActivePoint(null)}/><circle cx={x(point.minute)} cy={y(point.price)} r="4" className="mp-chart-point" /><title>{point.minute === 0 ? 'Start' : `+${point.minute} minutes`}: {formatDemoPrice(point.price)}</title></g>)}
      {markerPoint && <g><line x1={x(markerPoint.minute)} y1={top} x2={x(markerPoint.minute)} y2={height - bottom} className="mp-chart-marker-line" /><circle cx={x(markerPoint.minute)} cy={y(markerPoint.price)} r="7" className="mp-chart-current" /><title>{auction.status === 'ENDED' ? 'Final demo price' : 'Current demo price'}: {formatDemoPrice(markerPrice)}</title></g>}
      <text x={left} y={height - 12} className="mp-chart-label">START</text><text x={width - right} y={height - 12} textAnchor="end" className="mp-chart-label">{maxMinute} MIN</text>
    </svg>{activePoint&&<div className="mp-auction-tooltip"><b>{formatDemoPrice(activePoint.price)}</b><span>{activePoint.minute===0?'At auction start':`${activePoint.minute} minutes from start`}</span><span>{activePoint.price===auction.startingPrice?'Starting price':activePoint.price===auction.floorPrice?'Configured floor':auction.status==='ACTIVE'&&activePoint.price===auction.currentPrice?'Current demo price':'Scheduled drop'}</span></div>}
    <div className="mp-chart-ends"><span>Start · {formatDemoPrice(auction.startingPrice)}</span><span>Floor · {formatDemoPrice(auction.floorPrice)}</span></div>
  </div>;
}

function AuctionDetail({ auction, onBack, saved, onSave }) {
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
    <header className="mp-auction-detail-heading"><div><p className="mp-eyebrow">DUTCH AUCTION · {auction.id}</p><h1>{auction.itemName}</h1><p>{auction.eventName} · {auction.category}</p></div><div className="mp-auction-detail-actions"><span className={`mp-auction-status status-${auction.status.toLowerCase()}`}>{auction.status} · DEMO</span><button className={`mp-watch-button${saved?' is-saved':''}`} type="button" aria-pressed={saved} onClick={onSave}>{saved?'Saved':'Watch auction'}</button></div></header>
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
  const demo = useDemoData();
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
    {detailId ? (detail ? <AuctionDetail auction={detail} onBack={() => navigate('/auctions')} saved={demo.watchlist.includes(auctionWatchKey(detail.id))} onSave={()=>demo.toggleWatchlist('auction',detail.id)} /> : <><PageHeading eyebrow="DUTCH AUCTION" title="Auction not found." description="That example auction ID is not in the local Roup demo catalogue." /><StatePanel title="No matching auction"><button className="mp-button mp-button-primary" type="button" onClick={() => navigate('/auctions')}>Back to Auctions</button></StatePanel></>) : <>
      <PageHeading eyebrow="DUTCH PRICE-DECAY AUCTIONS" title="Watch the Price. Choose Your Moment." description="Explore festival passes and exclusive collectibles through auctions where prices decrease according to a predefined schedule." />
      <div className="mp-tabs" role="tablist" aria-label="Auction status">{['ACTIVE', 'UPCOMING', 'ENDED'].map((value) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} key={value} onClick={() => setTab(value)}>{value[0] + value.slice(1).toLowerCase()} <span>{demoAuctions.filter((auction) => auction.status === value).length}</span></button>)}</div>
      <div className="mp-auction-controls"><label className="mp-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="mp-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="ending">Ending soon</option><option value="added">Recently added</option><option value="price">Current price</option></select></label></div>
      {visible.length ? <div className="mp-auction-grid">{visible.map((auction) => <AuctionCard key={auction.id} auction={auction} saved={demo.watchlist.includes(auctionWatchKey(auction.id))} onSave={()=>demo.toggleWatchlist('auction',auction.id)} onView={() => navigate(`/auctions/${encodeURIComponent(auction.id)}`)} />)}</div> : <StatePanel title={`No ${tab.toLowerCase()} auctions match`} >Try a different search or category.</StatePanel>}
      <p className="mp-disclosure">Auction cards and schedules are deterministic local examples. Prices are not live or server-synchronised; no real purchase or reservation is made.</p>
    </>}
  </div></AppShell>;
}

export function OrdersPage() {
  const demo = useDemoData();
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const tabs = ['ALL', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED'];
  const visible = useMemo(() => demo.orders
    .filter((order) => (tab === 'ALL' || order.status === tab)
      && `${order.id} ${order.itemName} ${order.side} ${order.type}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  [demo.orders, tab, query, sort]);
  const metrics = [
    ['OPEN', 'Open Orders'],
    ['PARTIALLY_FILLED', 'Partially Filled'],
    ['FILLED', 'Filled'],
    ['CANCELLED', 'Cancelled'],
  ];
  const statusLabel = (status) => status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  return <AppShell currentPath="/orders" pageClass="marketplace-route-content"><div className="mp-page">
    <PageHeading eyebrow="LOCAL DEMO ACTIVITY" title="My Orders" description="Track your orders, review their status, and manage eligible open demo orders." />
    <div className="mp-metrics mp-order-metrics">{metrics.map(([status, label]) => <Metric key={status} label={label} value={demo.orders.filter((order) => order.status === status).length} detail="Local demo orders" />)}</div>
    <div className="mp-tabs" role="tablist" aria-label="Filter orders">{tabs.map((value) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} key={value} onClick={() => setTab(value)}>{value === 'ALL' ? 'All Orders' : statusLabel(value)}</button>)}</div>
    <div className="mp-order-controls"><label className="mp-control"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order ID or item" /></label><label className="mp-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    {!visible.length ? <StatePanel title={demo.orders.length ? 'No orders match these filters' : 'No demo orders yet'}>Place a clearly labelled demo order from a market detail page. No real order will be sent.</StatePanel> : <div className="mp-order-cards">{visible.map((order) => {
      const market = demoMarkets.find((item) => item.id === order.marketId);
      const listing = demo.listings.find((item) => item.id === order.marketId);
      const artwork = market || listing || { itemName: order.itemName, eventName: order.eventName || 'Roup demo market', category: 'Marketplace item', art: 'custom' };
      const canCancel = ['OPEN', 'PARTIALLY_FILLED'].includes(order.status) && order.remainingQuantity > 0;
      return <article className={`mp-order-card order-${order.side.toLowerCase()}`} key={order.id}>
        <header className="mp-order-card-head"><div className="mp-order-item"><DemoArtwork item={artwork} /><div><span className="mp-market-category">{artwork.category}</span><h2>{order.itemName}</h2><p>{artwork.eventName || artwork.event || 'Roup demo market'}</p></div></div><span className={`mp-status-badge status-${order.status.toLowerCase()}`}>{statusLabel(order.status)}</span></header>
        <div className="mp-order-card-id"><span>ORDER ID</span><b>{order.id}</b></div>
        <div className="mp-order-card-facts"><div><span>Side</span><b className={`order-side-value ${order.side.toLowerCase()}`}>{order.side}</b></div><div><span>Order type</span><b>{statusLabel(order.type)}</b></div><div><span>Order price</span><b>{order.price == null ? '—' : formatDemoPrice(order.price)}</b></div><div><span>Requested</span><b>{order.requestedQuantity}</b></div><div><span>Filled</span><b>{order.filledQuantity}</b></div><div><span>Remaining</span><b>{order.remainingQuantity}</b>{order.unfilledQuantity > 0 && <small>{order.unfilledQuantity} market unit(s) unfilled; remainder expired</small>}</div><div><span>Created</span><b>{new Date(order.createdAt).toLocaleString()}</b></div></div>
        <footer className="mp-order-card-foot">{canCancel ? <button className="mp-button mp-button-secondary" type="button" onClick={() => window.confirm(`Cancel remaining quantity on ${order.id}? This only updates the local demo.`) && demo.cancelOrder(order.id)}>Cancel Order</button> : <span>{order.status === 'FILLED' ? 'No action required' : order.status === 'CANCELLED' ? 'Order cancelled' : 'No open quantity'}</span>}</footer>
      </article>;
    })}</div>}
    <p className="mp-disclosure">Every order is a locally stored simulation. No orders, fills, funds or exchange activity are connected.</p>
  </div></AppShell>;
}
function ListingForm({ initial, onClose, onSave }) {
  const [form,setForm]=useState(initial||{itemName:'',eventName:'',category:'Festival Pass',description:'',faceValue:'',askingPrice:'',quantity:'1',eventDate:'',imageUrl:'',art:'custom'});const [error,setError]=useState('');
  const set=(key)=>(event)=>setForm((current)=>({...current,[key]:event.target.value}));
  const submit=(event)=>{event.preventDefault();const faceValue=Number(form.faceValue),askingPrice=Number(form.askingPrice),quantity=Number(form.quantity);if(!form.itemName.trim()||!form.eventName.trim()||!form.category)return setError('Item, event and category are required.');if(!Number.isFinite(faceValue)||faceValue<=0||!Number.isFinite(askingPrice)||askingPrice<=0)return setError('Enter positive face and asking prices.');if(askingPrice>faceValue*1.2)return setError('For this demo, the ask must be at or below 120% of face value.');if(!Number.isInteger(quantity)||quantity<1||quantity>20)return setError('Quantity must be a whole number from 1 to 20.');onSave({...form,itemName:form.itemName.trim(),eventName:form.eventName.trim(),faceValue,askingPrice,quantity});};
  return <div className="mp-modal-backdrop" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}><section className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="listing-form-title"><button className="mp-modal-close" type="button" onClick={onClose} aria-label="Close listing form">×</button><p className="mp-eyebrow">LOCAL DEMO LISTING</p><h2 id="listing-form-title">{initial?'Edit listing':'Create a listing'}</h2><p className="mp-modal-note">Saved in this browser only. It will not publish to an exchange or verify ownership.</p><form className="mp-form" onSubmit={submit}><label>Item name<input maxLength="120" value={form.itemName} onChange={set('itemName')} required/></label><label>Event or collection<input maxLength="140" value={form.eventName} onChange={set('eventName')} required/></label><label>Category<select value={form.category} onChange={set('category')}><option>Festival Pass</option><option>VIP Pass</option><option>Event Ticket</option><option>Collectible</option><option>Merchandise</option></select></label><label>Description<textarea rows="3" maxLength="400" value={form.description} onChange={set('description')}/></label><div className="mp-form-pair"><label>Face value<input type="number" min="0.01" step="0.01" value={form.faceValue} onChange={set('faceValue')} required/></label><label>Asking price<input type="number" min="0.01" step="0.01" value={form.askingPrice} onChange={set('askingPrice')} required/></label></div><div className="mp-form-pair"><label>Quantity<input type="number" min="1" max="20" step="1" value={form.quantity} onChange={set('quantity')} required/></label><label>Event date<input type="date" value={form.eventDate||''} onChange={set('eventDate')}/></label></div><label>Image URL (optional)<input type="url" value={form.imageUrl||''} onChange={set('imageUrl')} placeholder="https://…"/></label>{error&&<p className="mp-form-error" role="alert">{error}</p>}<div className="mp-form-actions"><button type="button" className="mp-button mp-button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="mp-button mp-button-primary">{initial?'Save changes':'Create demo listing'}</button></div></form></section></div>;
}

export function ListingsPage() {
  const demo=useDemoData();const [tab,setTab]=useState('ALL');const [query,setQuery]=useState('');const [dialog,setDialog]=useState(null);const [feedback,setFeedback]=useState('');
  const tabs=['ALL','ACTIVE','PAUSED','SOLD','REMOVED'];const visible=demo.listings.filter((item)=>(tab==='ALL'||item.status===tab)&&`${item.itemName} ${item.eventName} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const save=(body)=>{if(dialog?.item)demo.updateListing(dialog.item.id,body);else demo.saveListing(body);setFeedback(dialog?.item?'Demo listing updated locally.':'Demo listing created locally.');setDialog(null);};
  return <AppShell currentPath="/listings" searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search your demo listings…" pageClass="marketplace-route-content"><div className="mp-page"><PageHeading eyebrow="SELLER TOOLS · LOCAL DEMO" title="My Listings" description="Manage your listed items, update asking prices, and review availability." actions={<button className="mp-button mp-button-primary" type="button" onClick={()=>{setFeedback('');setDialog({item:null});}}>＋ Create listing</button>}/><div className="mp-metrics mp-listing-metrics"><Metric label="Active listings" value={demo.listings.filter((item)=>item.status==='ACTIVE').length} detail="Local demo catalogue"/><Metric label="Paused listings" value={demo.listings.filter((item)=>item.status==='PAUSED').length} detail="Hidden from demo Explore"/><Metric label="Sold listings" value={demo.listings.filter((item)=>item.status==='SOLD').length} detail="Sample status only"/></div><div className="mp-tabs" role="tablist" aria-label="Filter listings">{tabs.map((value)=><button role="tab" aria-selected={tab===value} className={tab===value?'is-active':''} key={value} onClick={()=>setTab(value)}>{value[0]+value.slice(1).toLowerCase()}</button>)}</div><div className="mp-order-controls"><label className="mp-control"><span>Search</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Item, event or category"/></label></div>{feedback&&<p className="mp-demo-feedback" role="status">{feedback}</p>}{!visible.length?<StatePanel title="No listings in this view">Create a local demo listing to try the listing-management flow.</StatePanel>:<div className="mp-listing-cards">{visible.map((item)=><article className="mp-owned-listing" key={item.id}><DemoArtwork item={item}/><div className="mp-owned-listing-copy"><span className="mp-market-category">{item.category} · DEMO</span><h2>{item.itemName}</h2><p>{item.eventName}</p><p className="mp-owned-description">{item.description||'No description provided.'}</p><div className="mp-owned-facts"><span>Face value <b>{formatDemoPrice(item.faceValue)}</b></span><span>Ask <b>{formatDemoPrice(item.askingPrice)}</b></span><span>Quantity <b>{item.quantity}</b></span><span>Status <b>{item.status}</b></span><span>Updated <b>{date(item.updatedAt)}</b></span></div><div className="mp-owned-actions">{['ACTIVE','PAUSED'].includes(item.status)&&<><button onClick={()=>setDialog({item,initial:{...item,faceValue:String(item.faceValue),askingPrice:String(item.askingPrice),quantity:String(item.quantity)}})}>Edit</button><button onClick={()=>demo.updateListing(item.id,{status:item.status==='ACTIVE'?'PAUSED':'ACTIVE'})}>{item.status==='ACTIVE'?'Pause':'Resume'}</button><button className="is-danger" onClick={()=>window.confirm(`Remove ${item.itemName} from your local demo listings?`)&&demo.removeListing(item.id)}>Remove</button></>}</div></div></article>)}</div>}<p className="mp-disclosure">Listings and status changes are persisted locally in this browser. Nothing is published, sold, or verified by an exchange.</p>{dialog&&<ListingForm initial={dialog.initial} onClose={()=>setDialog(null)} onSave={save}/>}</div></AppShell>;
}

export function WatchlistPage() {
  const demo=useDemoData();const navigate=useNavigate();const [tab,setTab]=useState('ALL');
  const savedMarkets=demo.watchlist.filter((key)=>key.startsWith('market:')).map((key)=>key.slice(7)).map((id)=>demoMarkets.find((market)=>market.id===id)||demo.listings.find((listing)=>listing.id===id)).filter(Boolean);
  const savedAuctions=demo.watchlist.filter((key)=>key.startsWith('auction:')).map((key)=>key.slice(8)).map((id)=>demoAuctions.find((auction)=>auction.id===id)).filter(Boolean);
  const marketItems=savedMarkets.filter((item)=>tab==='ALL'||tab==='MARKETS'&&(item.status||'ACTIVE')==='ACTIVE'||tab==='UPCOMING_MARKETS'&&(item.status==='UPCOMING'||item.eventStatus==='UPCOMING'));
  const auctionItems=savedAuctions.filter((item)=>tab==='ALL'||tab==='ACTIVE_AUCTIONS'&&item.status==='ACTIVE'||tab==='UPCOMING_AUCTIONS'&&item.status==='UPCOMING');
  const remove=(type,id)=>demo.toggleWatchlist(type,id);
  return <AppShell currentPath="/watchlist" pageClass="marketplace-route-content"><div className="mp-page"><PageHeading eyebrow="SAVED FOR LATER" title="Your Watchlist" description="Keep example markets and Dutch auctions together as their statuses change."/><div className="mp-tabs mp-watchlist-tabs" role="tablist" aria-label="Filter watchlist">{[['ALL','All saved'],['MARKETS','Current markets'],['UPCOMING_MARKETS','Upcoming markets'],['ACTIVE_AUCTIONS','Active auctions'],['UPCOMING_AUCTIONS','Upcoming auctions']].map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} className={tab===value?'is-active':''} onClick={()=>setTab(value)}>{label}</button>)}</div><div className="mp-watchlist-grid">{marketItems.map((item)=><article className="mp-watch-card" key={`market-${item.id}`}><DemoArtwork item={item}/><div><span className="mp-market-category">MARKET · {item.status||'ACTIVE'}</span><h2>{item.itemName}</h2><p>{item.eventName}</p><div className="mp-watch-facts"><span>Face value <b>{formatDemoPrice(item.faceValue)}</b></span><span>Best bid <b>{item.bestBid==null?'Unavailable':formatDemoPrice(item.bestBid)}</b></span><span>Best ask <b>{item.bestAsk==null?'Unavailable':formatDemoPrice(item.bestAsk)}</b></span><span>Availability <b>{['REMOVED','PAUSED','SOLD'].includes(item.status)?'Unavailable':`${item.quantity} demo units`}</b></span></div><div className="mp-owned-actions">{['REMOVED','PAUSED','SOLD'].includes(item.status)?<button className="mp-button mp-button-secondary" type="button" disabled>Market unavailable</button>:<button className="mp-button mp-button-primary" onClick={()=>navigate(`/markets/${encodeURIComponent(item.id)}`)}>View Market</button>}<button onClick={()=>remove('market',item.id)}>Remove</button></div></div></article>)}{auctionItems.map((item)=><article className="mp-watch-card" key={`auction-${item.id}`}><DemoArtwork item={item}/><div><span className={`mp-auction-status status-${item.status.toLowerCase()}`}>{item.status} AUCTION</span><h2>{item.itemName}</h2><p>{item.eventName} · {item.category}</p><div className="mp-watch-facts"><span>Starting price <b>{formatDemoPrice(item.startingPrice)}</b></span><span>Current price <b>{item.status==='ACTIVE'?formatDemoPrice(item.currentPrice):item.status==='ENDED'?formatDemoPrice(item.finalPrice):'Not started'}</b></span><span>Floor <b>{formatDemoPrice(item.floorPrice)}</b></span><span>{item.status==='ACTIVE'?'Remaining':'Schedule'} <b>{item.status==='ACTIVE'?item.timingLabel:item.status==='UPCOMING'?item.startsLabel:item.endsLabel}</b></span></div><div className="mp-owned-actions"><button className="mp-button mp-button-primary" onClick={()=>navigate(`/auctions/${encodeURIComponent(item.id)}`)}>View Auction</button><button onClick={()=>remove('auction',item.id)}>Remove</button></div></div></article>)}{!marketItems.length&&!auctionItems.length&&<StatePanel title="Nothing saved in this view">{demo.watchlist.length?<span>No saved items match this watchlist section.</span>:<span>Save a market or auction to collect it here. <button className="mp-inline-link" onClick={()=>navigate(tab.includes('AUCTION')?'/auctions':'/explore')}>Explore {tab.includes('AUCTION')?'auctions':'the marketplace'}</button></span>}</StatePanel>}</div><p className="mp-disclosure">Watchlist items persist in this browser only. Status and prices are local examples, not live availability.</p></div></AppShell>;
}
