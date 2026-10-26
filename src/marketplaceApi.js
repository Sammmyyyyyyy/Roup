const apiBase = (import.meta.env.VITE_AUTH_API_BASE_URL || '').trim().replace(/\/$/, '');

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Roup could not reach the marketplace service. Check that the backend is running and try again.');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || data?.title || 'The request could not be completed. Please try again.');
  }
  return data;
}

export const getListings = (token) => apiRequest('/api/marketplace/listings', { token });
export const getMarkets = (token) => apiRequest('/api/markets', { token });
export const getMarket = (token, id) => apiRequest(`/api/markets/${encodeURIComponent(id)}`, { token });
export const getMarketSummary = (token) => apiRequest('/api/marketplace/summary', { token });
export const getAuctions = (token) => apiRequest('/api/auctions', { token });
export const getOrders = (token) => apiRequest('/api/orders', { token });
export const getMyListings = (token) => apiRequest('/api/listings/mine', { token });
export const createListing = (token, body) => apiRequest('/api/listings', { token, method: 'POST', body });
export const updateListing = (token, id, body) => apiRequest(`/api/listings/${encodeURIComponent(id)}`, { token, method: 'PUT', body });
export const setListingStatus = (token, id, status) => apiRequest(`/api/listings/${encodeURIComponent(id)}/status`, { token, method: 'PATCH', body: { status } });
