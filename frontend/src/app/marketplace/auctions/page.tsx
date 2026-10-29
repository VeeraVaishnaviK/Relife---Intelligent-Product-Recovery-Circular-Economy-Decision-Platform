'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ActiveAuctionsResponse,
  AuctionItem,
  AuctionOutcomeItem,
} from '../../../lib/auctionTypes';
import {
  fetchActiveAuctions,
  fetchAuctionOutcomeHistory,
  closeAuction,
} from '../../../lib/auctionApi';
import { fetchMarketplaceComponents, fetchMarketplaceBuyers } from '../../../lib/api';
import { ComponentCardItem, BuyerInfo } from '../../../lib/types';
import { formatINR } from '../../../lib/formatters';
import { AuctionCard } from '../../../components/auctions/AuctionCard';
import { BidModal } from '../../../components/auctions/BidModal';
import { CreateAuctionModal } from '../../../components/auctions/CreateAuctionModal';
import { AuctionOutcomeHistory } from '../../../components/auctions/AuctionOutcomeHistory';
import {
  Gavel,
  Flame,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Award,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const FILTER_TYPES = [
  { id: 'all', label: 'All Components' },
  { id: 'display', label: 'Displays' },
  { id: 'motherboard', label: 'Motherboards' },
  { id: 'battery', label: 'Batteries' },
  { id: 'ram', label: 'RAM' },
  { id: 'storage', label: 'Storage' },
];

export default function MarketplaceAuctionsPage() {
  const [activeData, setActiveData] = useState<ActiveAuctionsResponse | null>(null);
  const [outcomes, setOutcomes] = useState<AuctionOutcomeItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerInfo[]>([]);
  const [components, setComponents] = useState<ComponentCardItem[]>([]);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'active' | 'outcomes'>('active');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<AuctionItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAuctions = useCallback(async (quiet: boolean = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await fetchActiveAuctions(selectedType === 'all' ? undefined : selectedType);
      setActiveData(data);
    } catch (err: any) {
      console.error('Error fetching auctions:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [selectedType]);

  const loadSupportingData = async () => {
    try {
      const [buyersData, compsData, outcomesData] = await Promise.all([
        fetchMarketplaceBuyers(),
        fetchMarketplaceComponents({}),
        fetchAuctionOutcomeHistory(),
      ]);
      setBuyers(buyersData);
      setComponents(compsData);
      setOutcomes(outcomesData);
    } catch (err: any) {
      console.error('Error loading supporting data:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuctions();
    loadSupportingData();
  }, [loadAuctions]);

  // Real-time polling every 6 seconds for active auctions
  useEffect(() => {
    const interval = setInterval(() => {
      loadAuctions(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadAuctions]);

  const handleCloseAuction = async (auctionId: number) => {
    try {
      const outcome = await closeAuction(auctionId);
      showToast(`Auction ${outcome.auction_code} settled! Status: ${outcome.settlement_status}`);
      loadAuctions();
      const updatedOutcomes = await fetchAuctionOutcomeHistory();
      setOutcomes(updatedOutcomes);
    } catch (err: any) {
      showToast(`Settlement failed: ${err.message}`);
    }
  };

  const totalExtensions = activeData?.auctions.reduce(
    (acc, a) => acc + a.anti_snipe_extensions_count,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#08080D] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12131A] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-[#FFC21A]/50 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FFC21A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#0D0E15]/90 backdrop-blur-md border-b border-[#252836] px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-bold text-[#FFC21A] hover:underline px-3 py-1.5 rounded-xl bg-[#181926] border border-[#252836]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFC21A] to-[#F57C00] flex items-center justify-center text-slate-950 font-black">
                <Gavel className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Reverse Component Auction Exchange</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                    Live Bidding Active
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Dynamic pricing engine with Dutch decay fallback and anti-sniping fairness buffer
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={() => loadAuctions()}
              className="p-2 rounded-xl bg-[#12131A] border border-[#252836] text-slate-300 hover:text-white hover:bg-[#1E202E] transition-colors"
              title="Refresh live auctions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FFC21A]' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-900/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch New Auction</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-5 sm:p-6 lg:p-7 space-y-6">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-[#12131A] border border-[#252836] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Open Auctions</span>
              <Gavel className="w-4 h-4 text-[#FFC21A]" />
            </div>
            <div className="text-2xl font-black text-white">
              {activeData?.total_active ?? '...'}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live competitive marketplace
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-[#12131A] border border-[#252836] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Marketplace Active Volume</span>
              <TrendingUp className="w-4 h-4 text-[#FFC21A]" />
            </div>
            <div className="text-2xl font-black text-[#FFC21A]">
              {formatINR(activeData?.total_volume_inr ?? 0)}
            </div>
            <span className="text-[11px] text-slate-400">
              Aggregated starting & bid value
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-[#12131A] border border-[#252836] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Fairness Anti-Sniping</span>
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <div className="text-2xl font-black text-white">
              {totalExtensions} <span className="text-xs font-normal text-slate-400">trigger{totalExtensions === 1 ? '' : 's'}</span>
            </div>
            <span className="text-[11px] text-[#22D3EE]">
              +5m buffer on last-minute bids
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-[#12131A] border border-[#252836] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Settled Lots Audit</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {outcomes.length}
            </div>
            <span className="text-[11px] text-slate-400">
              Closed-loop realization ledger
            </span>
          </div>
        </div>

        {/* View Toggle Tabs & Category Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#252836]">
          {/* Main View Mode Selector */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#12131A] border border-[#252836]">
            <button
              onClick={() => setViewMode('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'active'
                  ? 'bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Active Auctions ({activeData?.total_active ?? 0})</span>
            </button>

            <button
              onClick={() => setViewMode('outcomes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'outcomes'
                  ? 'bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Settlement Ledger ({outcomes.length})</span>
            </button>
          </div>

          {/* Component Filter Pills (only for active mode) */}
          {viewMode === 'active' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {FILTER_TYPES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                    selectedType === f.id
                      ? 'bg-amber-500/20 text-[#FFC21A] border-[#FFC21A]'
                      : 'bg-[#12131A] text-slate-400 border-[#252836] hover:bg-[#181926]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Content View */}
        {viewMode === 'active' ? (
          isLoading && !activeData ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-[#12131A] rounded-3xl border border-[#252836] space-y-3">
              <RefreshCw className="w-6 h-6 text-[#FFC21A] animate-spin mx-auto" />
              <p>Loading live auctions and dynamic pricing data...</p>
            </div>
          ) : activeData && activeData.auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeData.auctions.map((auc) => (
                <AuctionCard
                  key={auc.id}
                  auction={auc}
                  onOpenBid={(auction) => setSelectedAuctionForBid(auction)}
                  onCloseAuction={handleCloseAuction}
                  onExpire={() => loadAuctions(true)}
                />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400 bg-[#12131A] rounded-3xl border border-[#252836] space-y-4">
              <Gavel className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">No active auctions for this category</h3>
                <p className="text-slate-400 pt-1">
                  Launch a new dynamic auction from harvested component inventory.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181926] text-[#FFC21A] border border-amber-500/40 text-xs font-bold hover:bg-[#252836] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Launch New Auction</span>
              </button>
            </div>
          )
        ) : (
          <AuctionOutcomeHistory outcomes={outcomes} isLoading={false} />
        )}
      </main>

      {/* Interactive Modals */}
      <BidModal
        auction={selectedAuctionForBid}
        buyers={buyers}
        onClose={() => setSelectedAuctionForBid(null)}
        onSuccess={(updated) => {
          showToast(`Bid placed on ${updated.auction_code} for ${formatINR(updated.current_highest_bid)}!`);
          loadAuctions(true);
        }}
      />

      <CreateAuctionModal
        isOpen={isCreateOpen}
        components={components}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newAuc) => {
          showToast(`Auction ${newAuc.auction_code} launched successfully!`);
          loadAuctions();
        }}
      />
    </div>
  );
}
