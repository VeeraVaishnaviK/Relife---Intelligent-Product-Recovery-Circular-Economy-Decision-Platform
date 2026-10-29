'use client';

import React, { useState } from 'react';
import { FunctionalTestPayload, FunctionalTestResponse } from '../../lib/types';
import { submitFunctionalTests } from '../../lib/api';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  BatteryCharging,
  Monitor,
  HardDrive,
  Usb,
  Power,
  CircuitBoard,
} from 'lucide-react';
import { VoiceInspectionInput } from '../voice/VoiceInspectionInput';

interface Step3Props {
  returnId: string;
  onTestsComplete: (data: FunctionalTestResponse) => void;
  testsData: FunctionalTestResponse | null;
}

type TestStatus = 'pass' | 'fail' | 'unknown';

interface TestItemConfig {
  key: keyof FunctionalTestPayload;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TESTS_CONFIG: TestItemConfig[] = [
  {
    key: 'powers_on',
    label: 'Power Sequencing',
    description: 'Boots through BIOS/EFI and responds to power button',
    icon: Power,
  },
  {
    key: 'display_ok',
    label: 'Display & Backlight',
    description: 'Internal panel renders clear image without lines or flicker',
    icon: Monitor,
  },
  {
    key: 'motherboard_ok',
    label: 'Motherboard & Logic Board',
    description: 'Power rails, PMIC, and CPU voltages within factory tolerance',
    icon: CircuitBoard,
  },
  {
    key: 'ram_ok',
    label: 'System RAM',
    description: 'Memory passes dual-channel diagnostic test',
    icon: Cpu,
  },
  {
    key: 'storage_ok',
    label: 'Solid State Storage',
    description: 'NVMe / UFS SSD SMART health reports 0 bad sectors',
    icon: HardDrive,
  },
  {
    key: 'ports_ok',
    label: 'I/O Ports & Connectors',
    description: 'USB-C, HDMI, audio jack, and charge pins communicate',
    icon: Usb,
  },
];

export function Step3FunctionalTests({
  returnId,
  onTestsComplete,
  testsData,
}: Step3Props) {
  const [testValues, setTestValues] = useState<Record<string, TestStatus>>({
    powers_on: 'pass',
    display_ok: 'fail', // Default to display fail for the cracked laptop demo scenario
    battery_test: 'pass',
    motherboard_ok: 'pass',
    ram_ok: 'pass',
    storage_ok: 'pass',
    ports_ok: 'pass',
  });

  const [batteryHealthPct, setBatteryHealthPct] = useState<number>(91);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setTest = (key: string, val: TestStatus) => {
    setTestValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleQuickPreset = (preset: 'all_pass' | 'laptop_crack' | 'battery_dead' | 'has_unknowns') => {
    if (preset === 'all_pass') {
      setTestValues({
        powers_on: 'pass',
        display_ok: 'pass',
        battery_test: 'pass',
        motherboard_ok: 'pass',
        ram_ok: 'pass',
        storage_ok: 'pass',
        ports_ok: 'pass',
      });
      setBatteryHealthPct(98);
    } else if (preset === 'laptop_crack') {
      setTestValues({
        powers_on: 'pass',
        display_ok: 'fail',
        battery_test: 'pass',
        motherboard_ok: 'pass',
        ram_ok: 'pass',
        storage_ok: 'pass',
        ports_ok: 'pass',
      });
      setBatteryHealthPct(91);
    } else if (preset === 'battery_dead') {
      setTestValues({
        powers_on: 'pass',
        display_ok: 'pass',
        battery_test: 'fail',
        motherboard_ok: 'pass',
        ram_ok: 'pass',
        storage_ok: 'pass',
        ports_ok: 'pass',
      });
      setBatteryHealthPct(58);
    } else {
      setTestValues({
        powers_on: 'pass',
        display_ok: 'unknown',
        battery_test: 'unknown',
        motherboard_ok: 'unknown',
        ram_ok: 'pass',
        storage_ok: 'pass',
        ports_ok: 'unknown',
      });
      setBatteryHealthPct(-1);
    }
  };

  const hasUnknowns = Object.values(testValues).some((v) => v === 'unknown') || batteryHealthPct === -1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnId) {
      setError('Please register a product first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: FunctionalTestPayload = {
        powers_on: testValues.powers_on,
        display_ok: testValues.display_ok,
        battery_health_pct: batteryHealthPct,
        battery_test: batteryHealthPct < 70 && batteryHealthPct > 0 ? 'fail' : testValues.battery_test,
        motherboard_ok: testValues.motherboard_ok,
        ram_ok: testValues.ram_ok,
        storage_ok: testValues.storage_ok,
        ports_ok: testValues.ports_ok,
        notes: 'Bench technician diagnostic evaluation',
      };

      const res = await submitFunctionalTests(returnId, payload);
      onTestsComplete(res);
    } catch (err: any) {
      console.error('Error submitting tests:', err);
      setError(err.message || 'Failed to submit functional tests.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Honesty Notice */}
      <div className="bg-[#181926] border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-300">
          <Info className="w-4 h-4 shrink-0 text-[#FFC21A]" />
          <span>
            <strong>Mandatory Electrical Verification:</strong> Visual inspection alone cannot prove internal battery or motherboard state. Test inputs here directly calibrate pathway risk.
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-md bg-[#252836] text-[10px] font-mono text-[#FFC21A] border border-[#FFC21A]/30 shrink-0">
          Step 3 of 7
        </span>
      </div>

      {/* Quick Presets */}
      <div className="bg-[#12131A] border border-[#252836] p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-300">Preset Bench Findings:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset('laptop_crack')}
            className="px-2.5 py-1 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-[#FFC21A] border border-[#FFC21A]/30 text-[11px]"
          >
            Display Damaged, Internals Pass (Demo Scenario)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('battery_dead')}
            className="px-2.5 py-1 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-[#F57C00] border border-[#F57C00]/30 text-[11px]"
          >
            Failed Battery (Health &lt; 70%)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('all_pass')}
            className="px-2.5 py-1 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-emerald-400 border border-emerald-500/30 text-[11px]"
          >
            All Passed (Grade A)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('has_unknowns')}
            className="px-2.5 py-1 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-cyan-400 border border-cyan-500/30 text-[11px]"
          >
            Unknown Tests (Triggers Human Review)
          </button>
          <VoiceInspectionInput
            returnId={returnId}
            label="Voice Checklist Auto-Fill"
            onApply={(notes, checklistUpdates) => {
              if (checklistUpdates) {
                setTestValues((prev) => ({ ...prev, ...checklistUpdates }));
              }
            }}
          />
        </div>
      </div>

      {hasUnknowns && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Attention:</strong> One or more tests are marked as <strong>Unknown</strong>. This will reduce recommendation confidence and trigger routing to <strong>Human Technician Inspection</strong>.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Battery Health Slider Card */}
        <div className="bg-[#12131A] border border-[#252836] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E202E] mb-4">
            <div className="flex items-center gap-2.5">
              <BatteryCharging className="w-5 h-5 text-[#FFC21A]" />
              <div>
                <h4 className="text-sm font-bold text-white">Battery Cycle & Health Analysis</h4>
                <p className="text-[11px] text-slate-400">
                  Chemical capacity retention measured via gas gauge impedance
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold font-mono ${batteryHealthPct >= 80 ? 'text-emerald-400' : batteryHealthPct >= 70 ? 'text-[#FFC21A]' : 'text-red-400'}`}>
                {batteryHealthPct > 0 ? `${batteryHealthPct}% Capacity` : 'Unknown'}
              </span>
              <p className="text-[10px] text-slate-500">
                {batteryHealthPct < 70 && batteryHealthPct > 0 ? 'Safety threshold breached' : 'Pass standard'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={-1}
                max={100}
                value={batteryHealthPct}
                onChange={(e) => setBatteryHealthPct(parseInt(e.target.value))}
                className="flex-1 accent-[#FFC21A] bg-[#08080D] h-2 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold w-12 text-center text-white">
                {batteryHealthPct === -1 ? 'N/A' : `${batteryHealthPct}%`}
              </span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Unknown (-1)</span>
              <span>Poor (&lt; 70% Overrides Resale)</span>
              <span>Acceptable (70-79%)</span>
              <span>Optimal (80-100%)</span>
            </div>
          </div>
        </div>

        {/* 6 Core Functional Bench Tests Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTS_CONFIG.map((t) => {
            const Icon = t.icon;
            const currentStatus = testValues[t.key as string] || 'pass';

            return (
              <div
                key={t.key as string}
                className="bg-[#12131A] border border-[#252836] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#08080D] border border-[#252836] text-[#FFC21A] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{t.label}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] leading-tight">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-[#08080D] p-1 rounded-xl border border-[#252836]">
                  <button
                    type="button"
                    onClick={() => setTest(t.key as string, 'pass')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      currentStatus === 'pass'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTest(t.key as string, 'fail')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      currentStatus === 'fail'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Fail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTest(t.key as string, 'unknown')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      currentStatus === 'unknown'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Unknown</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs tracking-wide shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span>Computing Condition Health Score...</span>
          ) : (
            <>
              <span>Save Bench Tests & Calculate Hardware Condition Score</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
