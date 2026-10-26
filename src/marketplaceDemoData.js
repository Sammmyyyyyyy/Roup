// Stable frontend-only examples for Markets and Dutch Auctions. No live feed is connected.
export const demoMarkets = [
  {
    id: 'market-north-shore-pass', itemName: '3-Day Festival Pass', eventName: 'North Shore Sessions', category: 'Festival Passes',
    description: 'Three days of music and art on the Oregon coast.', faceValue: 240, askingPrice: 284, quantity: 4, status: 'ACTIVE', demo: true, art: 'shore',
    bestBid: 278, bestAsk: 284, orderBook: { bids: [{ price: 278, quantity: 2 }, { price: 272.5, quantity: 4 }, { price: 269, quantity: 1 }], asks: [{ price: 284, quantity: 1 }, { price: 291, quantity: 3 }, { price: 298.5, quantity: 2 }] },
  },
  { id: 'market-afterhours-vip', itemName: 'City Lights VIP', eventName: 'Afterhours: City Lights', category: 'VIP Pass', description: 'A VIP pass for the late-night city stage.', faceValue: 185, askingPrice: 202, quantity: 1, status: 'ACTIVE', demo: true, art: 'afterhours' },
  { id: 'market-afterglow-print', itemName: 'Afterglow Art Print', eventName: 'Objects for the Afters', category: 'Collectible', description: 'A limited edition event print, hand-finished for the collection.', faceValue: 85, askingPrice: 112, quantity: 1, status: 'ACTIVE', demo: true, art: 'afterglow' },
  { id: 'market-field-notes-tote', itemName: 'Field Notes Tote', eventName: 'Solstice: High Desert', category: 'Merchandise', description: 'A festival canvas tote from the Field Notes collection.', faceValue: 48, askingPrice: 54, quantity: 3, status: 'ACTIVE', demo: true, art: 'fieldnotes' },
  { id: 'market-artist-access', itemName: 'Artist Access Pass', eventName: 'Solstice: High Desert', category: 'VIP Pass', description: 'An artist edition pass for the High Desert grounds.', faceValue: 280, askingPrice: 320, quantity: 2, status: 'ACTIVE', demo: true, art: 'solstice' },
  { id: 'market-night-garden', itemName: 'Night Garden Edition', eventName: 'North Shore Sessions', category: 'Collectible', description: 'A numbered collectible inspired by the Night Garden stage.', faceValue: 120, askingPrice: 138, quantity: 1, status: 'ACTIVE', demo: true, art: 'nightgarden' },
];

export const demoAuctions = [
  {
    id: 'auction-north-shore-pass', itemName: 'North Shore 3-Day Pass', eventName: 'North Shore Sessions', category: 'Festival Pass', art: 'shore',
    description: 'A three-day pass with a scheduled, step-based price reduction.', faceValue: 240, startingPrice: 320, currentPrice: 240, floorPrice: 200, finalPrice: null, quantity: 4, status: 'ACTIVE',
    timingLabel: '2 hours remaining', startsLabel: 'Started today · 10:00 (demo schedule)', endsLabel: 'Today · 18:00 (demo schedule)',
    schedule: [{ minute: 0, price: 320 }, { minute: 120, price: 300 }, { minute: 240, price: 280 }, { minute: 360, price: 240 }, { minute: 480, price: 200 }],
  },
  {
    id: 'auction-afterhours-vip', itemName: 'City Lights VIP Pass', eventName: 'Afterhours: City Lights', category: 'VIP Pass', art: 'afterhours',
    description: 'A VIP event pass offered on a predefined price-decay schedule.', faceValue: 185, startingPrice: 250, currentPrice: 190, floorPrice: 150, finalPrice: null, quantity: 2, status: 'ACTIVE',
    timingLabel: '5 hours remaining', startsLabel: 'Started today · 09:00 (demo schedule)', endsLabel: 'Today · 20:00 (demo schedule)',
    schedule: [{ minute: 0, price: 250 }, { minute: 120, price: 230 }, { minute: 240, price: 210 }, { minute: 360, price: 190 }, { minute: 480, price: 170 }, { minute: 600, price: 150 }],
  },
  {
    id: 'auction-afterglow-print', itemName: 'Afterglow Artist Print', eventName: 'Objects for the Afters', category: 'Collectible', art: 'afterglow',
    description: 'A numbered print with an upcoming Dutch auction schedule.', faceValue: 85, startingPrice: 160, currentPrice: null, floorPrice: 100, finalPrice: null, quantity: 1, status: 'UPCOMING',
    timingLabel: null, startsLabel: 'Tomorrow · 11:00 (demo schedule)', endsLabel: 'Tomorrow · 19:00 (demo schedule)',
    schedule: [{ minute: 0, price: 160 }, { minute: 120, price: 145 }, { minute: 240, price: 130 }, { minute: 360, price: 115 }, { minute: 480, price: 100 }],
  },
  {
    id: 'auction-solstice-artist-pass', itemName: 'Artist Access Pass', eventName: 'Solstice: High Desert', category: 'VIP Pass', art: 'solstice',
    description: 'A limited access pass scheduled for a later price-decay auction.', faceValue: 280, startingPrice: 360, currentPrice: null, floorPrice: 240, finalPrice: null, quantity: 2, status: 'UPCOMING',
    timingLabel: null, startsLabel: 'In 2 days · 10:00 (demo schedule)', endsLabel: 'In 2 days · 18:00 (demo schedule)',
    schedule: [{ minute: 0, price: 360 }, { minute: 120, price: 330 }, { minute: 240, price: 300 }, { minute: 360, price: 270 }, { minute: 480, price: 240 }],
  },
  {
    id: 'auction-night-garden-edition', itemName: 'Night Garden Edition', eventName: 'North Shore Sessions', category: 'Collectible', art: 'nightgarden',
    description: 'This example auction reached its configured end state.', faceValue: 120, startingPrice: 190, currentPrice: null, floorPrice: 120, finalPrice: 120, quantity: 0, status: 'ENDED',
    timingLabel: null, startsLabel: 'Ended yesterday · 09:00 (demo schedule)', endsLabel: 'Ended yesterday · 17:00 (demo schedule)',
    schedule: [{ minute: 0, price: 190 }, { minute: 120, price: 170 }, { minute: 240, price: 150 }, { minute: 360, price: 135 }, { minute: 480, price: 120 }],
  },
  {
    id: 'auction-field-notes-set', itemName: 'Field Notes Collector Set', eventName: 'Solstice: High Desert', category: 'Merchandise', art: 'fieldnotes',
    description: 'A merchandise example from a completed price-decay schedule.', faceValue: 65, startingPrice: 110, currentPrice: null, floorPrice: 75, finalPrice: 85, quantity: 0, status: 'ENDED',
    timingLabel: null, startsLabel: 'Ended 2 days ago · 12:00 (demo schedule)', endsLabel: 'Ended 2 days ago · 18:00 (demo schedule)',
    schedule: [{ minute: 0, price: 110 }, { minute: 90, price: 100 }, { minute: 180, price: 95 }, { minute: 270, price: 85 }, { minute: 360, price: 75 }],
  },
];

export function findDemoAuction(id) {
  return demoAuctions.find((auction) => auction.id === id) || null;
}

export function auctionPriceMetrics(auction) {
  if (!auction || !Number.isFinite(auction.startingPrice) || auction.startingPrice <= 0) return null;
  const price = auction.status === 'ACTIVE' ? auction.currentPrice : auction.status === 'ENDED' ? auction.finalPrice : null;
  if (!Number.isFinite(price)) return null;
  const reduction = auction.startingPrice - price;
  const range = auction.startingPrice - auction.floorPrice;
  return {
    price,
    reduction,
    reductionPercent: reduction / auction.startingPrice * 100,
    progress: range > 0 ? Math.max(0, Math.min(100, reduction / range * 100)) : 0,
  };
}

export function marketSpread(market) {
  const bid = Number(market?.bestBid);
  const ask = Number(market?.bestAsk);
  if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(ask) || ask < bid) return null;
  const midpoint = (bid + ask) / 2;
  if (midpoint <= 0) return null;
  return { bid, ask, spread: ask - bid, percent: (ask - bid) / midpoint * 100 };
}

export function formatDemoPrice(value) {
  return Number.isFinite(Number(value)) && value != null
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))
    : 'Unavailable';
}
