'use client';

import React from 'react';
import { AuctionOutcomeItem } from '../../lib/auctionTypes';
import { formatINR } from '../../lib/formatters';
import {
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface AuctionOutcomeHistoryProps {
  outcomes: AuctionOutcomeItem[];
  isLoading: boolean;
}

export function AuctionOutcomeHistory({ outcomes, isLoading }: AuctionOutcomeHistoryProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-[#12131A] rounded-3xl border border-[#252836]">
        Loading closed-loop auction settlements...
      </div>
    );
  }

  if (outcomes.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-[#12131A] rounded-3xl border border-[#252836] space-y-2">
        <Award className="w-8 h-8 text-slate-600 mx-auto" />
        <p>No settled auction outcomes yet. Completed or closed auctions will be logged here for audit verification.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#12131A] rounded-3xl border border-[#252836] overflow-hidden">
      <div className="p-5 border-b border-[#252836] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-[#FFC21A]" />
          <div>
            <h3 className="text-sm font-bold text-white">Closed-Loop Auction Settlement Ledger</h3>
            <p className="text-xs text-slate-400">Auditable realization records linking awarded lots to circular buyer accounts</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-xl bg-[#181926] text-amber-300 border border-[#252836]">
          {outcomes.length} Settled Record{outcomes.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#08080D] text-slate-400 font-semibold border-b border-[#252836]">
            <tr>
              <th className="py-3 px-4">Auction Code</th>
              <th className="py-3 px-4">Component Sub-Assembly</th>
              <th className="py-3 px-4">Winning Circular Buyer</th>
              <th className="py-3 px-4">Final Cleared Value</th>
              <th className="py-3 px-4">Reserve Floor</th>
              <th className="py-3 px-4">Bids</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Settled At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E202E]">
            {outcomes.map((out) => (
              <tr key={out.id} className="hover:bg-[#181926]/50 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-white">
                  {out.auction_code}
                </td>
                <td className="py-3 px-4 text-slate-300 font-medium">
                  {out.component_name}
                </td>
                <td className="py-3 px-4">
                  {out.winning_bidder_name ? (
                    <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-[#FFC21A]" />
                      {out.winning_bidder_name}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Unallocated</span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                  {out.final_bid_amount > 0 ? formatINR(out.final_bid_amount) : '—'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">
                  {formatINR(out.reserve_price)}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {out.total_bids} bids
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      out.settlement_status === 'awarded'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                        : out.settlement_status === 'reserve_not_met'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {out.settlement_status === 'awarded' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {out.settlement_status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                  {out.closed_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
