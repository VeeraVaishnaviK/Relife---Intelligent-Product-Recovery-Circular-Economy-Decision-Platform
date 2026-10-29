'use client';

import React, { useState } from 'react';
import { AuctionItem } from '../../lib/auctionTypes';
import { BuyerInfo } from '../../lib/types';
import { formatINR } from '../../lib/formatters';
import { placeAuctionBid } from '../../lib/auctionApi';
import {
  X,
  Gavel,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BidModalProps {
  auction: AuctionItem | null;
  buyers: BuyerInfo[];
  onClose: () => void;
  onSuccess: (updatedAuction: AuctionItem) => void;
}

export function BidModal({ auction, buyers, onClose, onSuccess }: BidModalProps) {
  if (!auction) return null;

  const minNextBid = Math.max(
    auction.starting_price,
    auction.current_highest_bid > 0
      ? auction.current_highest_bid + 100
      : auction.starting_price
  );

  const [bidderId, setBidderId] = useState<number>(buyers[0]?.id || 1);
  const [bidAmount, setBidAmount] = useState<number>(minNextBid);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickAdd = (delta: number) => {
    setBidAmount((prev) => Math.max(minNextBid, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount < minNextBid) {
      setError(`Minimum bid must be at least ${formatINR(minNextBid)}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await placeAuctionBid(auction.id, bidderId, bidAmount);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBuyer = buyers.find((b) => b.id === bidderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#252836]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFC21A]/20 to-[#F57C00]/20 border border-[#FFC21A]/40 flex items-center justify-center text-[#FFC21A]">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Place Competitive Bid</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181926] text-amber-400 border border-amber-500/30">
                  {auction.auction_code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auction.component.product_brand} {auction.component.product_model} • {auction.component.condition} {auction.component.component_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E202E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Current State Summary */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#08080D] border border-[#252836]">
          <div>
            <span className="text-[11px] text-slate-400 block">Current High Bid</span>
            <span className="text-lg font-bold text-[#FFC21A]">
              {auction.current_highest_bid > 0
                ? formatINR(auction.current_highest_bid)
                : formatINR(auction.starting_price)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {auction.current_highest_bidder_name
                ? `by ${auction.current_highest_bidder_name}`
                : 'Starting reserve floor'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Minimum Next Bid</span>
            <span className="text-lg font-bold text-emerald-400">
              {formatINR(minNextBid)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {auction.total_bids} bids placed so far
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Buyer Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Acting B2B Refurbisher / Bidder</span>
              <span className="text-[10px] text-slate-400">Verified Marketplace Partner</span>
            </label>
            <div className="relative">
              <select
                value={bidderId}
                onChange={(e) => setBidderId(Number(e.target.value))}
                className="w-full bg-[#08080D] border border-[#252836] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#FFC21A] transition-colors appearance-none cursor-pointer"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.buyer_type.replace('_', ' ')} • {b.demand_rating} demand)
                  </option>
                ))}
              </select>
            </div>
            {selectedBuyer && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Target parts: {selectedBuyer.target_components} • Loc: {selectedBuyer.location}</span>
              </p>
            )}
          </div>

          {/* Bid Amount Input with Quick-Increment Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Your Bid Amount (₹ INR)
              </label>
              <span className="text-[11px] font-mono text-emerald-400">
                Min: {formatINR(minNextBid)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="50"
                min={minNextBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full bg-[#08080D] border border-[#252836] rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#FFC21A] transition-colors"
                required
              />
            </div>

            {/* Quick-add chips */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Quick add:</span>
              {[100, 250, 500, 1000].map((delta) => (
                <button
                  type="button"
                  key={delta}
                  onClick={() => handleQuickAdd(delta)}
                  className="px-2.5 py-1 rounded-lg bg-[#181926] hover:bg-[#252836] text-[11px] font-semibold text-amber-300 border border-[#252836] transition-colors"
                >
                  +{delta}
                </button>
              ))}
            </div>
          </div>

          {/* Fairness & Anti-Sniping Disclaimer */}
          <div className="p-3 rounded-2xl bg-[#08080D]/60 border border-[#252836] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Sniping Fairness Active</span>
            </div>
            <p>
              Bids placed within the final 5 minutes automatically extend the countdown by +5 minutes to protect fair competitive access for all repair shops and recyclers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || bidAmount < minNextBid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gavel className="w-4 h-4" />
              <span>{isSubmitting ? 'Placing Bid...' : `Confirm Bid • ${formatINR(bidAmount)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
