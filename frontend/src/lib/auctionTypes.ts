export interface AuctionComponentDetails {
  id: number;
  return_id: string;
  component_type: string;
  condition: string;
  estimated_value: number;
  product_brand: string;
  product_model: string;
  category: string;
}

export interface AuctionBidItem {
  id: number;
  auction_id: number;
  bidder_id: number;
  bidder_name: string;
  bidder_type: string;
  bid_amount: number;
  bid_time: string;
  status: 'active' | 'outbid' | 'won' | 'lost';
}

export interface AuctionItem {
  id: number;
  auction_code: string;
  component_id: number;
  component: AuctionComponentDetails;
  starting_price: number;
  original_starting_price: number;
  reserve_price: number;
  start_time: string;
  end_time: string;
  time_remaining_seconds: number;
  status: 'open' | 'closed' | 'awarded';
  current_highest_bid: number;
  current_highest_bidder_id: number | null;
  current_highest_bidder_name: string | null;
  total_bids: number;
  decay_pct_applied: number;
  anti_snipe_extensions_count: number;
  is_ending_soon: boolean;
  bids: AuctionBidItem[];
}

export interface ActiveAuctionsResponse {
  total_active: number;
  total_volume_inr: number;
  auctions: AuctionItem[];
}

export interface CreateAuctionPayload {
  component_id: number;
  duration_hours?: number;
  starting_price?: number;
  reserve_price?: number;
}

export interface PlaceBidPayload {
  bidder_id: number;
  bid_amount: number;
}

export interface AuctionOutcomeItem {
  id: number;
  auction_id: number;
  auction_code: string;
  component_id: number;
  component_name: string;
  winning_bidder_id: number | null;
  winning_bidder_name: string | null;
  final_bid_amount: number;
  starting_price: number;
  reserve_price: number;
  total_bids: number;
  settlement_status: 'awarded' | 'reserve_not_met' | 'expired';
  closed_at: string;
  notes?: string;
}
