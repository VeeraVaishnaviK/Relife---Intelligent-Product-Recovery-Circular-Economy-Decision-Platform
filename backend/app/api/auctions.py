from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Component, Buyer, ReturnItem, Product
from ..auction_models import ComponentAuction, AuctionBid, AuctionOutcome
from ..auction_schemas import (
    CreateAuctionRequest,
    PlaceBidRequest,
    AuctionDetailResponse,
    AuctionComponentDetails,
    BidItemResponse,
    AuctionOutcomeResponse,
    ActiveAuctionsSummaryResponse,
)
from ..dynamic_pricing import (
    calculate_suggested_pricing,
    evaluate_dynamic_decay,
    apply_anti_sniping,
    settle_and_close_auction,
    ANTI_SNIPE_WINDOW_SECONDS
)

router = APIRouter(prefix="/api/auctions", tags=["auctions"])


def _format_auction_detail(auction: ComponentAuction, db: Session) -> AuctionDetailResponse:
    now = datetime.utcnow()
    # Check if expired and needs auto-close
    if auction.status == "open" and now >= auction.end_time:
        settle_and_close_auction(auction, db, manual_close=False)

    # Check dynamic decay
    evaluate_dynamic_decay(auction, db)

    time_left = max(0, int((auction.end_time - now).total_seconds())) if auction.status == "open" else 0
    is_ending_soon = auction.status == "open" and 0 < time_left <= ANTI_SNIPE_WINDOW_SECONDS

    # Component & product info
    comp = auction.component or db.query(Component).filter(Component.id == auction.component_id).first()
    ret = db.query(ReturnItem).filter(ReturnItem.id == comp.return_id).first() if comp else None
    prod = ret.product if ret else None

    component_details = AuctionComponentDetails(
        id=comp.id if comp else auction.component_id,
        return_id=comp.return_id if comp else "N/A",
        component_type=comp.component_type if comp else "Unknown Part",
        condition=comp.condition if comp else "Grade B",
        estimated_value=comp.estimated_value if comp else 0.0,
        product_brand=prod.brand if prod else "OEM",
        product_model=prod.model if prod else "Sub-Assembly",
        category=prod.category if prod else "Electronics"
    )

    # Bidder info
    highest_bidder_name = None
    if auction.current_highest_bidder_id:
        buyer = db.query(Buyer).filter(Buyer.id == auction.current_highest_bidder_id).first()
        if buyer:
            highest_bidder_name = buyer.name

    # Formatted bid items
    bids = (
        db.query(AuctionBid)
        .filter(AuctionBid.auction_id == auction.id)
        .order_by(AuctionBid.bid_amount.desc())
        .all()
    )
    bid_items = []
    for b in bids:
        b_buyer = b.bidder or db.query(Buyer).filter(Buyer.id == b.bidder_id).first()
        bid_items.append(
            BidItemResponse(
                id=b.id,
                auction_id=b.auction_id,
                bidder_id=b.bidder_id,
                bidder_name=b_buyer.name if b_buyer else f"Buyer #{b.bidder_id}",
                bidder_type=b_buyer.buyer_type if b_buyer else "refurbisher",
                bid_amount=round(b.bid_amount, 2),
                bid_time=b.bid_time.strftime("%Y-%m-%d %H:%M:%S"),
                status=b.status,
            )
        )

    return AuctionDetailResponse(
        id=auction.id,
        auction_code=auction.auction_code,
        component_id=auction.component_id,
        component=component_details,
        starting_price=round(auction.starting_price, 2),
        original_starting_price=round(auction.original_starting_price, 2),
        reserve_price=round(auction.reserve_price, 2),
        start_time=auction.start_time.strftime("%Y-%m-%d %H:%M:%S"),
        end_time=auction.end_time.strftime("%Y-%m-%d %H:%M:%S"),
        time_remaining_seconds=time_left,
        status=auction.status,
        current_highest_bid=round(auction.current_highest_bid, 2),
        current_highest_bidder_id=auction.current_highest_bidder_id,
        current_highest_bidder_name=highest_bidder_name,
        total_bids=len(bids),
        decay_pct_applied=round(auction.decay_pct_applied, 1),
        anti_snipe_extensions_count=auction.anti_snipe_extensions_count,
        is_ending_soon=is_ending_soon,
        bids=bid_items,
    )


def _seed_demo_auctions_if_empty(db: Session):
    """
    Seeds canonical open auctions and sample bids for instant demo fidelity.
    """
    count = db.query(ComponentAuction).count()
    if count > 0:
        return

    components = db.query(Component).filter(Component.is_harvested == False).all()
    if not components:
        components = db.query(Component).all()

    buyers = db.query(Buyer).all()
    if not components or not buyers:
        return

    now = datetime.utcnow()
    demo_configs = [
        {"duration_mins": 45, "hours_elapsed": 0.5, "bids": 2},
        {"duration_mins": 12, "hours_elapsed": 0.8, "bids": 3},  # Near close, high competition
        {"duration_mins": 180, "hours_elapsed": 2.0, "bids": 0}, # Decay candidate (0 bids > 50% time)
        {"duration_mins": 360, "hours_elapsed": 0.2, "bids": 1},
    ]

    for idx, comp in enumerate(components[:4]):
        cfg = demo_configs[idx % len(demo_configs)]
        start_val, reserve_val = calculate_suggested_pricing(comp)
        auc_code = f"AUC-2026-{idx+1:03d}"

        start_dt = now - timedelta(hours=cfg["hours_elapsed"])
        end_dt = start_dt + timedelta(minutes=cfg["duration_mins"])

        auction = ComponentAuction(
            auction_code=auc_code,
            component_id=comp.id,
            starting_price=start_val,
            original_starting_price=start_val,
            reserve_price=reserve_val,
            start_time=start_dt,
            end_time=end_dt,
            status="open",
            current_highest_bid=0.0,
            decay_pct_applied=0.0,
            anti_snipe_extensions_count=0
        )
        db.add(auction)
        db.commit()
        db.refresh(auction)

        # Add sample competitive bids
        if cfg["bids"] > 0:
            current_bid = start_val
            for b_idx in range(cfg["bids"]):
                buyer = buyers[b_idx % len(buyers)]
                bid_increment = 200.0 * (b_idx + 1)
                bid_amount = start_val + bid_increment
                is_last = (b_idx == cfg["bids"] - 1)

                bid = AuctionBid(
                    auction_id=auction.id,
                    bidder_id=buyer.id,
                    bid_amount=bid_amount,
                    bid_time=start_dt + timedelta(minutes=10 * (b_idx + 1)),
                    status="active" if is_last else "outbid"
                )
                db.add(bid)
                current_bid = bid_amount
                if is_last:
                    auction.current_highest_bid = current_bid
                    auction.current_highest_bidder_id = buyer.id
            db.commit()
        else:
            # Check dynamic decay for the zero-bid item
            evaluate_dynamic_decay(auction, db)


@router.get("/active", response_model=ActiveAuctionsSummaryResponse)
def get_active_auctions(
    component_type: Optional[str] = Query(None, description="Filter by component type"),
    db: Session = Depends(get_db)
):
    """
    List all currently open auctions with live dynamic pricing & countdowns.
    """
    _seed_demo_auctions_if_empty(db)

    query = db.query(ComponentAuction).filter(ComponentAuction.status == "open")
    auctions = query.order_by(ComponentAuction.end_time.asc()).all()

    formatted_list = []
    total_volume = 0.0

    for auc in auctions:
        formatted = _format_auction_detail(auc, db)
        if component_type and formatted.component.component_type.lower() != component_type.lower():
            continue
        total_volume += max(formatted.current_highest_bid, formatted.starting_price)
        formatted_list.append(formatted)

    return ActiveAuctionsSummaryResponse(
        total_active=len(formatted_list),
        total_volume_inr=round(total_volume, 2),
        auctions=formatted_list
    )


@router.post("/create", response_model=AuctionDetailResponse)
def create_auction(payload: CreateAuctionRequest, db: Session = Depends(get_db)):
    """
    Creates a new dynamic reverse auction for a harvested component.
    """
    comp = db.query(Component).filter(Component.id == payload.component_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")

    # Check if active auction already exists for this component
    existing = db.query(ComponentAuction).filter(
        ComponentAuction.component_id == payload.component_id,
        ComponentAuction.status == "open"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Active auction {existing.auction_code} already exists for this component")

    suggested_start, suggested_reserve = calculate_suggested_pricing(comp)
    starting_price = payload.starting_price or suggested_start
    reserve_price = payload.reserve_price or suggested_reserve

    now = datetime.utcnow()
    duration_hrs = payload.duration_hours or 24.0
    end_time = now + timedelta(hours=duration_hrs)

    next_id = db.query(ComponentAuction).count() + 1
    auction_code = f"AUC-2026-{next_id:03d}"

    auction = ComponentAuction(
        auction_code=auction_code,
        component_id=comp.id,
        starting_price=starting_price,
        original_starting_price=starting_price,
        reserve_price=reserve_price,
        start_time=now,
        end_time=end_time,
        status="open",
        current_highest_bid=0.0,
        decay_pct_applied=0.0,
        anti_snipe_extensions_count=0
    )
    db.add(auction)
    db.commit()
    db.refresh(auction)

    return _format_auction_detail(auction, db)


@router.get("/{auction_id}", response_model=AuctionDetailResponse)
def get_auction_details(auction_id: int, db: Session = Depends(get_db)):
    """
    Get live auction details, countdown, and full bid history.
    """
    auction = db.query(ComponentAuction).filter(ComponentAuction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    return _format_auction_detail(auction, db)


@router.post("/{auction_id}/bid", response_model=AuctionDetailResponse)
def place_bid(auction_id: int, payload: PlaceBidRequest, db: Session = Depends(get_db)):
    """
    Place a competitive bid. Validates bid amount > current highest, applies anti-sniping if close to deadline.
    """
    auction = db.query(ComponentAuction).filter(ComponentAuction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    now = datetime.utcnow()
    if auction.status != "open" or now >= auction.end_time:
        if auction.status == "open":
            settle_and_close_auction(auction, db, manual_close=False)
        raise HTTPException(status_code=400, detail="This auction has expired or is closed")

    buyer = db.query(Buyer).filter(Buyer.id == payload.bidder_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Registered buyer not found")

    # Minimum bid threshold
    min_bid = max(auction.starting_price, auction.current_highest_bid + 50.0)
    if payload.bid_amount < min_bid:
        raise HTTPException(
            status_code=400,
            detail=f"Bid amount ₹{payload.bid_amount:,.2f} must be at least ₹{min_bid:,.2f}"
        )

    # Mark existing active bids as outbid
    db.query(AuctionBid).filter(
        AuctionBid.auction_id == auction.id,
        AuctionBid.status == "active"
    ).update({"status": "outbid"})

    # Record new bid
    new_bid = AuctionBid(
        auction_id=auction.id,
        bidder_id=payload.bidder_id,
        bid_amount=payload.bid_amount,
        bid_time=now,
        status="active"
    )
    db.add(new_bid)

    # Update auction highest bid
    auction.current_highest_bid = payload.bid_amount
    auction.current_highest_bidder_id = payload.bidder_id

    # Anti-sniping check: extend if within last 5 minutes
    apply_anti_sniping(auction, now)

    db.commit()
    db.refresh(auction)

    return _format_auction_detail(auction, db)


@router.post("/{auction_id}/close", response_model=AuctionOutcomeResponse)
def close_auction(auction_id: int, db: Session = Depends(get_db)):
    """
    Closes the auction manually by admin or timer. Awards to highest bidder and records outcome.
    """
    auction = db.query(ComponentAuction).filter(ComponentAuction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    outcome = settle_and_close_auction(auction, db, manual_close=True)

    comp = db.query(Component).filter(Component.id == auction.component_id).first()
    comp_name = f"{comp.condition} {comp.component_type}" if comp else "Harvested Part"
    winning_buyer = db.query(Buyer).filter(Buyer.id == outcome.winning_bidder_id).first() if outcome.winning_bidder_id else None

    return AuctionOutcomeResponse(
        id=outcome.id,
        auction_id=auction.id,
        auction_code=auction.auction_code,
        component_id=auction.component_id,
        component_name=comp_name,
        winning_bidder_id=outcome.winning_bidder_id,
        winning_bidder_name=winning_buyer.name if winning_buyer else None,
        final_bid_amount=round(outcome.final_bid_amount, 2),
        starting_price=round(outcome.starting_price, 2),
        reserve_price=round(outcome.reserve_price, 2),
        total_bids=outcome.total_bids,
        settlement_status=outcome.settlement_status,
        closed_at=outcome.closed_at.strftime("%Y-%m-%d %H:%M:%S"),
        notes=outcome.notes
    )


@router.get("/outcomes/history", response_model=List[AuctionOutcomeResponse])
def list_auction_outcomes(db: Session = Depends(get_db)):
    """
    Lists historical settled auction outcomes for audit tracking.
    """
    outcomes = db.query(AuctionOutcome).order_by(AuctionOutcome.closed_at.desc()).all()
    results = []
    for out in outcomes:
        auc = db.query(ComponentAuction).filter(ComponentAuction.id == out.auction_id).first()
        comp = db.query(Component).filter(Component.id == out.component_id).first()
        buyer = db.query(Buyer).filter(Buyer.id == out.winning_bidder_id).first() if out.winning_bidder_id else None

        results.append(
            AuctionOutcomeResponse(
                id=out.id,
                auction_id=out.auction_id,
                auction_code=auc.auction_code if auc else f"AUC-{out.auction_id}",
                component_id=out.component_id,
                component_name=f"{comp.condition} {comp.component_type}" if comp else "Component",
                winning_bidder_id=out.winning_bidder_id,
                winning_bidder_name=buyer.name if buyer else None,
                final_bid_amount=round(out.final_bid_amount, 2),
                starting_price=round(out.starting_price, 2),
                reserve_price=round(out.reserve_price, 2),
                total_bids=out.total_bids,
                settlement_status=out.settlement_status,
                closed_at=out.closed_at.strftime("%Y-%m-%d %H:%M:%S"),
                notes=out.notes
            )
        )
    return results
