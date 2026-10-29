'use client';

import React, { useState, useEffect } from 'react';
import { ComponentCardItem } from '../../lib/types';
import { formatINR } from '../../lib/formatters';
import { createAuction } from '../../lib/auctionApi';
import { AuctionItem } from '../../lib/auctionTypes';
import {
  X,
  PlusCircle,
  Cpu,
  Layers,
  Sparkles,
  Clock,
  AlertCircle,
  Gavel,
} from 'lucide-react';

interface CreateAuctionModalProps {
  isOpen: boolean;
  components: ComponentCardItem[];
  onClose: () => void;
  onSuccess: (newAuction: AuctionItem) => void;
}

export function CreateAuctionModal({
  isOpen,
  components,
  onClose,
  onSuccess,
}: CreateAuctionModalProps) {
  if (!isOpen) return null;

  const availableComponents = components.filter((c) => !c.is_harvested);

  const [selectedCompId, setSelectedCompId] = useState<number>(
    availableComponents[0]?.id || (components[0]?.id || 1)
  );
  const [durationHours, setDurationHours] = useState<number>(24);
  const [customStartPrice, setCustomStartPrice] = useState<string>('');
  const [customReservePrice, setCustomReservePrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeComp = components.find((c) => c.id === selectedCompId);
  const suggestedStart = activeComp ? activeComp.estimated_value : 2500;
  const suggestedReserve = Math.round(suggestedStart * 0.75);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        component_id: selectedCompId,
        duration_hours: durationHours,
        starting_price: customStartPrice ? Number(customStartPrice) : suggestedStart,
        reserve_price: customReservePrice ? Number(customReservePrice) : suggestedReserve,
      };

      const newAuc = await createAuction(payload);
      onSuccess(newAuc);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to launch auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#252836]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFC21A]/20 to-[#F57C00]/20 border border-[#FFC21A]/40 flex items-center justify-center text-[#FFC21A]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Launch Dynamic Component Auction
              </span>
              <p className="text-xs text-slate-400">
                Put harvested parts up for competitive multi-buyer bidding
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Component Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select Harvested Component Lot
            </label>
            <select
              value={selectedCompId}
              onChange={(e) => {
                setSelectedCompId(Number(e.target.value));
                setCustomStartPrice('');
                setCustomReservePrice('');
              }}
              className="w-full bg-[#08080D] border border-[#252836] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#FFC21A] transition-colors cursor-pointer"
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.condition}] {c.component_type.toUpperCase()} • {c.product_name} (Val: {formatINR(c.estimated_value)})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Suggestion Card */}
          {activeComp && (
            <div className="p-4 rounded-2xl bg-[#08080D] border border-[#252836] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC21A]" />
                  <span>AI Recommended Starting Valuation</span>
                </span>
                <span className="font-bold text-[#FFC21A]">
                  {formatINR(suggestedStart)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder={suggestedStart.toString()}
                    value={customStartPrice}
                    onChange={(e) => setCustomStartPrice(e.target.value)}
                    className="w-full bg-[#12131A] border border-[#252836] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FFC21A]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Reserve Floor Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder={suggestedReserve.toString()}
                    value={customReservePrice}
                    onChange={(e) => setCustomReservePrice(e.target.value)}
                    className="w-full bg-[#12131A] border border-[#252836] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FFC21A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auction Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FFC21A]" />
              <span>Auction Duration</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '2 Hours (Flash)', val: 2 },
                { label: '6 Hours', val: 6 },
                { label: '24 Hours', val: 24 },
                { label: '48 Hours', val: 48 },
              ].map((d) => (
                <button
                  type="button"
                  key={d.val}
                  onClick={() => setDurationHours(d.val)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-colors ${
                    durationHours === d.val
                      ? 'bg-amber-500/20 text-[#FFC21A] border-[#FFC21A]'
                      : 'bg-[#08080D] text-slate-400 border-[#252836] hover:bg-[#181926]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mechanism Notice */}
          <div className="p-3 rounded-2xl bg-[#08080D]/60 border border-[#252836] text-[11px] text-slate-400">
            <p>
              Includes <strong>Dutch-auction decay fallback</strong>: If zero bids arrive within 50% of the duration, starting price auto-decrements by 10% to clear inventory quickly.
            </p>
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-900/30 disabled:opacity-50"
            >
              <Gavel className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Launch Live Auction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
