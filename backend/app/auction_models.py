from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


# 1. Component Auctions Table
class ComponentAuction(Base):
    __tablename__ = "component_auctions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    auction_code = Column(String(32), unique=True, index=True, nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False, index=True)
    starting_price = Column(Float, nullable=False, default=0.0)
    original_starting_price = Column(Float, nullable=False, default=0.0)
    reserve_price = Column(Float, nullable=False, default=0.0)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=False, index=True)
    status = Column(String(32), nullable=False, default="open", index=True)  # open | closed | awarded
    current_highest_bid = Column(Float, nullable=False, default=0.0)
    current_highest_bidder_id = Column(Integer, ForeignKey("buyers.id"), nullable=True)
    decay_pct_applied = Column(Float, nullable=False, default=0.0)
    anti_snipe_extensions_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships (Additive)
    component = relationship("Component", foreign_keys=[component_id])
    highest_bidder = relationship("Buyer", foreign_keys=[current_highest_bidder_id])
    bids = relationship("AuctionBid", back_populates="auction", cascade="all, delete-orphan", order_by="desc(AuctionBid.bid_amount)")


# 2. Auction Bids Table
class AuctionBid(Base):
    __tablename__ = "auction_bids"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    auction_id = Column(Integer, ForeignKey("component_auctions.id"), nullable=False, index=True)
    bidder_id = Column(Integer, ForeignKey("buyers.id"), nullable=False, index=True)
    bid_amount = Column(Float, nullable=False)
    bid_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(String(32), nullable=False, default="active")  # active | outbid | won | lost

    auction = relationship("ComponentAuction", back_populates="bids")
    bidder = relationship("Buyer", foreign_keys=[bidder_id])


# 3. Auction Outcomes Table (Aligns with Recovery Outcome Ledger)
class AuctionOutcome(Base):
    __tablename__ = "auction_outcomes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    auction_id = Column(Integer, ForeignKey("component_auctions.id"), nullable=False, index=True)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False, index=True)
    winning_bidder_id = Column(Integer, ForeignKey("buyers.id"), nullable=True)
    final_bid_amount = Column(Float, nullable=False, default=0.0)
    starting_price = Column(Float, nullable=False, default=0.0)
    reserve_price = Column(Float, nullable=False, default=0.0)
    total_bids = Column(Integer, nullable=False, default=0)
    settlement_status = Column(String(32), nullable=False, default="awarded")  # awarded | reserve_not_met | expired
    closed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    auction = relationship("ComponentAuction", foreign_keys=[auction_id])
    component = relationship("Component", foreign_keys=[component_id])
    winning_bidder = relationship("Buyer", foreign_keys=[winning_bidder_id])
