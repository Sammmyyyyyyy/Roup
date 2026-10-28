import React, { useEffect, useMemo, useState } from 'react';
import AppShell, { AppIcon } from '../components/layout/AppShell.jsx';
import { useAuth, useNavigate } from '../store/appContext.js';
import {
  acceptAuctionPrice,
  createAuction,
  createMarket,
  endAuction,
  getAuction,
  getAuctions,
  getMarket,
  getMarkets,
  placeBuyOrder,
  placeSellOrder,
  updateAuction,
  updateMarket,
} from '../api/marketplaceService.js';
import {
  getStoredOrders,
  getWatchlist,
  isWatchlisted,
  saveOrder,
  toggleWatchlist,
} from '../utils/orderStorage.js';
import { useAuctionLiveUpdates, useMarketOrderBook } from '../api/webSocketService.js';
import '../styles/marketplacePages.css';

const decode = (value) => {
  try { return decodeURIComponent(value); } catch { return ''; }
};

function Heading({ title, description, actions }) {
  return (
    <header className="mp-heading">
      <div>
        <p className="mp-eyebrow">ROUP MARKETPLACE</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="mp-heading-actions">{actions}</div>}
    </header>
  );
}

function LoadState({ state, error, retry, empty, emptyText = 'No records are currently available.' }) {
  if (state === 'loading') {
    return (
      <div className="mp-state" role="status">
        <span className="auth-spinner" style={{ width: '28px', height: '28px', marginBottom: '14px' }} />
        <b>Loading data from Roup…</b>
        <p>Connecting to backend microservices.</p>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="mp-state mp-state-error" role="alert">
        <span className="mp-state-mark">!</span>
        <b>Data is currently unavailable</b>
        <p>{error}</p>
        <button className="mp-button mp-button-secondary" type="button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }
  if (state === 'ready' && empty) {
    return (
      <div className="mp-state" role="status">
        <span className="mp-state-mark">Ø</span>
        <b>{emptyText}</b>
        <p>New records will appear once created or submitted to the exchange.</p>
      </div>
    );
  }
  return null;
}

function useRemote(load, key) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  const refresh = async () => {
    setState('loading');
    setError('');
    try {
      const res = await load();
      setData(res);
      setState('ready');
    } catch (e) {
      setError(e.message);
      setState('error');
    }
  };

  useEffect(() => {
    refresh();
  }, [key]);

  return { data, state, error, refresh, setData };
}

// ==========================================
// LIVE WEBSOCKET ORDER BOOK & DEPTH CHART
// ==========================================

function LiveOrderBookDepth({ marketId, faceValue, maxPrice }) {
  const { orderBook, isConnected } = useMarketOrderBook(marketId);

  // Sort bids descending (highest buy offer first)
  const sortedBids = useMemo(() => {
    return [...(orderBook.bids || [])].sort((a, b) => Number(b.price) - Number(a.price));
  }, [orderBook.bids]);

  // Sort asks ascending (lowest sell offer first)
  const sortedAsks = useMemo(() => {
    return [...(orderBook.asks || [])].sort((a, b) => Number(a.price) - Number(b.price));
  }, [orderBook.asks]);

  const bestBid = sortedBids[0]?.price ? Number(sortedBids[0].price) : null;
  const bestAsk = sortedAsks[0]?.price ? Number(sortedAsks[0].price) : null;
  const spread = bestBid && bestAsk ? Math.max(0, bestAsk - bestBid) : null;

  const maxBidQty = Math.max(1, ...sortedBids.map((b) => Number(b.volume ?? b.quantity) || 1));
  const maxAskQty = Math.max(1, ...sortedAsks.map((a) => Number(a.volume ?? a.quantity) || 1));

  // Compute SVG depth coordinates
  const depthSvg = useMemo(() => {
    const width = 500;
    const height = 140;

    let totalBidVolume = 0;
    const cumBids = sortedBids.map((b) => {
      totalBidVolume += Number(b.volume ?? b.quantity) || 0;
      return { price: Number(b.price), cumQty: totalBidVolume };
    });

    let totalAskVolume = 0;
    const cumAsks = sortedAsks.map((a) => {
      totalAskVolume += Number(a.volume ?? a.quantity) || 0;
      return { price: Number(a.price), cumQty: totalAskVolume };
    });

    const maxCum = Math.max(1, totalBidVolume, totalAskVolume);

    // Build SVG polygons
    // Bids fill from left to center
    let bidPoints = `0,${height} `;
    if (cumBids.length > 0) {
      cumBids.forEach((cb, idx) => {
        const x = (idx / cumBids.length) * 235;
        const y = height - (cb.cumQty / maxCum) * (height - 20);
        bidPoints += `${x},${y} `;
      });
      bidPoints += `235,${height - (totalBidVolume / maxCum) * (height - 20)} 235,${height}`;
    } else {
      bidPoints = `0,${height} 235,${height}`;
    }

    // Asks fill from center to right
    let askPoints = `265,${height} `;
    if (cumAsks.length > 0) {
      cumAsks.forEach((ca, idx) => {
        const x = 265 + (idx / cumAsks.length) * 235;
        const y = height - (ca.cumQty / maxCum) * (height - 20);
        askPoints += `${x},${y} `;
      });
      askPoints += `${width},${height - (totalAskVolume / maxCum) * (height - 20)} ${width},${height}`;
    } else {
      askPoints = `265,${height} ${width},${height}`;
    }

    return { width, height, bidPoints, askPoints, maxCum };
  }, [sortedBids, sortedAsks]);

  return (
    <article className="mp-panel" style={{ marginTop: '18px', overflow: 'hidden' }}>
      <div className="mp-panel-heading" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2>Live Market Depth &amp; Order Book</h2>
          <p>Real-time order book broadcast from MatchingEngine via /ws/markets</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className={`mp-status-badge ${isConnected ? 'status-active' : 'status-paused'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isConnected ? 'var(--mint)' : '#888',
                boxShadow: isConnected ? '0 0 8px rgba(75,226,160,.8)' : 'none',
              }}
            />
            {isConnected ? 'WebSocket Connected' : 'Connecting WS…'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Best Bid / Spread / Best Ask Banner */}
        <div className="mp-best-pair" style={{ marginBottom: '18px', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(75,226,160,.06)', border: '1px solid rgba(75,226,160,.18)' }}>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>BEST BUY BID</span>
            <strong style={{ fontSize: '20px', color: 'var(--mint)', display: 'block', marginTop: '2px' }}>
              {bestBid ? `$${bestBid.toFixed(2)}` : 'None'}
            </strong>
            <small style={{ color: 'var(--quiet)' }}>Highest buyer offer</small>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--panel-light)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>SPREAD</span>
            <strong style={{ fontSize: '20px', color: 'var(--text)', display: 'block', marginTop: '2px' }}>
              {spread !== null ? `$${spread.toFixed(2)}` : 'N/A'}
            </strong>
            <small style={{ color: 'var(--quiet)' }}>Bid-Ask Delta</small>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(193,164,107,.06)', border: '1px solid rgba(193,164,107,.18)', textAlign: 'right' }}>
            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>BEST SELL ASK</span>
            <strong style={{ fontSize: '20px', color: '#c1a46b', display: 'block', marginTop: '2px' }}>
              {bestAsk ? `$${bestAsk.toFixed(2)}` : 'None'}
            </strong>
            <small style={{ color: 'var(--quiet)' }}>Lowest seller ask</small>
          </div>
        </div>

        {/* Real-Time SVG Depth Chart */}
        <div style={{ margin: '14px 0 20px', padding: '14px', borderRadius: '8px', background: 'var(--panel-light)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: 'var(--muted)' }}>
            <span style={{ color: 'var(--mint)', fontWeight: '600' }}>◀ Cumulative Buy Depth</span>
            <span>Real-Time Depth Curve</span>
            <span style={{ color: '#c1a46b', fontWeight: '600' }}>Cumulative Sell Depth ▶</span>
          </div>

          <svg
            viewBox={`0 0 ${depthSvg.width} ${depthSvg.height}`}
            style={{ width: '100%', height: '140px', overflow: 'hidden' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4be2a0" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4be2a0" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c1a46b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c1a46b" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Center Midline */}
            <line x1="250" y1="0" x2="250" y2={depthSvg.height} stroke="var(--line-hi)" strokeDasharray="3 3" />

            {/* Bid Polygon */}
            <polygon points={depthSvg.bidPoints} fill="url(#bidGrad)" stroke="#4be2a0" strokeWidth="1.5" />

            {/* Ask Polygon */}
            <polygon points={depthSvg.askPoints} fill="url(#askGrad)" stroke="#c1a46b" strokeWidth="1.5" />
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--quiet)' }}>
            <span>Face Value: ${faceValue ?? '0'}</span>
            <span>Midmarket: {bestBid && bestAsk ? `$${((bestBid + bestAsk) / 2).toFixed(2)}` : 'Awaiting Bids'}</span>
            <span>Resale Cap: ${maxPrice ?? 'N/A'}</span>
          </div>
        </div>

        {/* Live Order Book Ladder Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* BIDS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--line)', fontSize: '11px', color: 'var(--quiet)', fontWeight: '600' }}>
              <span>BUY PRICE</span>
              <span>VOLUME</span>
            </div>
            {sortedBids.length === 0 ? (
              <p style={{ padding: '16px 0', fontSize: '12px', color: 'var(--quiet)', textAlign: 'center' }}>
                No active buy bids in order book.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '4px', marginTop: '6px' }}>
                {sortedBids.slice(0, 8).map((b, idx) => {
                  const qty = Number(b.volume ?? b.quantity) || 0;
                  const pct = Math.min(100, (qty / maxBidQty) * 100);
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: `${pct}%`,
                          background: 'rgba(75,226,160,.12)',
                          zIndex: 0,
                        }}
                      />
                      <b style={{ color: 'var(--mint)', position: 'relative', zIndex: 1 }}>
                        ${Number(b.price).toFixed(2)}
                      </b>
                      <span style={{ color: 'var(--text)', position: 'relative', zIndex: 1, fontFamily: 'var(--mono)' }}>
                        {qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ASKS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--line)', fontSize: '11px', color: 'var(--quiet)', fontWeight: '600' }}>
              <span>SELL PRICE</span>
              <span>VOLUME</span>
            </div>
            {sortedAsks.length === 0 ? (
              <p style={{ padding: '16px 0', fontSize: '12px', color: 'var(--quiet)', textAlign: 'center' }}>
                No active sell asks in order book.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '4px', marginTop: '6px' }}>
                {sortedAsks.slice(0, 8).map((a, idx) => {
                  const qty = Number(a.volume ?? a.quantity) || 0;
                  const pct = Math.min(100, (qty / maxAskQty) * 100);
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${pct}%`,
                          background: 'rgba(193,164,107,.12)',
                          zIndex: 0,
                        }}
                      />
                      <b style={{ color: '#c1a46b', position: 'relative', zIndex: 1 }}>
                        ${Number(a.price).toFixed(2)}
                      </b>
                      <span style={{ color: 'var(--text)', position: 'relative', zIndex: 1, fontFamily: 'var(--mono)' }}>
                        {qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// LIVE DUTCH AUCTION DECAY CHART & WEBSOCKET STREAM
// ==========================================

function LiveAuctionDecayChart({ auction }) {
  const { latestEvent, isConnected } = useAuctionLiveUpdates(auction.id);

  // Real-time ticking time to compute decay progression
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startingPrice = Number(auction.startingPrice || 250);
  const minPrice = Number(auction.minimumPrice || 50);

  // Dynamic live decayed price computed from schedule and intervals
  const currentPrice = useMemo(() => {
    if (latestEvent?.type === 'AUCTION_CLOSED_WINNER' && latestEvent.payload?.bidAmount) {
      return Number(latestEvent.payload.bidAmount);
    }
    const basePrice = Number(auction.currentPrice ?? startingPrice);
    if (!auction.isActive || !auction.startTime || !auction.decayAmount || !auction.decayIntervalSeconds) {
      return basePrice;
    }
    const startMs = new Date(auction.startTime).getTime();
    if (isNaN(startMs)) return basePrice;
    const elapsedSec = Math.max(0, (now - startMs) / 1000);
    const intervals = Math.floor(elapsedSec / Number(auction.decayIntervalSeconds));
    const totalDecay = intervals * Number(auction.decayAmount);
    return Math.max(minPrice, startingPrice - totalDecay);
  }, [auction, startingPrice, minPrice, now, latestEvent]);

  // Calculate curve visual coordinates
  const chartSvg = useMemo(() => {
    const width = 500;
    const height = 150;
    const range = Math.max(1, startingPrice - minPrice);
    const progress = Math.max(0, Math.min(1, (startingPrice - currentPrice) / range));
    const currentX = 20 + progress * 460;
    const currentY = 20 + progress * 100;

    return { width, height, currentX, currentY };
  }, [startingPrice, currentPrice, minPrice]);

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Live WebSocket Event Notification */}
      {latestEvent && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${latestEvent.type === 'AUCTION_CLOSED_WINNER' ? 'rgba(75,226,160,.4)' : 'rgba(207,128,120,.4)'}`,
            background: latestEvent.type === 'AUCTION_CLOSED_WINNER' ? 'rgba(75,226,160,.1)' : 'rgba(207,128,120,.1)',
            color: latestEvent.type === 'AUCTION_CLOSED_WINNER' ? 'var(--mint)' : '#cf8078',
            fontSize: '13px',
          }}
          role="status"
        >
          <b>Live Stream Event:</b>{' '}
          {latestEvent.type === 'AUCTION_CLOSED_WINNER'
            ? `Auction Winner Declared! Buyer: ${latestEvent.payload?.userId || 'Confirmed'} at $${latestEvent.payload?.bidAmount || currentPrice}`
            : `Bid Update: ${latestEvent.type}`}
        </div>
      )}

      {/* Real-Time Price Decay SVG Chart */}
      <div className="mp-auction-chart">
        <div className="mp-chart-head">
          <div>
            <p className="mp-eyebrow">LIVE DUTCH AUCTION DECAY</p>
            <b>Descending Price Curve</b>
          </div>
          <span
            className={`mp-status-badge ${isConnected ? 'status-active' : 'status-paused'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? 'var(--mint)' : '#888',
                boxShadow: isConnected ? '0 0 6px rgba(75,226,160,.8)' : 'none',
              }}
            />
            {isConnected ? 'Live WS Connected' : 'Connecting WS…'}
          </span>
        </div>

        <svg viewBox="0 0 500 150" style={{ width: '100%', height: '140px' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="auctionDecayGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="20" x2="480" y2="20" className="mp-chart-gridline" />
          <line x1="20" y1="70" x2="480" y2="70" className="mp-chart-gridline" />
          <line x1="20" y1="120" x2="480" y2="120" className="mp-chart-gridline" />

          {/* Fill area */}
          <path
            d="M20 20 C180 35, 320 85, 480 120 L480 150 L20 150 Z"
            fill="url(#auctionDecayGlow)"
          />

          {/* Curve */}
          <path
            d="M20 20 C180 35, 320 85, 480 120"
            className="mp-chart-line"
          />

          {/* Start point */}
          <circle cx="20" cy="20" r="4" className="mp-chart-point" />

          {/* End/Floor point */}
          <circle cx="480" cy="120" r="4" className="mp-chart-point" />

          {/* Moving Current Price indicator */}
          <line
            x1={chartSvg.currentX}
            y1="10"
            x2={chartSvg.currentX}
            y2="140"
            className="mp-chart-marker-line"
          />
          <circle
            cx={chartSvg.currentX}
            cy={chartSvg.currentY}
            r="6"
            className="mp-chart-current"
          />
        </svg>

        <div className="mp-chart-ends" style={{ fontSize: '11px', marginTop: '6px' }}>
          <span>Start: ${startingPrice.toFixed(2)}</span>
          <span style={{ color: 'var(--mint)', fontWeight: '600' }}>Current Ask: ${currentPrice.toFixed(2)}</span>
          <span>Reserve Floor: ${minPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MARKETS PAGE
// ==========================================

export function MarketsPage({ path = '/markets' }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const id = path.startsWith('/markets/') ? decode(path.slice(9)) : '';
  const result = useRemote(() => (id ? getMarket(id) : getMarkets()), id || 'markets');
  const list = Array.isArray(result.data) ? result.data : [];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [orderSide, setOrderSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [orderPrice, setOrderPrice] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState({ type: '', message: '' });
  const [watchVersion, setWatchVersion] = useState(0);

  const market = id ? result.data : null;
  const inWatchlist = market ? isWatchlisted(market.assetId) : false;

  const handleToggleWatch = (m) => {
    toggleWatchlist({ id: m.assetId, name: m.assetName, type: 'market' });
    setWatchVersion((v) => v + 1);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (orderLoading || !market) return;

    const priceNum = parseFloat(orderPrice);
    const qtyNum = parseInt(orderQuantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setOrderFeedback({ type: 'error', message: 'Enter a valid price greater than 0.' });
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setOrderFeedback({ type: 'error', message: 'Enter a valid quantity (1 or more).' });
      return;
    }

    if (market.maximumResalePrice && priceNum > market.maximumResalePrice) {
      setOrderFeedback({
        type: 'error',
        message: `Order price exceeds maximum resale price cap ($${market.maximumResalePrice}).`,
      });
      return;
    }

    setOrderLoading(true);
    setOrderFeedback({ type: '', message: '' });

    try {
      const payload = {
        assetId: market.assetId,
        userId: session?.user?.id || 'anonymous',
        price: priceNum,
        quantity: qtyNum,
      };

      let responseMsg = '';
      if (orderSide === 'BUY') {
        responseMsg = await placeBuyOrder(payload);
      } else {
        responseMsg = await placeSellOrder(payload);
      }

      // Save order to history
      const orderId =
        typeof responseMsg === 'string' && responseMsg.includes('Order ID: ')
          ? responseMsg.split('Order ID: ')[1].trim()
          : `ORD_${Date.now()}`;

      saveOrder({
        id: orderId,
        assetId: market.assetId,
        assetName: market.assetName || market.assetId,
        side: orderSide,
        price: priceNum,
        quantity: qtyNum,
        timestamp: new Date().toISOString(),
        status: 'QUEUED',
      });

      setOrderFeedback({
        type: 'success',
        message:
          typeof responseMsg === 'string'
            ? responseMsg
            : `${orderSide} order queued successfully for ${qtyNum}x @ $${priceNum}!`,
      });
      setOrderPrice('');
      setOrderQuantity('1');
    } catch (err) {
      setOrderFeedback({
        type: 'error',
        message: err.message || 'Failed to place order. Check your balance or try again.',
      });
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <AppShell currentPath="/markets" pageClass="marketplace-route-content">
      <div className="mp-page">
        {id && (
          <button className="mp-back" type="button" onClick={() => navigate('/markets')}>
            ← Back to all markets
          </button>
        )}

        <Heading
          title={id ? (market?.assetName || 'Market details') : 'Secondary Markets'}
          description={
            id
              ? 'Real-time order depth chart via WebSocket and order execution powered by Auction-Svc.'
              : 'Browse active secondary markets, trade with price caps, or create a new market.'
          }
          actions={
            !id && (
              <button
                className="mp-button mp-button-primary"
                type="button"
                onClick={() => setCreateModalOpen(true)}
              >
                + Create Market
              </button>
            )
          }
        />

        <LoadState
          state={result.state}
          error={result.error}
          retry={result.refresh}
          empty={id ? !market : !list.length}
          emptyText={id ? 'Market not found.' : 'No active secondary markets available.'}
        />

        {result.state === 'ready' && !id && list.length > 0 && (
          <div className="mp-market-cards">
            {list.map((m) => (
              <article className="mp-panel" key={m.assetId}>
                <div className="mp-panel-heading">
                  <div>
                    <h2>{m.assetName || 'Unnamed Asset'}</h2>
                    <p>{m.assetDescription || 'No description supplied.'}</p>
                  </div>
                  <span className={`mp-status-badge ${m.isTradingActive ? 'status-active' : 'status-paused'}`}>
                    {m.isTradingActive ? 'Trading Active' : 'Trading Inactive'}
                  </span>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div className="mp-detail-pairs" style={{ marginBottom: '14px' }}>
                    <div>
                      <span>Asset ID</span>
                      <b>{m.assetId}</b>
                    </div>
                    <div>
                      <span>Face Value</span>
                      <b>${m.originalFaceValue ?? 'N/A'}</b>
                    </div>
                    <div>
                      <span>Resale Cap</span>
                      <b>{m.capMultiplier ? `${m.capMultiplier}x` : 'N/A'}</b>
                    </div>
                    <div>
                      <span>Max Resale Price</span>
                      <b style={{ color: 'var(--mint)' }}>
                        {m.maximumResalePrice ? `$${m.maximumResalePrice}` : 'N/A'}
                      </b>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="mp-button mp-button-primary"
                      type="button"
                      onClick={() => navigate(`/markets/${encodeURIComponent(m.assetId)}`)}
                    >
                      Trade &amp; Live Depth →
                    </button>
                    <button
                      className={`mp-watch-button ${isWatchlisted(m.assetId) ? 'is-saved' : ''}`}
                      type="button"
                      onClick={() => handleToggleWatch(m)}
                    >
                      ★ {isWatchlisted(m.assetId) ? 'Saved' : 'Watch'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SINGLE MARKET VIEW */}
        {result.state === 'ready' && id && market && (
          <div className="mp-detail-layout">
            <div>
              <article className="mp-panel">
                <div className="mp-panel-heading">
                  <div>
                    <h2>Market Specification</h2>
                    <p>Asset ID: {market.assetId}</p>
                  </div>
                  <span className={`mp-status-badge ${market.isTradingActive ? 'status-active' : 'status-paused'}`}>
                    {market.isTradingActive ? 'Trading Active' : 'Trading Inactive'}
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '13px' }}>
                    {market.assetDescription || 'No description supplied.'}
                  </p>
                  <div className="mp-detail-pairs">
                    <div>
                      <span>Original Face Value</span>
                      <b style={{ fontSize: '16px' }}>${market.originalFaceValue ?? '0.00'}</b>
                    </div>
                    <div>
                      <span>Maximum Resale Price</span>
                      <b style={{ fontSize: '16px', color: 'var(--mint)' }}>
                        ${market.maximumResalePrice ?? '0.00'}
                      </b>
                    </div>
                    <div>
                      <span>Resale Cap Multiplier</span>
                      <b>{market.capMultiplier ? `${market.capMultiplier}x` : 'None'}</b>
                    </div>
                    <div>
                      <span>Total Original Quantity</span>
                      <b>{market.totalOriginalQuantity ?? 'N/A'} units</b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button
                      className="mp-button mp-button-secondary"
                      type="button"
                      onClick={() => setEditModalOpen(true)}
                    >
                      Edit Market Config
                    </button>
                    <button
                      className={`mp-watch-button ${inWatchlist ? 'is-saved' : ''}`}
                      type="button"
                      onClick={() => handleToggleWatch(market)}
                    >
                      ★ {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </article>

              {/* LIVE WEBSOCKET DEPTH CHART */}
              <LiveOrderBookDepth
                marketId={id}
                faceValue={market.originalFaceValue}
                maxPrice={market.maximumResalePrice}
              />
            </div>

            {/* ORDER PLACEMENT PANEL */}
            <div>
              <div className="mp-panel mp-purchase-panel">
                <div className="mp-panel-heading">
                  <div>
                    <h2>Place Market Order</h2>
                    <p>Execute through matching engine</p>
                  </div>
                </div>

                <div className="mp-tabs" style={{ margin: '0 0 14px' }}>
                  <button
                    type="button"
                    className={orderSide === 'BUY' ? 'is-active' : ''}
                    onClick={() => { setOrderSide('BUY'); setOrderFeedback({ type: '', message: '' }); }}
                  >
                    Buy Order
                  </button>
                  <button
                    type="button"
                    className={orderSide === 'SELL' ? 'is-active' : ''}
                    onClick={() => { setOrderSide('SELL'); setOrderFeedback({ type: '', message: '' }); }}
                  >
                    Sell Order
                  </button>
                </div>

                {orderFeedback.message && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      fontSize: '11px',
                      border: `1px solid ${orderFeedback.type === 'error' ? 'rgba(207,128,120,.4)' : 'rgba(75,226,160,.4)'}`,
                      background: orderFeedback.type === 'error' ? 'rgba(207,128,120,.1)' : 'rgba(75,226,160,.1)',
                      color: orderFeedback.type === 'error' ? '#cf8078' : 'var(--mint)',
                    }}
                    role={orderFeedback.type === 'error' ? 'alert' : 'status'}
                  >
                    {orderFeedback.message}
                  </div>
                )}

                <form className="mp-form" onSubmit={handlePlaceOrder} style={{ marginTop: '0' }}>
                  <label>
                    Limit Price ($ USD)
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={market.maximumResalePrice || undefined}
                      placeholder={market.maximumResalePrice ? `Max $${market.maximumResalePrice}` : '0.00'}
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      required
                    />
                  </label>

                  <div className="mp-total-row">
                    <span>Order Value</span>
                    <b>
                      ${((parseFloat(orderPrice) || 0) * (parseInt(orderQuantity, 10) || 0)).toFixed(2)}
                    </b>
                  </div>

                  <button
                    className={`mp-button ${orderSide === 'BUY' ? 'mp-button-primary' : 'mp-button-secondary'}`}
                    type="submit"
                    disabled={orderLoading || !orderPrice || !market.isTradingActive}
                    style={{ width: '100%', minHeight: '40px', marginTop: '8px' }}
                  >
                    {orderLoading
                      ? 'Queuing Order...'
                      : !market.isTradingActive
                      ? 'Trading Inactive'
                      : `Submit ${orderSide} Order`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CREATE MARKET MODAL */}
        {createModalOpen && (
          <CreateMarketModal
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              result.refresh();
            }}
          />
        )}

        {/* EDIT MARKET MODAL */}
        {editModalOpen && market && (
          <EditMarketModal
            market={market}
            onClose={() => setEditModalOpen(false)}
            onSuccess={(updated) => {
              setEditModalOpen(false);
              result.setData(updated);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

function CreateMarketModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    assetId: `ASSET_${Date.now().toString().slice(-6)}`,
    assetName: '',
    assetImage: '',
    assetDescription: '',
    originalFaceValue: '',
    capMultiplier: '1.2',
    totalOriginalQuantity: '100',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await createMarket({
        assetId: form.assetId.trim(),
        assetName: form.assetName.trim(),
        assetImage: form.assetImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        assetDescription: form.assetDescription.trim(),
        originalFaceValue: Number(form.originalFaceValue),
        capMultiplier: Number(form.capMultiplier),
        totalOriginalQuantity: parseInt(form.totalOriginalQuantity, 10),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create secondary market.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose}>×</button>
        <h2>Create Secondary Market</h2>
        <p className="mp-modal-note">
          Initializes a new secondary trading market backed by Auction-Svc.
        </p>

        {error && <p className="mp-form-error">{error}</p>}

        <form className="mp-form" onSubmit={handleSubmit}>
          <div className="mp-form-pair">
            <label>
              Asset ID
              <input
                type="text"
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                required
              />
            </label>
            <label>
              Asset Name
              <input
                type="text"
                placeholder="e.g. Solstice VIP Pass"
                value={form.assetName}
                onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                required
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows="3"
              placeholder="Pass benefits, festival dates, and trading terms..."
              value={form.assetDescription}
              onChange={(e) => setForm({ ...form, assetDescription: e.target.value })}
            />
          </label>

          <label>
            Asset Image URL
            <input
              type="url"
              placeholder="https://..."
              value={form.assetImage}
              onChange={(e) => setForm({ ...form, assetImage: e.target.value })}
            />
          </label>

          <div className="mp-form-pair">
            <label>
              Original Face Value ($)
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="100.00"
                value={form.originalFaceValue}
                onChange={(e) => setForm({ ...form, originalFaceValue: e.target.value })}
                required
              />
            </label>
            <label>
              Cap Multiplier (e.g. 1.2 = +20%)
              <input
                type="number"
                step="0.01"
                min="1.0"
                value={form.capMultiplier}
                onChange={(e) => setForm({ ...form, capMultiplier: e.target.value })}
                required
              />
            </label>
          </div>

          <label>
            Total Original Quantity
            <input
              type="number"
              min="1"
              value={form.totalOriginalQuantity}
              onChange={(e) => setForm({ ...form, totalOriginalQuantity: e.target.value })}
              required
            />
          </label>

          <div className="mp-form-actions">
            <button className="mp-button mp-button-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="mp-button mp-button-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMarketModal({ market, onClose, onSuccess }) {
  const [form, setForm] = useState({
    assetName: market.assetName || '',
    assetDescription: market.assetDescription || '',
    assetImage: market.assetImage || '',
    capMultiplier: String(market.capMultiplier ?? 1.2),
    isTradingActive: Boolean(market.isTradingActive),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await updateMarket(market.assetId, {
        assetName: form.assetName.trim(),
        assetDescription: form.assetDescription.trim(),
        assetImage: form.assetImage.trim(),
        capMultiplier: Number(form.capMultiplier),
        isTradingActive: form.isTradingActive,
      });
      onSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to update market configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose}>×</button>
        <h2>Edit Market Configuration</h2>
        <p className="mp-modal-note">Updating configuration for {market.assetId}.</p>

        {error && <p className="mp-form-error">{error}</p>}

        <form className="mp-form" onSubmit={handleSubmit}>
          <label>
            Asset Name
            <input
              type="text"
              value={form.assetName}
              onChange={(e) => setForm({ ...form, assetName: e.target.value })}
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows="3"
              value={form.assetDescription}
              onChange={(e) => setForm({ ...form, assetDescription: e.target.value })}
            />
          </label>

          <label>
            Cap Multiplier
            <input
              type="number"
              step="0.01"
              min="1.0"
              value={form.capMultiplier}
              onChange={(e) => setForm({ ...form, capMultiplier: e.target.value })}
              required
            />
          </label>

          <label className="mp-attest" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isTradingActive}
              onChange={(e) => setForm({ ...form, isTradingActive: e.target.checked })}
            />
            <span>Enable Active Trading for this Asset</span>
          </label>

          <div className="mp-form-actions">
            <button className="mp-button mp-button-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="mp-button mp-button-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DUTCH AUCTIONS PAGE
// ==========================================

export function AuctionsPage({ path = '/auctions' }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const id = path.startsWith('/auctions/') ? decode(path.slice(10)) : '';
  const result = useRemote(() => (id ? getAuction(id) : getAuctions()), id || 'auctions');
  const list = Array.isArray(result.data) ? result.data : [];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidFeedback, setBidFeedback] = useState({ type: '', message: '' });
  const [endLoading, setEndLoading] = useState(false);
  const [watchVersion, setWatchVersion] = useState(0);

  const auction = id ? result.data : null;
  const inWatchlist = auction ? isWatchlisted(auction.id) : false;

  const handleToggleWatch = (a) => {
    toggleWatchlist({ id: a.id, name: a.assetName, type: 'auction' });
    setWatchVersion((v) => v + 1);
  };

  const handleAcceptPrice = async () => {
    if (bidLoading || !auction) return;
    setBidLoading(true);
    setBidFeedback({ type: '', message: '' });

    try {
      const userId = session?.user?.id || 'anonymous';
      const res = await acceptAuctionPrice(auction.id, userId);

      setBidFeedback({
        type: 'success',
        message:
          typeof res === 'string'
            ? res
            : 'Bid successfully queued for processing! Funds reserved.',
      });
      result.refresh();
    } catch (err) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Bid failed: Insufficient funds or auction closed.',
      });
    } finally {
      setBidLoading(false);
    }
  };

  const handleEndAuction = async () => {
    if (endLoading || !auction) return;
    if (!window.confirm('Are you sure you want to end this Dutch auction early?')) return;
    setEndLoading(true);
    try {
      const res = await endAuction(auction.id);
      result.setData(res);
      setBidFeedback({ type: 'success', message: 'Auction ended successfully.' });
    } catch (err) {
      setBidFeedback({ type: 'error', message: err.message || 'Failed to end auction.' });
    } finally {
      setEndLoading(false);
    }
  };

  return (
    <AppShell currentPath="/auctions" pageClass="marketplace-route-content">
      <div className="mp-page">
        {id && (
          <button className="mp-back" type="button" onClick={() => navigate('/auctions')}>
            ← Back to all auctions
          </button>
        )}

        <Heading
          title={id ? (auction?.assetName || 'Auction details') : 'Dutch Auctions'}
          description={
            id
              ? 'Real-time descending price auction and live stream events managed by Auction-Svc.'
              : 'Auctions decrease in price at regular intervals until a buyer accepts or the reserve is reached.'
          }
          actions={
            !id && (
              <button
                className="mp-button mp-button-primary"
                type="button"
                onClick={() => setCreateModalOpen(true)}
              >
                + Create Auction
              </button>
            )
          }
        />

        <LoadState
          state={result.state}
          error={result.error}
          retry={result.refresh}
          empty={id ? !auction : !list.length}
          emptyText={id ? 'Auction not found.' : 'No active Dutch auctions at this time.'}
        />

        {/* AUCTIONS LIST */}
        {result.state === 'ready' && !id && list.length > 0 && (
          <div className="mp-auction-grid">
            {list.map((a) => (
              <article className="mp-auction-card" key={a.id}>
                <div className="mp-panel-heading">
                  <div>
                    <h2>{a.assetName || 'Unnamed Asset'}</h2>
                    <p>Auction ID: {a.id}</p>
                  </div>
                  <span className={`mp-status-badge ${a.isActive ? 'status-active' : 'status-paused'}`}>
                    {a.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>
                <div className="mp-auction-card-body">
                  <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: '12px' }}>
                    {a.assetDiscription || 'No description supplied.'}
                  </p>
                  <div className="mp-auction-prices">
                    <div>
                      <span>Current Price</span>
                      <b style={{ color: 'var(--mint)', fontSize: '16px' }}>
                        ${a.currentPrice ?? 'N/A'}
                      </b>
                    </div>
                    <div>
                      <span>Asset ID</span>
                      <b>{a.assetId || 'N/A'}</b>
                    </div>
                    <div>
                      <span>Ends</span>
                      <small style={{ color: 'var(--text)' }}>
                        {a.endTime ? new Date(a.endTime).toLocaleDateString() : 'N/A'}
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="mp-button mp-button-primary"
                      type="button"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/auctions/${encodeURIComponent(a.id)}`)}
                    >
                      View &amp; Accept Price →
                    </button>
                    <button
                      className={`mp-watch-button ${isWatchlisted(a.id) ? 'is-saved' : ''}`}
                      type="button"
                      onClick={() => handleToggleWatch(a)}
                    >
                      ★
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SINGLE AUCTION VIEW */}
        {result.state === 'ready' && id && auction && (
          <div className="mp-detail-layout">
            <div>
              <article className="mp-panel">
                <div className="mp-panel-heading">
                  <div>
                    <h2>{auction.assetName || 'Unnamed Asset'}</h2>
                    <p>Asset ID: {auction.assetId} · Auction ID: {auction.id}</p>
                  </div>
                  <span className={`mp-status-badge ${auction.isActive ? 'status-active' : 'status-paused'}`}>
                    {auction.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: '13px' }}>
                    {auction.assetDiscription || 'No description supplied.'}
                  </p>

                  <div className="mp-detail-pairs" style={{ marginBottom: '20px' }}>
                    <div>
                      <span>Current Asking Price</span>
                      <b style={{ fontSize: '24px', color: 'var(--mint)' }}>
                        ${auction.currentPrice ?? '0.00'}
                      </b>
                    </div>
                    <div>
                      <span>Seller ID</span>
                      <b>{auction.sellerId || 'N/A'}</b>
                    </div>
                    <div>
                      <span>Auction Status</span>
                      <b>{auction.isActive ? 'Live & Descending' : 'Closed'}</b>
                    </div>
                    <div>
                      <span>Winner ID</span>
                      <b>{auction.winnerId || 'None (No buyer yet)'}</b>
                    </div>
                    <div>
                      <span>Auction End Time</span>
                      <b>{auction.endTime ? new Date(auction.endTime).toLocaleString() : 'N/A'}</b>
                    </div>
                  </div>

                  {/* Seller action controls */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                    <button
                      className="mp-button mp-button-secondary"
                      type="button"
                      onClick={() => setUpdateModalOpen(true)}
                    >
                      Edit Auction Info
                    </button>
                    {auction.isActive && (
                      <button
                        className="mp-button mp-button-secondary is-danger"
                        type="button"
                        onClick={handleEndAuction}
                        disabled={endLoading}
                      >
                        {endLoading ? 'Ending...' : 'End Auction Early'}
                      </button>
                    )}
                    <button
                      className={`mp-watch-button ${inWatchlist ? 'is-saved' : ''}`}
                      type="button"
                      onClick={() => handleToggleWatch(auction)}
                    >
                      ★ {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </article>

              {/* LIVE WEBSOCKET AUCTION DECAY CHART */}
              <LiveAuctionDecayChart auction={auction} />
            </div>

            {/* BID ACCEPTANCE PANEL */}
            <div>
              <div className="mp-panel mp-purchase-panel">
                <div className="mp-panel-heading">
                  <div>
                    <h2>Dutch Bid Acceptance</h2>
                    <p>Instant price-lock execution</p>
                  </div>
                </div>

                <div className="mp-current-price" style={{ marginBottom: '14px' }}>
                  <span>CURRENT ASKING PRICE</span>
                  <b>${auction.currentPrice ?? '0.00'}</b>
                  <small>Price decays over schedule until accepted or ended.</small>
                </div>

                {bidFeedback.message && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      marginBottom: '14px',
                      fontSize: '11px',
                      border: `1px solid ${bidFeedback.type === 'error' ? 'rgba(207,128,120,.4)' : 'rgba(75,226,160,.4)'}`,
                      background: bidFeedback.type === 'error' ? 'rgba(207,128,120,.1)' : 'rgba(75,226,160,.1)',
                      color: bidFeedback.type === 'error' ? '#cf8078' : 'var(--mint)',
                    }}
                    role={bidFeedback.type === 'error' ? 'alert' : 'status'}
                  >
                    {bidFeedback.message}
                  </div>
                )}

                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    className="mp-button mp-button-primary"
                    type="button"
                    onClick={handleAcceptPrice}
                    disabled={bidLoading || !auction.isActive}
                    style={{ width: '100%', minHeight: '44px', fontSize: '13px' }}
                  >
                    {bidLoading
                      ? 'Queuing Purchase Bid...'
                      : !auction.isActive
                      ? 'Auction Ended'
                      : `Accept Price at $${auction.currentPrice ?? '0.00'}`}
                  </button>
                  <p className="mp-floor-note" style={{ textAlign: 'center' }}>
                    Accepting locks this price and reserves funds from your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE AUCTION MODAL */}
        {createModalOpen && (
          <CreateAuctionModal
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              result.refresh();
            }}
          />
        )}

        {/* UPDATE AUCTION MODAL */}
        {updateModalOpen && auction && (
          <UpdateAuctionModal
            auction={auction}
            onClose={() => setUpdateModalOpen(false)}
            onSuccess={(updated) => {
              setUpdateModalOpen(false);
              result.setData(updated);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

function CreateAuctionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    assetId: `PASS_${Date.now().toString().slice(-6)}`,
    assetName: '',
    assetImage: '',
    assetDiscription: '',
    startingPrice: '250',
    minimumPrice: '50',
    decayAmount: '10',
    decayIntervalSeconds: '60',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await createAuction({
        assetId: form.assetId.trim(),
        assetName: form.assetName.trim(),
        assetImage: form.assetImage.trim() || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
        assetDiscription: form.assetDiscription.trim(),
        startingPrice: Number(form.startingPrice),
        minimumPrice: Number(form.minimumPrice),
        decayAmount: Number(form.decayAmount),
        decayIntervalSeconds: parseInt(form.decayIntervalSeconds, 10),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create Dutch auction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose}>×</button>
        <h2>Create Dutch Auction</h2>
        <p className="mp-modal-note">Sets up a descending price auction via Auction-Svc.</p>

        {error && <p className="mp-form-error">{error}</p>}

        <form className="mp-form" onSubmit={handleSubmit}>
          <div className="mp-form-pair">
            <label>
              Asset ID
              <input
                type="text"
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                required
              />
            </label>
            <label>
              Asset Name
              <input
                type="text"
                placeholder="e.g. VIP Solstice Pass"
                value={form.assetName}
                onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                required
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows="3"
              placeholder="Auction details and item information..."
              value={form.assetDiscription}
              onChange={(e) => setForm({ ...form, assetDiscription: e.target.value })}
            />
          </label>

          <div className="mp-form-pair">
            <label>
              Starting Price ($)
              <input
                type="number"
                step="any"
                min="1"
                value={form.startingPrice}
                onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                required
              />
            </label>
            <label>
              Reserve / Minimum Floor ($)
              <input
                type="number"
                step="any"
                min="1"
                value={form.minimumPrice}
                onChange={(e) => setForm({ ...form, minimumPrice: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="mp-form-pair">
            <label>
              Decay Amount ($ per step)
              <input
                type="number"
                step="any"
                min="0.01"
                value={form.decayAmount}
                onChange={(e) => setForm({ ...form, decayAmount: e.target.value })}
                required
              />
            </label>
            <label>
              Decay Interval (Seconds)
              <input
                type="number"
                min="1"
                value={form.decayIntervalSeconds}
                onChange={(e) => setForm({ ...form, decayIntervalSeconds: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="mp-form-actions">
            <button className="mp-button mp-button-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="mp-button mp-button-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Launch Dutch Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateAuctionModal({ auction, onClose, onSuccess }) {
  const [form, setForm] = useState({
    assetDiscription: auction.assetDiscription || '',
    assetImage: auction.assetImage || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await updateAuction(auction.id, {
        assetDiscription: form.assetDiscription.trim(),
        assetImage: form.assetImage.trim(),
      });
      onSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to update auction details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mp-modal">
        <button className="mp-modal-close" type="button" onClick={onClose}>×</button>
        <h2>Edit Auction Details</h2>
        <p className="mp-modal-note">Updating info for Auction #{auction.id}.</p>

        {error && <p className="mp-form-error">{error}</p>}

        <form className="mp-form" onSubmit={handleSubmit}>
          <label>
            Asset Description
            <textarea
              rows="4"
              value={form.assetDiscription}
              onChange={(e) => setForm({ ...form, assetDiscription: e.target.value })}
            />
          </label>

          <label>
            Asset Image URL
            <input
              type="url"
              value={form.assetImage}
              onChange={(e) => setForm({ ...form, assetImage: e.target.value })}
            />
          </label>

          <div className="mp-form-actions">
            <button className="mp-button mp-button-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="mp-button mp-button-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// ORDERS PAGE
// ==========================================

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(() => getStoredOrders());

  const buyCount = orders.filter((o) => o.side === 'BUY').length;
  const sellCount = orders.filter((o) => o.side === 'SELL').length;
  const totalVolume = orders.reduce((sum, o) => sum + (Number(o.price) || 0) * (Number(o.quantity) || 1), 0);

  return (
    <AppShell currentPath="/orders" pageClass="marketplace-route-content">
      <div className="mp-page">
        <Heading
          title="My Orders"
          description="Real-time orders submitted to the Roup Matching Engine via Auction-Svc."
          actions={
            <button
              className="mp-button mp-button-primary"
              type="button"
              onClick={() => navigate('/markets')}
            >
              + Place New Order
            </button>
          }
        />

        {/* Metrics */}
        <div className="mp-metrics mp-order-metrics">
          <div className="mp-metric">
            <span>Total Orders</span>
            <b>{orders.length}</b>
            <small>Active in session</small>
          </div>
          <div className="mp-metric">
            <span>Buy Orders</span>
            <b style={{ color: 'var(--mint)' }}>{buyCount}</b>
            <small>Bids queued</small>
          </div>
          <div className="mp-metric">
            <span>Sell Orders</span>
            <b style={{ color: '#c1a46b' }}>{sellCount}</b>
            <small>Asks queued</small>
          </div>
          <div className="mp-metric">
            <span>Order Value</span>
            <b>${totalVolume.toFixed(2)}</b>
            <small>Total submitted</small>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="mp-panel mp-state" style={{ padding: '36px' }}>
            <span className="mp-state-mark">
              <AppIcon name="receipt" size={20} />
            </span>
            <b>No orders placed yet</b>
            <p>Visit any secondary market to place a buy or sell limit order.</p>
            <button
              className="mp-button mp-button-primary"
              type="button"
              onClick={() => navigate('/markets')}
              style={{ marginTop: '12px' }}
            >
              Browse Secondary Markets
            </button>
          </div>
        ) : (
          <div className="mp-panel mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Asset</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{order.id}</span>
                    </td>
                    <td>
                      <b>{order.assetName || order.assetId}</b>
                      <span className="mp-item-subtitle">{order.assetId}</span>
                    </td>
                    <td>
                      <span
                        className={`mp-status-badge ${order.side === 'BUY' ? 'status-active' : 'status-paused'}`}
                      >
                        {order.side}
                      </span>
                    </td>
                    <td><b>${Number(order.price).toFixed(2)}</b></td>
                    <td>{order.quantity}</td>
                    <td><b>${(Number(order.price) * Number(order.quantity)).toFixed(2)}</b></td>
                    <td>
                      <span className="mp-status-badge status-active">
                        {order.status || 'QUEUED'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--quiet)' }}>
                      {order.timestamp ? new Date(order.timestamp).toLocaleTimeString() : 'Recent'}
                    </td>
                    <td>
                      <button
                        className="mp-text-button"
                        type="button"
                        onClick={() => navigate(`/markets/${encodeURIComponent(order.assetId)}`)}
                      >
                        View Market →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ==========================================
// LISTINGS PAGE
// ==========================================

export function ListingsPage() {
  const navigate = useNavigate();
  const marketsRes = useRemote(getMarkets, 'listings-markets');
  const auctionsRes = useRemote(getAuctions, 'listings-auctions');

  const markets = Array.isArray(marketsRes.data) ? marketsRes.data : [];
  const auctions = Array.isArray(auctionsRes.data) ? auctionsRes.data : [];

  return (
    <AppShell currentPath="/listings" pageClass="marketplace-route-content">
      <div className="mp-page">
        <Heading
          title="Market Listings"
          description="Manage secondary markets and Dutch auction listings connected to Auction-Svc."
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="mp-button mp-button-secondary"
                type="button"
                onClick={() => navigate('/markets')}
              >
                + New Market
              </button>
              <button
                className="mp-button mp-button-primary"
                type="button"
                onClick={() => navigate('/auctions')}
              >
                + New Auction
              </button>
            </div>
          }
        />

        <div className="mp-metrics mp-listing-metrics">
          <div className="mp-metric">
            <span>Active Markets</span>
            <b>{markets.length}</b>
            <small>Secondary assets</small>
          </div>
          <div className="mp-metric">
            <span>Dutch Auctions</span>
            <b style={{ color: 'var(--mint)' }}>{auctions.length}</b>
            <small>Live price discovery</small>
          </div>
          <div className="mp-metric">
            <span>Total Offerings</span>
            <b>{markets.length + auctions.length}</b>
            <small>Exchange items</small>
          </div>
        </div>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 12px' }}>Dutch Auctions</h2>
          {auctions.length === 0 ? (
            <p style={{ color: 'var(--quiet)', fontSize: '13px' }}>No Dutch auctions found.</p>
          ) : (
            <div className="mp-panel mp-table-scroll">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Auction ID</th>
                    <th>Asset Name</th>
                    <th>Current Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{a.id}</td>
                      <td><b>{a.assetName || a.assetId}</b></td>
                      <td><b style={{ color: 'var(--mint)' }}>${a.currentPrice ?? 'N/A'}</b></td>
                      <td>
                        <span className={`mp-status-badge ${a.isActive ? 'status-active' : 'status-paused'}`}>
                          {a.isActive ? 'ACTIVE' : 'ENDED'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="mp-text-button"
                          type="button"
                          onClick={() => navigate(`/auctions/${encodeURIComponent(a.id)}`)}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '18px', margin: '0 0 12px' }}>Secondary Markets</h2>
          {markets.length === 0 ? (
            <p style={{ color: 'var(--quiet)', fontSize: '13px' }}>No secondary markets found.</p>
          ) : (
            <div className="mp-panel mp-table-scroll">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Asset Name</th>
                    <th>Face Value</th>
                    <th>Max Resale</th>
                    <th>Trading</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m) => (
                    <tr key={m.assetId}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{m.assetId}</td>
                      <td><b>{m.assetName}</b></td>
                      <td>${m.originalFaceValue ?? 'N/A'}</td>
                      <td><b style={{ color: 'var(--mint)' }}>${m.maximumResalePrice ?? 'N/A'}</b></td>
                      <td>
                        <span className={`mp-status-badge ${m.isTradingActive ? 'status-active' : 'status-paused'}`}>
                          {m.isTradingActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="mp-text-button"
                          type="button"
                          onClick={() => navigate(`/markets/${encodeURIComponent(m.assetId)}`)}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

// ==========================================
// WATCHLIST PAGE
// ==========================================

export function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(() => getWatchlist());

  const handleRemove = (id) => {
    toggleWatchlist({ id });
    setWatchlist(getWatchlist());
  };

  return (
    <AppShell currentPath="/watchlist" pageClass="marketplace-route-content">
      <div className="mp-page">
        <Heading
          title="Your Watchlist"
          description="Followed markets and auctions saved for quick tracking."
        />

        {watchlist.length === 0 ? (
          <div className="mp-panel mp-state" style={{ padding: '36px' }}>
            <span className="mp-state-mark">★</span>
            <b>Your watchlist is empty</b>
            <p>Click the star icon on any secondary market or Dutch auction to track it here.</p>
            <button
              className="mp-button mp-button-primary"
              type="button"
              onClick={() => navigate('/markets')}
              style={{ marginTop: '12px' }}
            >
              Explore Markets
            </button>
          </div>
        ) : (
          <div className="mp-panel mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{item.id}</td>
                    <td><b>{item.name || item.id}</b></td>
                    <td>
                      <span className="mp-status-badge status-active">
                        {item.type ? item.type.toUpperCase() : 'ASSET'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="mp-text-button"
                        type="button"
                        onClick={() =>
                          navigate(
                            item.type === 'auction'
                              ? `/auctions/${encodeURIComponent(item.id)}`
                              : `/markets/${encodeURIComponent(item.id)}`
                          )
                        }
                      >
                        Open Details →
                      </button>
                      <button
                        className="mp-text-button"
                        type="button"
                        style={{ color: '#cf8078' }}
                        onClick={() => handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
