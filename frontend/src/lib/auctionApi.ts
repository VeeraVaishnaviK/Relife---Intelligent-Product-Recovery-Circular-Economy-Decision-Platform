import {
  ActiveAuctionsResponse,
  AuctionItem,
  CreateAuctionPayload,
  PlaceBidPayload,
  AuctionOutcomeItem,
} from './auctionTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchActiveAuctions(componentType?: string): Promise<ActiveAuctionsResponse> {
  const url = new URL(`${API_BASE}/api/auctions/active`);
  if (componentType && componentType !== 'all') {
    url.searchParams.append('component_type', componentType);
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch active auctions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAuctionDetails(auctionId: number): Promise<AuctionItem> {
  const res = await fetch(`${API_BASE}/api/auctions/${auctionId}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch auction details: ${res.statusText}`);
  }
  return res.json();
}

export async function createAuction(payload: CreateAuctionPayload): Promise<AuctionItem> {
  const res = await fetch(`${API_BASE}/api/auctions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create auction');
  }
  return res.json();
}

export async function placeAuctionBid(
  auctionId: number,
  bidderId: number,
  bidAmount: number
): Promise<AuctionItem> {
  const res = await fetch(`${API_BASE}/api/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidder_id: bidderId, bid_amount: bidAmount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to place bid');
  }
  return res.json();
}

export async function closeAuction(auctionId: number): Promise<AuctionOutcomeItem> {
  const res = await fetch(`${API_BASE}/api/auctions/${auctionId}/close`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to close auction');
  }
  return res.json();
}

export async function fetchAuctionOutcomeHistory(): Promise<AuctionOutcomeItem[]> {
  const res = await fetch(`${API_BASE}/api/auctions/outcomes/history`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch auction outcomes: ${res.statusText}`);
  }
  return res.json();
}
