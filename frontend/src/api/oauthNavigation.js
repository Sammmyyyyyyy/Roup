export function safeNextPath(value, origin = globalThis.location?.origin || 'http://localhost') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/explore';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return '/explore';
    const supported = ['/explore', '/markets', '/auctions', '/orders', '/listings', '/watchlist'];
    const resource = /^\/(markets|auctions)\/[A-Za-z0-9._~-]+$/i.test(url.pathname);
    if (!supported.includes(url.pathname) && !resource) return '/explore';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/explore';
  }
}

export function googleAuthorizationUrl(base = '') {
  return `${base.trim().replace(/\/$/, '')}/oauth2/authorization/google`;
}
