'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { formatINR } from '../../lib/formatters';
import { fetchMarketplaceComponents, fetchMarketplaceBuyers, allocateComponent } from '../../lib/api';
import { ComponentCardItem, BuyerInfo } from '../../lib/types';
import {
  ShoppingBag,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Download,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw,
  Clock,
  AlertCircle,
  Gavel
} from 'lucide-react';

export function MarketplaceWorkbench() {
  const [components, setComponents] = useState<ComponentCardItem[]>([]);
  const [buyers, setBuyers] = useState<BuyerInfo[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedCompForModal, setSelectedCompForModal] = useState<ComponentCardItem | null>(null);
  const [allocationBuyerId, setAllocationBuyerId] = useState<number | null>(null);
  const [allocationNotes, setAllocationNotes] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState<boolean>(false);

  const loadMarketplace = async () => {
    setIsLoading(true);
    try {
      const [compsData, buyersData] = await Promise.all([
        fetchMarketplaceComponents({
          component_type: selectedType === 'all' ? undefined : selectedType,
          condition: selectedCondition === 'all' ? undefined : selectedCondition,
        }),
        fetchMarketplaceBuyers()
      ]);
      setComponents(compsData);
      setBuyers(buyersData);
    } catch (err: any) {
      console.error('Failed to load marketplace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [selectedType, selectedCondition]);

  const handleOpenAllocate = (comp: ComponentCardItem) => {
    setSelectedCompForModal(comp);
    setAllocationBuyerId(comp.matched_buyer ? comp.matched_buyer.id : (buyers[0]?.id || 1));
    setAllocationNotes(`Harvested sub-assembly quality passed OEM bench testing.`);
  };

  const handleConfirmAllocate = async () => {
    if (!selectedCompForModal || !allocationBuyerId) return;
    setIsAllocating(true);
    try {
      const res = await allocateComponent(selectedCompForModal.id, allocationBuyerId, allocationNotes);
      setActionMessage(`Allocated ${res.component_type} to ${res.allocated_to}! Order ID: ${res.transaction_id}`);
      setSelectedCompForModal(null);
      loadMarketplace();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(`Allocation failed: ${err.message}`);
    } finally {
      setIsAllocating(false);
    }
  };

  const totalDemandValue = components.reduce((acc, c) => acc + (c.is_harvested ? 0 : c.indicative_revenue), 0);
  const availableCount = components.filter(c => !c.is_harvested).length;
  const transactedCount = components.filter(c => c.is_harvested).length;

  const exportManifest = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["ID,Return_ID,Product,Component,Condition,Est_Value,Indicative_Revenue,Matched_Buyer,Status"].join(",") + "\n" +
      components.map(c => [
        c.id,
        c.return_id,
        `"${c.product_name}"`,
        c.component_type,
        c.condition,
        c.estimated_value,
        c.indicative_revenue,
        `"${c.matched_buyer?.name || 'Unmatched'}"`,
        c.is_harvested ? "Transacted" : "Available"
      ].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relife_b2b_component_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Available Harvest Lots">
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-[#FFC21A]">{availableCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">lots listed</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>100% bench tested & paired</span>
          </p>
        </Card>

        <Card title="Matched B2B Pipeline Value">
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">{formatINR(totalDemandValue)}</span>
            <span className="text-[11px] text-slate-400 font-medium font-mono">{transactedCount} sold</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sample indicative partner bids</p>
        </Card>

        <Card title="Certified B2B Buyers">
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-cyan-400">{buyers.length || 4}</span>
            <span className="text-[11px] text-slate-400 font-medium">active hubs</span>
          </div>
          <p className="text-[10px] text-cyan-300 mt-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>Refurbishers & Repair Chains</span>
          </p>
        </Card>

        <Card title="Avg Partner Realization">
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold font-mono text-purple-400">93.8%</span>
            <span className="text-[11px] text-slate-400 font-medium">of fair value</span>
          </div>
          <p className="text-[10px] text-purple-300 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified circular buyers only</span>
          </p>
        </Card>
      </div>

      {/* Main Marketplace Card */}
      <Card
        title="Reusable Electronic Sub-Assemblies & B2B Match Engine"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/marketplace/auctions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 text-xs font-bold shadow-md hover:brightness-110 transition-all"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Live Reverse Auctions</span>
            </Link>
            <button
              type="button"
              onClick={exportManifest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E202E] hover:bg-[#252836] text-[#FFC21A] border border-[#FFC21A]/30 text-xs font-semibold cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export B2B Manifest</span>
            </button>
            <button
              type="button"
              onClick={loadMarketplace}
              className="p-1.5 rounded-xl bg-[#1E202E] hover:bg-[#252836] text-slate-300 hover:text-white border border-[#252836] cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        {/* Filter Bar */}
        <div className="pt-2 pb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E202E]">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-mono text-[10px] mr-1 uppercase">Component:</span>
            {[
              { id: 'all', label: 'All Lots' },
              { id: 'display', label: 'Displays' },
              { id: 'motherboard', label: 'Motherboards' },
              { id: 'ram', label: 'RAM' },
              { id: 'storage', label: 'SSD / Storage' },
              { id: 'battery', label: 'Batteries' },
              { id: 'camera_module', label: 'Cameras' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedType === tab.id
                    ? 'bg-[#FFC21A] text-slate-950 font-bold'
                    : 'bg-[#1E202E] text-slate-400 hover:text-white hover:bg-[#252836]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Condition:</span>
            {['all', 'Grade A', 'Grade B'].map(cond => (
              <button
                key={cond}
                onClick={() => setSelectedCondition(cond)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  selectedCondition === cond
                    ? 'bg-amber-400/20 text-[#FFC21A] border border-[#FFC21A]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cond === 'all' ? 'Any Grade' : cond}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FFC21A]" />
            <span>Matching harvestable lots with circular buyer networks...</span>
          </div>
        ) : components.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No components match the selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {components.map(comp => (
              <div
                key={comp.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  comp.is_harvested
                    ? 'bg-[#0E0F14] border-[#1E202E] opacity-75'
                    : 'bg-[#08080D] border-[#252836] hover:border-[#FFC21A]/50'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#FFC21A]" />
                      <span>{comp.component_type}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        comp.condition === 'Grade A'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                      }`}>
                        {comp.condition}
                      </span>
                      {comp.is_harvested && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/30">
                          Transacted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device Title */}
                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">
                    {comp.product_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Source: {comp.return_id} • {comp.category}
                  </p>

                  {/* Financials */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#12131A] border border-[#1E202E] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Estimated Value</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{formatINR(comp.estimated_value)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 block font-medium">Indicative B2B Bid</span>
                      <span className="text-sm font-mono font-extrabold text-[#FFC21A]">{formatINR(comp.indicative_revenue)}</span>
                    </div>
                  </div>

                  {/* Matched Buyer Details */}
                  {comp.matched_buyer ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#161822] border border-[#252836] text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Top Matched Buyer</span>
                        <span className="text-[10px] font-mono font-extrabold text-cyan-400">
                          {comp.match_score}% Match
                        </span>
                      </div>
                      <p className="font-bold text-slate-200">{comp.matched_buyer.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{comp.matched_buyer.location}</span>
                        </span>
                        <span className="text-amber-300 font-medium">
                          {comp.matched_buyer.demand_rating} Demand
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 rounded-xl bg-[#12131A] text-[10px] text-slate-400 text-center">
                      Searching regional partner network...
                    </div>
                  )}

                  <p className="text-[9px] text-slate-500 italic mt-2">
                    * Sample assumption based on prevailing secondary parts index.
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-3 mt-3 border-t border-[#1E202E]">
                  {comp.is_harvested ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 rounded-xl bg-[#1E202E] text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Transacted to Circular Partner</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAllocate(comp)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Allocate & Issue Order ({formatINR(comp.indicative_revenue)})</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Allocation Modal */}
      {selectedCompForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#12131A] border border-[#252836] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#252836]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#FFC21A]" />
                <h3 className="font-bold text-sm text-white">Allocate Harvested Sub-Assembly</h3>
              </div>
              <button
                onClick={() => setSelectedCompForModal(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#08080D] border border-[#252836]">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Component Lot</p>
                <p className="font-bold text-white text-sm mt-0.5">
                  {selectedCompForModal.product_name} - {selectedCompForModal.component_type}
                </p>
                <div className="flex gap-4 mt-2 font-mono text-[11px]">
                  <span>Condition: <strong className="text-emerald-400">{selectedCompForModal.condition}</strong></span>
                  <span>Est Fair Value: <strong className="text-slate-300">{formatINR(selectedCompForModal.estimated_value)}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Select Circular Buyer Partner</label>
                <select
                  value={allocationBuyerId || ''}
                  onChange={(e) => setAllocationBuyerId(Number(e.target.value))}
                  className="w-full bg-[#08080D] border border-[#252836] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#FFC21A]"
                >
                  {buyers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.buyer_type}) — {b.location} [Bid: {Math.round(b.bid_price_factor * 100)}%]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Technician Lot Release Notes</label>
                <textarea
                  rows={2}
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  className="w-full bg-[#08080D] border border-[#252836] rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-[#FFC21A]"
                  placeholder="Bench diagnostic details, serialization pairing..."
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                Upon confirmation, an electronic B2B Purchase Order will be generated, and the sub-assembly will be marked as Transacted in the closed-loop recovery audit ledger.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCompForModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1E202E] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAllocating}
                onClick={handleConfirmAllocate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-1.5"
              >
                {isAllocating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm B2B Allocation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
