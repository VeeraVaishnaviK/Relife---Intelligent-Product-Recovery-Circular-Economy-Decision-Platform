from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CreateAuctionRequest(BaseModel):
    component_id: int
    duration_hours: Optional[float] = Field(default=24.0, ge=0.01, le=168.0)
    starting_price: Optional[float] = Field(default=None, description="Auto-suggests from component.estimated_value if None")
    reserve_price: Optional[float] = Field(default=None, description="Defaults to 75% of starting_price if None")


class PlaceBidRequest(BaseModel):
    bidder_id: int
    bid_amount: float = Field(gt=0.0)


class BidItemResponse(BaseModel):
    id: int
    auction_id: int
    bidder_id: int
    bidder_name: str
    bidder_type: str
    bid_amount: float
    bid_time: str
    status: str


class AuctionComponentDetails(BaseModel):
    id: int
    return_id: str
    component_type: str
    condition: str
    estimated_value: float
    product_brand: str
    product_model: str
    category: str


class AuctionDetailResponse(BaseModel):
    id: int
    auction_code: str
    component_id: int
    component: AuctionComponentDetails
    starting_price: float
    original_starting_price: float
    reserve_price: float
    start_time: str
    end_time: str
    time_remaining_seconds: int
    status: str  # open | closed | awarded
    current_highest_bid: float
    current_highest_bidder_id: Optional[int] = None
    current_highest_bidder_name: Optional[str] = None
    total_bids: int
    decay_pct_applied: float
    anti_snipe_extensions_count: int
    is_ending_soon: bool
    bids: List[BidItemResponse] = []


class AuctionOutcomeResponse(BaseModel):
    id: int
    auction_id: int
    auction_code: str
    component_id: int
    component_name: str
    winning_bidder_id: Optional[int]
    winning_bidder_name: Optional[str]
    final_bid_amount: float
    starting_price: float
    reserve_price: float
    total_bids: int
    settlement_status: str
    closed_at: str
    notes: Optional[str] = None


class ActiveAuctionsSummaryResponse(BaseModel):
    total_active: int
    total_volume_inr: float
    auctions: List[AuctionDetailResponse]
