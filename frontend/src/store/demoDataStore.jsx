import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoAuctions, demoMarkets } from '../data/demo/marketplace.js';

const STORAGE_KEY = 'roup-frontend-demo-v1';
const DemoDataContext = createContext(null);

const seedOrders = [
  { id: 'DEMO-ORD-001', marketId: demoMarkets[0].id, itemName: demoMarkets[0].itemName, side: 'BUY', type: 'LIMIT', price: 278, requestedQuantity: 2, filledQuantity: 0, remainingQuantity: 2, status: 'OPEN', createdAt: '2026-10-24T09:20:00.000Z', simulated: true },
  { id: 'DEMO-ORD-002', marketId: demoMarkets[0].id, itemName: demoMarkets[0].itemName, side: 'SELL', type: 'LIMIT', price: 286, requestedQuantity: 2, filledQuantity: 1, remainingQuantity: 1, status: 'PARTIALLY_FILLED', createdAt: '2026-10-23T14:35:00.000Z', simulated: true },
  { id: 'DEMO-ORD-003', marketId: demoMarkets[1].id, itemName: demoMarkets[1].itemName, side: 'BUY', type: 'MARKET', price: 202, requestedQuantity: 1, filledQuantity: 1, remainingQuantity: 0, status: 'FILLED', createdAt: '2026-10-22T18:10:00.000Z', simulated: true },
  { id: 'DEMO-ORD-004', marketId: demoMarkets[2].id, itemName: demoMarkets[2].itemName, side: 'BUY', type: 'LIMIT', price: 100, requestedQuantity: 1, filledQuantity: 0, remainingQuantity: 1, status: 'CANCELLED', createdAt: '2026-10-21T11:00:00.000Z', simulated: true },
];

const seedListings = [
  { id: 'DEMO-LIST-001', itemName: 'North Shore Sessions Pass', eventName: 'North Shore Sessions', category: 'Festival Pass', description: 'Three days by the water with the North Shore lineup.', faceValue: 240, askingPrice: 284, quantity: 2, status: 'ACTIVE', createdAt: '2026-10-20T10:00:00.000Z', updatedAt: '2026-10-24T12:00:00.000Z', art: 'shore', demo: true },
  { id: 'DEMO-LIST-002', itemName: 'Afterhours City Lights VIP', eventName: 'Afterhours: City Lights', category: 'VIP Pass', description: 'Late-night access to the city stage.', faceValue: 185, askingPrice: 202, quantity: 1, status: 'PAUSED', createdAt: '2026-10-18T10:00:00.000Z', updatedAt: '2026-10-22T12:00:00.000Z', art: 'afterhours', demo: true },
  { id: 'DEMO-LIST-003', itemName: 'Afterglow Artist Print', eventName: 'Objects for the Afters', category: 'Collectible', description: 'A hand-finished limited edition print.', faceValue: 85, askingPrice: 112, quantity: 0, status: 'SOLD', createdAt: '2026-10-12T10:00:00.000Z', updatedAt: '2026-10-19T12:00:00.000Z', art: 'afterglow', demo: true },
];

function initialState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.orders) && Array.isArray(saved.listings) && Array.isArray(saved.watchlist)) {
      return { ...saved, balance: Number.isFinite(saved.balance) ? saved.balance : 1800, holdings: saved.holdings || { [demoMarkets[0].id]: 2, [demoMarkets[1].id]: 1 } };
    }
  } catch { /* Start from stable sample state if local storage is unavailable. */ }
  return { orders: seedOrders, listings: seedListings, watchlist: [], balance: 1800, holdings: { [demoMarkets[0].id]: 2, [demoMarkets[1].id]: 1 } };
}

export function DemoDataProvider({ children }) {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Demo state remains available for this session. */ }
  }, [state]);

  const api = useMemo(() => ({
    ...state,
    toggleWatchlist(type, id) {
      const key = `${type}:${id}`;
      setState((current) => ({ ...current, watchlist: current.watchlist.includes(key) ? current.watchlist.filter((saved) => saved !== key) : [...current.watchlist, key] }));
    },
    createOrder(order) {
      const record = { ...order, id: `DEMO-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), simulated: true };
      setState((current) => {
        const balanceChange = (record.filledNotional || 0) * (record.side === 'BUY' ? -1 : 1);
        const holdings = { ...current.holdings, [record.marketId]: Math.max(0, (current.holdings[record.marketId] || 0) + (record.side === 'BUY' ? record.filledQuantity : -record.filledQuantity)) };
        return { ...current, balance: Math.max(0, current.balance + balanceChange), holdings, orders: [record, ...current.orders] };
      });
      return record;
    },
    cancelOrder(id) {
      setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === id && ['OPEN', 'PARTIALLY_FILLED'].includes(order.status) ? { ...order, status: 'CANCELLED', remainingQuantity: 0, updatedAt: new Date().toISOString() } : order) }));
    },
    saveListing(listing) {
      const now = new Date().toISOString();
      setState((current) => ({ ...current, listings: [{ ...listing, id: `DEMO-LIST-${Date.now().toString(36).toUpperCase()}`, status: 'ACTIVE', createdAt: now, updatedAt: now, demo: true }, ...current.listings] }));
    },
    updateListing(id, patch) {
      setState((current) => ({ ...current, listings: current.listings.map((listing) => listing.id === id ? { ...listing, ...patch, updatedAt: new Date().toISOString() } : listing) }));
    },
    removeListing(id) {
      setState((current) => ({ ...current, listings: current.listings.map((listing) => listing.id === id ? { ...listing, status: 'REMOVED', updatedAt: new Date().toISOString() } : listing) }));
    },
  }), [state]);
  return <DemoDataContext.Provider value={api}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error('useDemoData must be used inside DemoDataProvider');
  return value;
}

export function marketWatchKey(id) { return `market:${id}`; }
export function auctionWatchKey(id) { return `auction:${id}`; }
export function findDemoMarket(id) { return demoMarkets.find((market) => market.id === id) || null; }
export function findDemoAuctionItem(id) { return demoAuctions.find((auction) => auction.id === id) || null; }
