'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  parseSpokenInspection,
  VoiceParsedResult,
  ParsedVoiceDefect,
} from '../../lib/voiceToDefectParser';
import {
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
  Check,
  Cpu,
  Layers,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VoiceInspectionInputProps {
  returnId?: string;
  onApply: (
    formattedNotes: string,
    checklistUpdates?: Record<string, 'pass' | 'fail' | 'unknown'>,
    rawTranscript?: string
  ) => void;
  currentValue?: string;
  label?: string;
}

const DEMO_VOICE_PROMPTS = [
  'Screen has a crack on the top left corner, keyboard looks fine, hinge feels loose, battery might be swelling.',
  'Display ok, powers on fine, minor scratch on casing lid, all ports working.',
  'No power, does not turn on, broken port and dent on corner.',
];

export function VoiceInspectionInput({
  returnId,
  onApply,
  currentValue = '',
  label = 'Voice Inspection Logger',
}: VoiceInspectionInputProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<VoiceParsedResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        const parsed = parseSpokenInspection(finalTranscript);
        setParsedResult(parsed);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions or use demo voice presets.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No speech detected. Please speak into your microphone or pick a demo prompt.');
      } else {
        setErrorMessage(`Voice recognition notice: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setParsedResult(null);

    if (!recognitionRef.current) {
      setErrorMessage('Web Speech API is not available in this browser. Please use the quick demo prompts below.');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      console.warn('Recognition start failed:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  };

  const handleSimulateTranscript = (text: string) => {
    setTranscript(text);
    const parsed = parseSpokenInspection(text);
    setParsedResult(parsed);
    setErrorMessage(null);
  };

  const handleConfirmAndApply = async () => {
    if (!parsedResult) return;

    // Send audit log to backend (purely additive table, non-blocking)
    try {
      await fetch(`${API_BASE}/api/voice/parse-and-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_transcript: parsedResult.rawTranscript,
          return_id: returnId || 'N/A',
          inspector_id: 'tech_inspector_01',
        }),
      });
    } catch (err) {
      console.warn('Voice audit log submission skipped (offline/fallback):', err);
    }

    // Apply structured findings to existing form fields
    onApply(
      parsedResult.formattedNotes,
      parsedResult.recommendedChecklist,
      parsedResult.rawTranscript
    );

    setIsModalOpen(false);
  };

  return (
    <>
      {/* Mic trigger icon button alongside existing text fields */}
      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          startListening();
        }}
        title="Speak inspection findings (Web Speech API)"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#FFC21A] border border-amber-500/30 text-xs font-bold transition-all shadow-sm group"
      >
        <Mic className="w-3.5 h-3.5 text-[#FFC21A] group-hover:scale-110 transition-transform" />
        <span>Voice Log</span>
      </button>

      {/* Voice Inspection Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#12131A] border border-[#252836] rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#252836]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-gradient-to-br from-[#FFC21A] to-[#F57C00] text-slate-950 font-black'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181926] text-amber-300 border border-amber-500/30">
                      Web Speech NLP
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Speak inspection notes freely — parsed into structured defect tags
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  stopListening();
                  setIsModalOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E202E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mic Listening Status & Audio Wave indicator */}
            <div className="p-4 rounded-2xl bg-[#08080D] border border-[#252836] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-2xl transition-all shadow-md ${
                    isListening
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                      : 'bg-[#181926] text-[#FFC21A] hover:bg-[#252836] border border-[#FFC21A]/30'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-5 h-5 animate-bounce" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isListening ? 'Listening to speech...' : 'Microphone Ready'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isListening
                      ? 'Speak defects, condition, and bench findings'
                      : 'Tap mic or click a prompt below'}
                  </span>
                </div>
              </div>

              {isListening && (
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 bg-[#FFC21A] h-2 rounded-full animate-pulse" />
                  <span className="w-1 bg-[#FFC21A] h-5 rounded-full animate-pulse delay-75" />
                  <span className="w-1 bg-[#FFC21A] h-3 rounded-full animate-pulse delay-150" />
                  <span className="w-1 bg-[#FFC21A] h-6 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Demo Prompts (One-click simulation for instant testing) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFC21A]" />
                <span>One-Click Speech Presets (Demo Walkthrough):</span>
              </label>
              <div className="space-y-1.5">
                {DEMO_VOICE_PROMPTS.map((promptText, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSimulateTranscript(promptText)}
                    className="w-full p-2.5 rounded-xl bg-[#08080D] hover:bg-[#181926] border border-[#252836] text-left text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#FFC21A] shrink-0 mt-0.5" />
                    <span className="line-clamp-2 italic font-mono text-[11px]">
                      &ldquo;{promptText}&rdquo;
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Transcript Area */}
            {transcript && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  Transcribed Speech:
                </label>
                <div className="p-3 rounded-xl bg-[#08080D] border border-[#252836] text-xs text-slate-200 font-mono">
                  &ldquo;{transcript}&rdquo;
                </div>
              </div>
            )}

            {/* Parsed Structured Preview Card (Inspector Confirmation BEFORE Applying) */}
            {parsedResult && (
              <div className="p-4 rounded-2xl bg-[#08080D] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#FFC21A]" />
                    <span>Parsed NLP Defect Tags & Checklist</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {parsedResult.confidenceScore}% Confidence
                  </span>
                </div>

                {/* Defect Chips */}
                {parsedResult.parsedDefects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedResult.parsedDefects.map((d, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#181926] border border-[#252836] text-[11px] font-semibold text-amber-300 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <strong className="text-white capitalize">{d.component}:</strong>
                        <span>{d.defect_type}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-[#252836] text-slate-400">
                          {d.severity}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic block">
                    No critical defect tags detected. Clean condition.
                  </span>
                )}

                {/* Checklist updates */}
                {Object.keys(parsedResult.recommendedChecklist).length > 0 && (
                  <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Auto-Checklist:</span>
                    {Object.entries(parsedResult.recommendedChecklist).map(([k, v]) => (
                      <span
                        key={k}
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          v === 'pass'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {k}: {v.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAndApply}
                disabled={!parsedResult}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 shadow-md shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply to Form</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
