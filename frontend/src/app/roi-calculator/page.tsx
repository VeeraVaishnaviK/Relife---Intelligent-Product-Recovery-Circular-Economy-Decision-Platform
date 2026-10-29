'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ROIInputs,
  calculateEnterpriseROI,
  ENTERPRISE_PRESETS,
  CO2_EMISSION_FACTOR_PER_KG,
} from '../../lib/roiCalculations';
import { formatINR } from '../../lib/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Calculator,
  TrendingUp,
  Leaf,
  DollarSign,
  Download,
  Printer,
  Sparkles,
  ArrowLeft,
  Info,
  CheckCircle2,
  Building2,
  Sliders,
  ShieldCheck,
  Scale,
  RotateCcw,
} from 'lucide-react';

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState<ROIInputs>(ENTERPRISE_PRESETS.enterprise);
  const [activePreset, setActivePreset] = useState<string>('enterprise');

  const results = useMemo(() => calculateEnterpriseROI(inputs), [inputs]);

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    setInputs(ENTERPRISE_PRESETS[presetKey]);
  };

  const handlePrint = () => {
    window.print();
  };

  const chartData = useMemo(() => {
    return [
      {
        name: 'Gross Recovered Value',
        Baseline: Math.round(results.breakdown[0].beforeInr / 100000), // In Lakhs
        'With ReLife AI': Math.round(results.breakdown[0].withReLifeInr / 100000),
      },
      {
        name: 'Inspection Labor Cost',
        Baseline: Math.round(results.breakdown[1].beforeInr / 100000),
        'With ReLife AI': Math.round(results.breakdown[1].withReLifeInr / 100000),
      },
    ];
  }, [results]);

  return (
    <div className="min-h-screen bg-[#08080D] text-slate-100 flex flex-col font-sans selection:bg-[#FFC21A] selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0D0E15]/90 backdrop-blur-md border-b border-[#252836] px-6 py-4 print:hidden">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-bold text-[#FFC21A] hover:underline px-3 py-1.5 rounded-xl bg-[#181926] border border-[#252836]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Operations</span>
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC21A] to-[#F57C00] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-900/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Enterprise Circular ROI & ESG Calculator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                  Business Case Generator
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Estimate financial payback & scope-3 carbon reduction from automated circular recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181926] hover:bg-[#252836] text-white text-xs font-bold border border-[#252836] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FFC21A]" />
              <span>Export PDF Summary</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-5 sm:p-7 space-y-7">
        {/* Hero Pitch Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#12131A] via-[#161824] to-[#12131A] border border-[#252836] p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFC21A]/10 text-[#FFC21A] border border-[#FFC21A]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Enterprise Economic Model</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Turn Returned Electronics into High-Yield Circular Assets
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Standard consumer returns bleed 30–50% of asset value through delayed manual triage and undervaluation.
              Simulate your enterprise savings with ReLife AI&apos;s automated optical inspection and dynamic 5-pathway decision routing.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="pt-5 flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-400 font-semibold mr-1">Enterprise Presets:</span>
            {[
              { id: 'midMarket', label: 'Mid-Market (2,500 units/mo)' },
              { id: 'enterprise', label: 'Enterprise OEM / D2C (10,000 units/mo)' },
              { id: 'globalHub', label: 'Global 3PL Hub (50,000 units/mo)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activePreset === p.id
                    ? 'bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 shadow-md shadow-amber-900/30 border-transparent'
                    : 'bg-[#08080D] text-slate-400 border-[#252836] hover:text-white hover:bg-[#181926]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Large KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Annual Value Recovered */}
          <div className="p-6 rounded-3xl bg-[#12131A] border border-[#252836] relative overflow-hidden shadow-xl space-y-2 group hover:border-[#FFC21A]/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Estimated Annual Value Recovered
              </span>
              <DollarSign className="w-5 h-5 text-[#FFC21A]" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#FFC21A] font-mono">
              {formatINR(results.annualValueRecoveredInr)}
            </div>
            <p className="text-xs text-slate-400">
              From rescuing <strong className="text-white">{results.recoveryUpliftPct}%</strong> of undervalued returns into high-margin resale and certified parts.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-400 font-semibold">
              ≈ {formatINR(results.monthlyValueRecoveredInr)} / month
            </div>
          </div>

          {/* Card 2: Annual Cost Savings */}
          <div className="p-6 rounded-3xl bg-[#12131A] border border-[#252836] relative overflow-hidden shadow-xl space-y-2 group hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Estimated Annual Labor Cost Saved
              </span>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
              {formatINR(results.annualLaborSavingsInr)}
            </div>
            <p className="text-xs text-slate-400">
              Achieved via <strong className="text-white">50% automation efficiency</strong> in optical defect grading and bench checklist triage.
            </p>
            <div className="pt-2 text-[11px] font-mono text-cyan-300 font-semibold">
              ≈ {formatINR(results.monthlyLaborSavingsInr)} / month
            </div>
          </div>

          {/* Card 3: Environmental CO2 Avoided */}
          <div className="p-6 rounded-3xl bg-[#12131A] border border-[#252836] relative overflow-hidden shadow-xl space-y-2 group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                CO₂ Emissions Avoided Annually
              </span>
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              {results.annualCO2AvoidedTons.toLocaleString()} <span className="text-xl font-normal text-emerald-300">Tons</span>
            </div>
            <p className="text-xs text-slate-400">
              Equivalent to diverting <strong className="text-white">{results.annualWasteDivertedTons} tons</strong> of physical e-waste from municipal landfills.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-300 font-semibold">
              Source: EPA WARM v15 & ADEME Electronics Study
            </div>
          </div>
        </div>

        {/* 2-Column Split: Sliders Form on Left (5 cols) & Interactive Visuals on Right (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sliders & Parameter Configuration */}
          <div className="lg:col-span-5 bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#252836]">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#FFC21A]" />
                <h3 className="text-sm font-bold text-white">Adjust Enterprise Return Parameters</h3>
              </div>
              <button
                onClick={() => handlePresetSelect('enterprise')}
                className="text-[11px] text-slate-400 hover:text-[#FFC21A] flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Monthly Returns Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Monthly Returns Volume
                  </label>
                  <span className="font-mono font-bold text-[#FFC21A] text-sm">
                    {inputs.monthlyReturns.toLocaleString()} units
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={inputs.monthlyReturns}
                  onChange={(e) => setInputs({ ...inputs, monthlyReturns: Number(e.target.value) })}
                  className="w-full h-2 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-[#FFC21A]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>500</span>
                  <span>50,000</span>
                  <span>100,000+</span>
                </div>
              </div>

              {/* Slider 2: Average Product Value (₹) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Average Product Original Value (₹)
                  </label>
                  <span className="font-mono font-bold text-[#FFC21A] text-sm">
                    {formatINR(inputs.avgProductValueInr)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="120000"
                  step="1000"
                  value={inputs.avgProductValueInr}
                  onChange={(e) => setInputs({ ...inputs, avgProductValueInr: Number(e.target.value) })}
                  className="w-full h-2 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-[#FFC21A]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹5,000</span>
                  <span>₹60,000</span>
                  <span>₹1,20,000</span>
                </div>
              </div>

              {/* Slider 3: Current Disposal / Scrap Rate (%) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Current Undervalued / Disposal Rate (%)
                  </label>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {inputs.currentDisposalRatePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="1"
                  value={inputs.currentDisposalRatePct}
                  onChange={(e) => setInputs({ ...inputs, currentDisposalRatePct: Number(e.target.value) })}
                  className="w-full h-2 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10% (Low scrap)</span>
                  <span>45% (Typical)</span>
                  <span>80% (Heavy loss)</span>
                </div>
              </div>

              {/* Slider 4: Manual Inspection Cost per Unit (₹) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Current Manual Inspection Cost / Unit (₹)
                  </label>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {formatINR(inputs.manualInspectionCostInr)}
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1500"
                  step="25"
                  value={inputs.manualInspectionCostInr}
                  onChange={(e) => setInputs({ ...inputs, manualInspectionCostInr: Number(e.target.value) })}
                  className="w-full h-2 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹150</span>
                  <span>₹750</span>
                  <span>₹1,500</span>
                </div>
              </div>

              {/* Slider 5: Repair/Refurb Success Assumption (%) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Assumed Refurb / Harvesting Success Rate (%)
                  </label>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {inputs.refurbSuccessRatePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="1"
                  value={inputs.refurbSuccessRatePct}
                  onChange={(e) => setInputs({ ...inputs, refurbSuccessRatePct: Number(e.target.value) })}
                  className="w-full h-2 bg-[#08080D] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>40%</span>
                  <span>70% (Baseline)</span>
                  <span>95% (Optimized)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Comparative Recharts & Financial Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Chart: Baseline vs ReLife Enterprise Impact */}
            <div className="bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#252836]">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#FFC21A]" />
                  <h3 className="text-sm font-bold text-white">
                    Annual Financial Impact Comparison (in Lakhs ₹)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#08080D] border border-[#252836]">
                  Annualized (12 Months)
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E202E" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="L" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0D0E15',
                        borderColor: '#252836',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${val} Lakhs`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Baseline" fill="#475569" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="With ReLife AI" fill="#FFC21A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Financial Metric Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#08080D] border border-[#252836]">
                  <span className="text-[11px] text-slate-400 block">Total Combined Annual Benefit</span>
                  <span className="text-lg font-black text-white font-mono">
                    {formatINR(results.annualTotalBenefitInr)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block pt-0.5">
                    Recovered Value + Labor Savings
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#08080D] border border-[#252836]">
                  <span className="text-[11px] text-slate-400 block">Estimated Solution Payback</span>
                  <span className="text-lg font-black text-[#FFC21A] font-mono">
                    {results.roiMultiple}x ROI Multiple
                  </span>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    Sub-3 month operational payback
                  </span>
                </div>
              </div>
            </div>

            {/* ESG & Environmental Methodology Disclosure */}
            <div className="bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Leaf className="w-4 h-4" />
                <span>Environmental Carbon Abatement Methodology & Sources</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculations apply an emissions avoidance factor of{' '}
                <strong className="text-slate-200">{CO2_EMISSION_FACTOR_PER_KG} kg CO₂e per kg</strong> of electronic
                hardware diverted from disposal, sourced from published lifecycle assessment (LCA) benchmarks in{' '}
                <strong>EPA WARM v15 (Waste Reduction Model)</strong> and the{' '}
                <strong>ADEME / Bureau Veritas Electronics Circularity Study</strong>.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {results.esgBreakdown.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#08080D] border border-[#252836] text-center">
                    <span className="text-base font-black text-emerald-400 font-mono block">
                      {item.amount.toLocaleString()} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block pt-0.5">
                      {item.metric}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Text */}
        <div className="p-4 rounded-2xl bg-[#12131A] border border-[#252836] text-xs text-slate-500 leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Disclaimer:</strong> Estimates based on user inputs and industry-standard assumptions; actual results depend on product mix, market conditions, and operational factors.
          </p>
        </div>
      </main>
    </div>
  );
}
