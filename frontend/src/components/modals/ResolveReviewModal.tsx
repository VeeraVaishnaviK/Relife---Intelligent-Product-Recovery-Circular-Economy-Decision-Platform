'use client';

import React, { useState } from 'react';
import { HumanReviewItem } from '../../lib/types';
import { resolveReview } from '../../lib/api';
import { PathwayBadge } from '../ui/Badge';
import { X, CheckCircle, ShieldAlert, Cpu, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';
import { VoiceInspectionInput } from '../voice/VoiceInspectionInput';

interface ResolveReviewModalProps {
  item: HumanReviewItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResolveReviewModal({ item, onClose, onSuccess }: ResolveReviewModalProps) {
  const [selectedPathway, setSelectedPathway] = useState<string>('');
  const [notes, setNotes] = useState<string>('Technician bench verification completed. Diagnostic parameters normal.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!item) return null;

  const currentPathway = selectedPathway || item.recommended_pathway;

  const handleResolve = async (action: 'pass' | 'override') => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await resolveReview(item.return_id, {
        action,
        pathway: currentPathway,
        notes,
      });

      setFeedback(`Bench test resolved for ${item.product_name}! Marked as Recovered.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedback(`Resolution failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bench Test Inspection: {item.id}
              </h3>
              <p className="text-[11px] text-slate-500">
                Return Item #{item.return_id} • {item.product_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{feedback}</span>
            </div>
          )}

          {/* Trigger Details */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Review Trigger Reason:</span>
              <span className="font-bold text-rose-700">{item.reason}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AI Confidence at Triage:</span>
              <span className="font-mono font-bold text-slate-800">{item.defect_confidence}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Proposed Circular Pathway:</span>
              <PathwayBadge pathway={item.recommended_pathway} />
            </div>
          </div>

          {/* Required Test Instructions */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Required Bench Diagnostic Protocol
            </label>
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed">
              {item.required_test}
            </div>
          </div>

          {/* Pathway Confirmation or Override */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Confirm or Override Destination Pathway
            </label>
            <select
              value={currentPathway}
              onChange={(e) => setSelectedPathway(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#073E2E]"
            >
              <option value="Resale">Resale (Certified Pre-Owned)</option>
              <option value="Repair">Repair (Targeted Component Swap)</option>
              <option value="Refurbish">Refurbish (Cosmetic & Battery Renewal)</option>
              <option value="Harvest">Harvest (Extract Viable Sub-Assemblies)</option>
              <option value="Recycle">Recycle (Certified E-Stewards Shredding)</option>
            </select>
          </div>

          {/* Technician Verification Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold">
                Technician Bench Verification Notes
              </label>
              <VoiceInspectionInput
                returnId={item.return_id}
                onApply={(formattedNotes) => setNotes(formattedNotes)}
              />
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#073E2E]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleResolve('pass')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#073E2E] hover:bg-[#053023] text-white font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Resolving...' : 'Pass Test & Route Device'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

