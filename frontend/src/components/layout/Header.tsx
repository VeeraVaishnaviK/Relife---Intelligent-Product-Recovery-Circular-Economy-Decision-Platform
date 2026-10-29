'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DateRange } from '../../lib/types';
import {
  Search,
  Bell,
  ChevronDown,
  Calendar,
  X,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface HeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  isLoading?: boolean;
}

export function Header({
  dateRange,
  onDateRangeChange,
  searchTerm = '',
  onSearchChange,
  isLoading = false,
}: HeaderProps) {
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const ranges: { id: DateRange; label: string }[] = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0D0E15]/95 backdrop-blur-md px-6 lg:px-8 py-3.5 border-b border-[#252836]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-[1800px] mx-auto">
        {/* Left: Global Search Bar */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search products, serials, defects, or pathways..."
            className="w-full pl-10 pr-9 py-2 bg-[#08080D] border border-[#252836] rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFC21A] shadow-sm transition-all"
          />
          {searchTerm && onSearchChange && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Date Range Selector, Notification Bell & User Profile */}
        <div className="flex items-center gap-3.5 justify-end w-full sm:w-auto">
          {/* Date Range Selector */}
          <div className="flex items-center bg-[#08080D] p-1 rounded-full border border-[#252836] shadow-sm">
            <span className="flex items-center pl-2.5 pr-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </span>
            {ranges.map((range) => {
              const active = dateRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => onDateRangeChange(range.id)}
                  disabled={isLoading}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-tight transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Enterprise ROI Calculator Link */}
          <Link
            href="/roi-calculator"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181926] hover:bg-[#252836] text-[#FFC21A] border border-[#FFC21A]/30 text-xs font-bold transition-all shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>ROI Calculator</span>
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotification(!showNotification)}
              className="relative p-2 rounded-full bg-[#12131A] border border-[#252836] text-slate-300 hover:text-white shadow-sm transition-all hover:bg-[#1E202E]"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFC21A] text-slate-950 text-[9px] font-bold flex items-center justify-center shadow-sm">
                3
              </span>
            </button>

            {showNotification && (
              <div className="absolute right-0 mt-2 w-72 bg-[#12131A] rounded-2xl shadow-xl border border-[#252836] p-3 text-xs z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#252836] font-bold text-white">
                  <span>Circular Alerts</span>
                  <span className="text-[10px] text-[#FFC21A] bg-[#1E202E] px-2 py-0.5 rounded-full font-mono border border-[#FFC21A]/30">
                    3 Active
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-xl bg-[#08080D] border border-[#252836] hover:border-slate-600 transition-colors cursor-pointer">
                    <p className="font-semibold text-white">Laptop screen defect escalated</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automated AI recommended display repair</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#08080D] border border-[#252836] hover:border-slate-600 transition-colors cursor-pointer">
                    <p className="font-semibold text-white">Battery safety override triggered</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Degraded cell blocked from resale</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#08080D] border border-[#252836] hover:border-slate-600 transition-colors cursor-pointer">
                    <p className="font-semibold text-white">Landfill diversion milestone</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">38.5 kg CO₂e saved per unit</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2 border-l border-[#252836] text-left hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFC21A] to-[#F57C00] flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                RL
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-none font-sans">
                  Operations Lead
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  ReLife AI Hub
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#12131A] rounded-2xl shadow-xl border border-[#252836] p-2 text-xs z-50 animate-in fade-in slide-in-from-top-1">
                <div className="p-2 border-b border-[#252836] mb-1">
                  <p className="font-bold text-white">Operations Lead</p>
                  <p className="text-[10px] text-slate-400">lead@relife.ai</p>
                  <span className="inline-block mt-1 text-[9px] font-semibold text-[#FFC21A] bg-[#1E202E] px-2 py-0.5 rounded-full border border-[#FFC21A]/30">
                    Tier 1 Operator
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#1E202E] text-slate-300 transition-colors font-medium"
                >
                  Triage Preferences
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#1E202E] text-slate-300 transition-colors font-medium"
                >
                  Audit Log & Passport Keys
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
