function validPrice(value) {
  const price = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function calculateBidAskSpread(bestBid, bestAsk) {
  const bid = validPrice(bestBid);
  const ask = validPrice(bestAsk);
  if (bid === null || ask === null || ask < bid) return null;

  const spread = ask - bid;
  const midpoint = (ask + bid) / 2;
  if (!Number.isFinite(midpoint) || midpoint <= 0) return null;

  return { bestBid: bid, bestAsk: ask, spread, midpoint, percent: (spread / midpoint) * 100 };
}

export function formatMarketPrice(value) {
  if (value == null || value === '') return null;
  const price = typeof value === 'number' ? value : Number(value);
  return !Number.isFinite(price) || price < 0 ? null : new Intl.NumberFormat(undefined, {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);
}
