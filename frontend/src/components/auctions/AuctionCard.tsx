'use client';

import React, { useState } from 'react';
import { AuctionItem } from '../../lib/auctionTypes';
import { formatINR } from '../../lib/formatters';
import { AuctionCountdownTimer } from './AuctionCountdownTimer';
import {
  Gavel,
  Clock,
  Sparkles,
  TrendingDown,
  Building2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface AuctionCardProps {
  auction: AuctionItem;
  onOpenBid: (auction: AuctionItem) => void;
  onCloseAuction: (auctionId: number) => void;
  onExpire: () => void;
}

export function AuctionCard({
  auction,
  onOpenBid,
  onCloseAuction,
  onExpire,
}: AuctionCardProps) {
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const comp = auction.component;
  const isAuctionOpen = auction.status === 'open';
  const hasDecay = auction.decay_pct_applied > 0;

  const handleAdminClose = async () => {
    if (!confirm(`Are you sure you want to finalize and settle auction ${auction.auction_code}?`)) {
      return;
    }
    setIsClosing(true);
    try {
      await onCloseAuction(auction.id);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="bg-[#12131A] border border-[#252836] hover:border-[#FFC21A]/50 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all duration-200 group">
      <div className="space-y-4">
        {/* Card Header: Code, Badges & Timer */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white px-2.5 py-0.5 rounded-lg bg-[#181926] border border-[#252836]">
                {auction.auction_code}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  comp.condition === 'Grade A'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                    : comp.condition === 'Grade B'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {comp.condition}
              </span>

              {hasDecay && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/40 animate-pulse">
                  <TrendingDown className="w-3 h-3" />
                  <span>Dutch Decay -{auction.decay_pct_applied}%</span>
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white group-hover:text-[#FFC21A] transition-colors">
              {comp.component_type.toUpperCase()} • {comp.product_brand} {comp.product_model}
            </h4>
            <span className="text-[11px] text-slate-400 block">
              Passport Return ID: <span className="font-mono text-slate-300">{comp.return_id}</span>
            </span>
          </div>

          {/* Countdown Timer */}
          <AuctionCountdownTimer
            initialSeconds={auction.time_remaining_seconds}
            isEndingSoon={auction.is_ending_soon}
            antiSnipeCount={auction.anti_snipe_extensions_count}
            onExpire={onExpire}
          />
        </div>

        {/* Pricing Metrics Box */}
        <div className="p-3.5 rounded-2xl bg-[#08080D] border border-[#252836] grid grid-cols-2 gap-3">
          {/* Current Bid */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              {auction.current_highest_bid > 0 ? 'Current Highest Bid' : 'Starting Reserve Floor'}
            </span>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-xl font-black text-[#FFC21A]">
                {auction.current_highest_bid > 0
                  ? formatINR(auction.current_highest_bid)
                  : formatINR(auction.starting_price)}
              </span>
              {hasDecay && auction.current_highest_bid === 0 && (
                <span className="text-xs text-slate-500 line-through">
                  {formatINR(auction.original_starting_price)}
                </span>
              )}
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              {auction.current_highest_bidder_name ? (
                <span className="flex items-center gap-1 text-amber-300 font-semibold truncate">
                  <Building2 className="w-3 h-3 text-[#FFC21A] shrink-0" />
                  <span className="truncate">{auction.current_highest_bidder_name}</span>
                </span>
              ) : (
                <span className="text-slate-500 italic">No bids placed yet</span>
              )}
            </div>
          </div>

          {/* Reserve & Bids Count */}
          <div className="text-right border-l border-[#1E202E] pl-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                Reserve Price Floor
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {formatINR(auction.reserve_price)}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                <strong className="text-white">{auction.total_bids}</strong> bid{auction.total_bids === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Bid History Accordion Toggle */}
        {auction.bids.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full py-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-[#FFC21A]" />
                <span>Live Bid Feed ({auction.bids.length})</span>
              </span>
              {showHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {auction.bids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      i === 0
                        ? 'bg-amber-500/10 border-amber-500/30 text-white font-semibold'
                        : 'bg-[#08080D] border-[#1E202E] text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                      <span className="truncate">{bid.bidder_name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={i === 0 ? 'text-[#FFC21A] font-bold' : ''}>
                        {formatINR(bid.bid_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 border-t border-[#1E202E] flex items-center justify-between gap-2 mt-4">
        {isAuctionOpen ? (
          <>
            <button
              onClick={() => onOpenBid(auction)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-900/30"
            >
              <Gavel className="w-4 h-4" />
              <span>Place Competitive Bid</span>
            </button>

            <button
              onClick={handleAdminClose}
              disabled={isClosing}
              title="Admin early close & settlement"
              className="p-2.5 rounded-xl bg-[#181926] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#252836] hover:border-rose-500/40 transition-colors text-xs font-semibold"
            >
              {isClosing ? '...' : 'Close'}
            </button>
          </>
        ) : (
          <div className="w-full py-2 px-3 rounded-xl bg-[#181926] border border-[#252836] text-center text-xs font-semibold text-slate-400">
            Auction {auction.status.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
