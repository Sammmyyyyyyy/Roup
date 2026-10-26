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
