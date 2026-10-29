from datetime import datetime, timedelta
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from .models import Component, Buyer, ReturnItem
from .auction_models import ComponentAuction, AuctionBid, AuctionOutcome


# Configuration defaults
ANTI_SNIPE_WINDOW_SECONDS = 300       # 5 minutes
ANTI_SNIPE_EXTENSION_SECONDS = 300    # +5 minutes extension
DECAY_TRIGGER_THRESHOLD_PCT = 0.50    # Trigger decay if 50% time elapsed with 0 bids
DECAY_DISCOUNT_PCT = 0.10             # Auto-reduce starting price by 10%


def calculate_suggested_pricing(component: Component) -> Tuple[float, float]:
    """
    Auto-suggests starting price based on the component's estimated_value.
    Starting price = estimated_value (rounded to nearest 50).
    Reserve price = 75% of starting price.
    """
    est = float(component.estimated_value or 1000.0)
    suggested_start = round(est / 50.0) * 50.0
    suggested_reserve = round((suggested_start * 0.75) / 50.0) * 50.0
    return suggested_start, max(100.0, suggested_reserve)


def evaluate_dynamic_decay(auction: ComponentAuction, db: Session) -> bool:
    """
    Dutch-auction style fallback:
    If no bids have been received within 50% of the auction duration,
    auto-reduce the starting price by 10% to encourage faster clearance,
    stopping at reserve_price.
    """
    if auction.status != "open":
        return False

    # Check if any bids have been received
    bids_count = db.query(AuctionBid).filter(AuctionBid.auction_id == auction.id).count()
    if bids_count > 0:
        return False

    now = datetime.utcnow()
    total_duration = (auction.end_time - auction.start_time).total_seconds()
    if total_duration <= 0:
        return False

    elapsed = (now - auction.start_time).total_seconds()
    elapsed_ratio = elapsed / total_duration

    # If elapsed >= 50% and decay not yet fully applied
    if elapsed_ratio >= DECAY_TRIGGER_THRESHOLD_PCT and auction.decay_pct_applied == 0.0:
        discount_amount = auction.original_starting_price * DECAY_DISCOUNT_PCT
        new_price = max(auction.reserve_price, auction.original_starting_price - discount_amount)
        auction.starting_price = round(new_price, 2)
        auction.decay_pct_applied = DECAY_DISCOUNT_PCT * 100.0
        db.commit()
        db.refresh(auction)
        return True

    return False


def apply_anti_sniping(auction: ComponentAuction, now: datetime) -> bool:
    """
    If a bid arrives near auction close (< 5 minutes remaining),
    extend auction end_time by 5 minutes to prevent last-second sniping.
    """
    time_left = (auction.end_time - now).total_seconds()
    if 0 < time_left <= ANTI_SNIPE_WINDOW_SECONDS:
        auction.end_time = auction.end_time + timedelta(seconds=ANTI_SNIPE_EXTENSION_SECONDS)
        auction.anti_snipe_extensions_count += 1
        return True
    return False


def settle_and_close_auction(auction: ComponentAuction, db: Session, manual_close: bool = False) -> AuctionOutcome:
    """
    Finalizes an auction:
    - Awards to highest bidder if reserve_price met.
    - Records entry in auction_outcomes.
    - Updates component harvested & buyer match status.
    """
    now = datetime.utcnow()
    bids = db.query(AuctionBid).filter(AuctionBid.auction_id == auction.id).order_by(AuctionBid.bid_amount.desc()).all()
    highest_bid = bids[0] if bids else None

    # Check existing outcome
    existing_outcome = db.query(AuctionOutcome).filter(AuctionOutcome.auction_id == auction.id).first()
    if existing_outcome:
        return existing_outcome

    settlement_status = "expired"
    winning_bidder_id: Optional[int] = None
    final_amount = 0.0

    if highest_bid:
        if highest_bid.bid_amount >= auction.reserve_price:
            settlement_status = "awarded"
            winning_bidder_id = highest_bid.bidder_id
            final_amount = highest_bid.bid_amount
            highest_bid.status = "won"

            # Update other bids to lost
            for b in bids[1:]:
                b.status = "lost"

            # Update Component record
            comp = db.query(Component).filter(Component.id == auction.component_id).first()
            if comp:
                comp.is_harvested = True
                comp.buyer_match_id = winning_bidder_id

            auction.status = "awarded"
        else:
            settlement_status = "reserve_not_met"
            auction.status = "closed"
            for b in bids:
                b.status = "lost"
    else:
        settlement_status = "expired"
        auction.status = "closed"

    outcome = AuctionOutcome(
        auction_id=auction.id,
        component_id=auction.component_id,
        winning_bidder_id=winning_bidder_id,
        final_bid_amount=final_amount,
        starting_price=auction.starting_price,
        reserve_price=auction.reserve_price,
        total_bids=len(bids),
        settlement_status=settlement_status,
        closed_at=now,
        notes=f"Auction settled with status '{settlement_status}' ({'Manual Admin Close' if manual_close else 'Auto Timer Expire'})."
    )

    db.add(outcome)
    db.commit()
    db.refresh(outcome)
    db.refresh(auction)
    return outcome
