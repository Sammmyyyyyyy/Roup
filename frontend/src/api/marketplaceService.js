import { apiRequest } from './apiClient.js';

// ==========================================
// SECONDARY MARKETS
// ==========================================

/**
 * Get all active secondary markets.
 * Endpoint: GET /api/secondary-markets/active-markets
 */
export const getMarkets = () => apiRequest('/api/secondary-markets/active-markets');

/**
 * Get details for a single secondary market by asset ID.
 * Endpoint: GET /api/secondary-markets/{assetId}
 */
export const getMarket = (assetId) =>
  apiRequest(`/api/secondary-markets/${encodeURIComponent(assetId)}`);

/**
 * Create a new secondary market.
 * Endpoint: POST /api/secondary-markets/create
 * Body: { assetId, assetName, assetImage, assetDescription, originalFaceValue, capMultiplier, totalOriginalQuantity }
 */
export const createMarket = (marketData) =>
  apiRequest('/api/secondary-markets/create', {
    method: 'POST',
    body: marketData,
    auth: true,
  });

/**
 * Update market configuration.
 * Endpoint: PUT /api/secondary-markets/{assetId}
 * Body: { capMultiplier, isTradingActive, assetDescription, assetImage, assetName }
 */
export const updateMarket = (assetId, updateData) =>
  apiRequest(`/api/secondary-markets/${encodeURIComponent(assetId)}`, {
    method: 'PUT',
    body: updateData,
    auth: true,
  });

/**
 * Place a buy order in a secondary market.
 * Endpoint: POST /api/secondary-markets/buy
 * Body: { assetId, userId, side: 'BUY', price, quantity }
 */
export const placeBuyOrder = ({ assetId, userId, price, quantity }) =>
  apiRequest('/api/secondary-markets/buy', {
    method: 'POST',
    body: {
      assetId,
      userId,
      side: 'BUY',
      price: Number(price),
      quantity: Number(quantity),
    },
    auth: true,
  });

/**
 * Place a sell order in a secondary market.
 * Endpoint: POST /api/secondary-markets/sell
 * Body: { assetId, userId, side: 'SELL', price, quantity }
 */
export const placeSellOrder = ({ assetId, userId, price, quantity }) =>
  apiRequest('/api/secondary-markets/sell', {
    method: 'POST',
    body: {
      assetId,
      userId,
      side: 'SELL',
      price: Number(price),
      quantity: Number(quantity),
    },
    auth: true,
  });

// ==========================================
// DUTCH AUCTIONS
// ==========================================

/**
 * Get all active Dutch auctions.
 * Endpoint: GET /api/dutch-auctions
 */
export const getAuctions = () => apiRequest('/api/dutch-auctions');

/**
 * Get details for a single Dutch auction by auction ID.
 * Endpoint: GET /api/dutch-auctions/{auctionId}
 */
export const getAuction = (auctionId) =>
  apiRequest(`/api/dutch-auctions/${encodeURIComponent(auctionId)}`);

/**
 * Create a new Dutch auction.
 * Endpoint: POST /api/dutch-auctions
 * Body: { assetId, assetImage, assetDiscription, assetName, startingPrice, minimumPrice, decayAmount, decayIntervalSeconds, startTime, endTime }
 */
export const createAuction = (auctionData) =>
  apiRequest('/api/dutch-auctions', {
    method: 'POST',
    body: auctionData,
    auth: true,
  });

/**
 * Update an existing Dutch auction (Seller only).
 * Endpoint: PUT /api/dutch-auctions/{auctionId}
 * Body: { assetImage, assetDiscription }
 */
export const updateAuction = (auctionId, updateData) =>
  apiRequest(`/api/dutch-auctions/${encodeURIComponent(auctionId)}`, {
    method: 'PUT',
    body: updateData,
    auth: true,
  });

/**
 * End an auction early (Seller only).
 * Endpoint: POST /api/dutch-auctions/{auctionId}/end
 */
export const endAuction = (auctionId) =>
  apiRequest(`/api/dutch-auctions/${encodeURIComponent(auctionId)}/end`, {
    method: 'POST',
    auth: true,
  });

/**
 * Accept the current auction price (submit Dutch bid).
 * Endpoint: POST /api/dutch-auctions/{auctionId}/accept
 * Body: { userId }
 */
export const acceptAuctionPrice = (auctionId, userId) =>
  apiRequest(`/api/dutch-auctions/${encodeURIComponent(auctionId)}/accept`, {
    method: 'POST',
    body: { userId },
    auth: true,
  });
