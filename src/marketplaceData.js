import { getListings } from './marketplaceApi.js';

export async function loadMarketplaceItems(token) {
  const listings = await getListings(token);
  return listings.map((item) => {
    const category = item.category || 'Marketplace item';
    const slug = `${item.eventName} ${item.itemName}`.toLowerCase();
    const art = slug.includes('north shore') ? 'shore' : slug.includes('solstice') ? 'solstice' : slug.includes('afterhours') ? 'afterhours' : slug.includes('afterglow') ? 'afterglow' : slug.includes('night garden') ? 'nightgarden' : slug.includes('field notes') ? 'fieldnotes' : 'custom';
    const filter = /vip/i.test(category) ? 'vip' : /merch/i.test(category) ? 'merchandise' : /collect/i.test(category) ? 'collectibles' : /festival|ticket/i.test(category) ? 'festival' : 'all';
    return {
      id: item.id, name: item.itemName, event: item.eventName, category, filter,
      faceValue: Number(item.faceValue), askingPrice: Number(item.askingPrice), quantity: item.quantity,
      description: item.description || '', imageUrl: item.imageUrl || item.image || '',
      bestBid: item.bestBid ?? null, bestAsk: item.bestAsk ?? null,
      marketDataAvailable: item.marketDataAvailable === true || item.orderBookAvailable === true
        || (item.orderBook != null && typeof item.orderBook === 'object')
        || item.bestBid != null || item.bestAsk != null,
      orderBook: item.orderBook && typeof item.orderBook === 'object' ? item.orderBook : null,
      listedOrder: new Date(item.createdAt).getTime() || 0, art,
      artLabel: `${item.eventName} ${item.itemName} ${item.demo ? 'example' : 'seller submitted'} listing artwork`,
      isDemo: item.demo, status: item.status,
    };
  });
}

export function filterMarketplaceItems(items, { category = 'all', query = '', sort = 'recent' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  const result = items.filter((item) => {
    const categoryMatches = category === 'all' || item.filter === category;
    const searchMatches = !needle || `${item.name} ${item.event} ${item.category}`.toLocaleLowerCase().includes(needle);
    return categoryMatches && searchMatches;
  });
  if (sort === 'low') result.sort((a, b) => a.askingPrice - b.askingPrice);
  else if (sort === 'high') result.sort((a, b) => b.askingPrice - a.askingPrice);
  else result.sort((a, b) => b.listedOrder - a.listedOrder);
  return result;
}

export const marketplaceCategories = [
  { id: 'all', label: 'For You' },
  { id: 'festival', label: 'Festival Passes' },
  { id: 'vip', label: 'VIP Passes' },
  { id: 'merchandise', label: 'Merchandise' },
  { id: 'collectibles', label: 'Collectibles' },
];

export function getItemArtworkLabel(item) {
  return item?.artLabel || `${item?.event || 'Festival'} example item artwork`;
}
