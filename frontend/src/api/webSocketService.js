import { useEffect, useRef, useState } from 'react';

function getWsUrl(endpoint) {
  const customBase = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (customBase) {
    const wsProto = customBase.startsWith('https') ? 'wss' : 'ws';
    return `${wsProto}://${customBase.replace(/^https?:\/\//, '').replace(/\/$/, '')}${endpoint}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${endpoint}`;
}

/**
 * Hook to subscribe to live order book updates for a secondary market.
 * Backend: Auction-Svc /ws/markets
 */
export function useMarketOrderBook(marketId) {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!marketId) return;

    let socket;
    let isMounted = true;

    try {
      socket = new WebSocket(getWsUrl('/ws/markets'));
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        socket.send(`SUBSCRIBE:${marketId}`);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_BOOK_UPDATE' && data.marketId === marketId && data.payload) {
            setOrderBook({
              bids: Array.isArray(data.payload.bids) ? data.payload.bids : [],
              asks: Array.isArray(data.payload.asks) ? data.payload.asks : [],
            });
          }
        } catch {
          // Status or non-JSON message
        }
      };

      socket.onerror = () => {
        if (isMounted) setIsConnected(false);
      };

      socket.onclose = () => {
        if (isMounted) setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      isMounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [marketId]);

  return { orderBook, isConnected };
}

/**
 * Hook to subscribe to live auction updates (winner/close/bid reject).
 * Backend: Auction-Svc /ws/auctions
 */
export function useAuctionLiveUpdates(auctionId) {
  const [latestEvent, setLatestEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!auctionId) return;

    let socket;
    let isMounted = true;

    try {
      socket = new WebSocket(getWsUrl('/ws/auctions'));
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        socket.send(`SUBSCRIBE:${auctionId}`);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.auctionId === auctionId) {
            setLatestEvent(data);
          }
        } catch {
          // Non-JSON status message
        }
      };

      socket.onerror = () => {
        if (isMounted) setIsConnected(false);
      };

      socket.onclose = () => {
        if (isMounted) setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      isMounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [auctionId]);

  return { latestEvent, isConnected };
}
