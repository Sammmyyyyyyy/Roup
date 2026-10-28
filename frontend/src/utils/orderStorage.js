const STORAGE_KEY = 'roup-user-orders';
const WATCHLIST_KEY = 'roup-user-watchlist';

export function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  try {
    const orders = getStoredOrders();
    const updated = [order, ...orders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlist(item) {
  try {
    const current = getWatchlist();
    const exists = current.some((w) => w.id === item.id);
    const updated = exists ? current.filter((w) => w.id !== item.id) : [item, ...current];
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function isWatchlisted(id) {
  return getWatchlist().some((w) => w.id === id);
}
