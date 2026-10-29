'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QualityCheckResult, evaluateImageQuality } from '../../lib/qualityCheck';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Sun,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface GuideAngle {
  id: string;
  tag: string;
  name: string;
  instruction: string;
  // Bounding box overlay in percentage of frame [x, y, width, height]
  overlayBox: { x: number; y: number; w: number; h: number };
  aspectRatioLabel: string;
}

const LAPTOP_ANGLES: GuideAngle[] = [
  {
    id: 'screen_front',
    tag: 'screen_front',
    name: '1. Screen & Display Panel',
    instruction: 'Fit the opened laptop screen inside the golden frame. Check for cracks or LCD bleeding.',
    overlayBox: { x: 15, y: 12, w: 70, h: 56 },
    aspectRatioLabel: '16:10 Screen',
  },
  {
    id: 'keyboard_base',
    tag: 'keyboard_base',
    name: '2. Keyboard & Palmrest',
    instruction: 'Align keyboard deck and trackpad within guide. Inspect missing keys, spills, or worn areas.',
    overlayBox: { x: 12, y: 20, w: 76, h: 55 },
    aspectRatioLabel: 'Deck / Casing',
  },
  {
    id: 'ports_hinge',
    tag: 'ports_hinge',
    name: '3. Hinge & Side Ports',
    instruction: 'Position side edge or rear hinge along the horizontal reticle to check alignment.',
    overlayBox: { x: 10, y: 35, w: 80, h: 30 },
    aspectRatioLabel: 'Perimeter Ports',
  },
  {
    id: 'underside',
    tag: 'underside',
    name: '4. Underside & Serial Label',
    instruction: 'Flip laptop and center bottom casing, rubber feet, and ventilation grilles.',
    overlayBox: { x: 15, y: 18, w: 70, h: 60 },
    aspectRatioLabel: 'Base Cover',
  },
];

const SMARTPHONE_ANGLES: GuideAngle[] = [
  {
    id: 'front_screen',
    tag: 'front_screen',
    name: '1. Front Glass & Display',
    instruction: 'Center phone display within the vertical guide. Inspect hairline scratches and digitizer cracks.',
    overlayBox: { x: 30, y: 8, w: 40, h: 84 },
    aspectRatioLabel: '19.5:9 Phone Screen',
  },
  {
    id: 'back_panel',
    tag: 'back_panel',
    name: '2. Rear Cover & Camera Module',
    instruction: 'Align rear casing and camera island within frame. Check for glass fractures or camera ring dents.',
    overlayBox: { x: 30, y: 8, w: 40, h: 84 },
    aspectRatioLabel: 'Rear Chassis',
  },
  {
    id: 'edges_frame',
    tag: 'edges_frame',
    name: '3. Frame Edges & Ports',
    instruction: 'Position phone on side along the guide to inspect corner dents, volume rocker, and charging port.',
    overlayBox: { x: 15, y: 38, w: 70, h: 24 },
    aspectRatioLabel: 'Bezel & Rail',
  },
];

interface CapturedAngleItem {
  angle: GuideAngle;
  blob: Blob;
  previewUrl: string;
  quality: QualityCheckResult;
}

interface GuidedCaptureCameraProps {
  category?: string; // Laptop | Smartphone
  onCaptureComplete: (files: File[], tags: string[]) => void;
  onClose: () => void;
}

export function GuidedCaptureCamera({
  category = 'Laptop',
  onCaptureComplete,
  onClose,
}: GuidedCaptureCameraProps) {
  const isSmartphone = category.toLowerCase().includes('phone');
  const angles = isSmartphone ? SMARTPHONE_ANGLES : LAPTOP_ANGLES;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [capturedItems, setCapturedItems] = useState<CapturedAngleItem[]>([]);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<QualityCheckResult | null>(null);
  const [pendingCapture, setPendingCapture] = useState<CapturedAngleItem | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentAngle = angles[currentStepIndex];

  // Initialize camera via getUserMedia
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported in this browser. Please use a modern browser with HTTPS.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (err: any) {
        console.warn('Camera getUserMedia error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Please allow camera permissions or use demo simulation.'
            : `Unable to open camera: ${err.message}`
        );
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture current frame from video stream
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Run client-side quality evaluation
    const quality = evaluateImageQuality(canvas);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        const item: CapturedAngleItem = {
          angle: currentAngle,
          blob,
          previewUrl,
          quality,
        };

        if (!quality.passed) {
          // Trigger quality warning prompt before accepting
          setPendingCapture(item);
          setQualityWarning(quality);
        } else {
          commitCapture(item);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const commitCapture = (item: CapturedAngleItem) => {
    setCapturedItems((prev) => [...prev.filter((c) => c.angle.id !== item.angle.id), item]);
    setPendingCapture(null);
    setQualityWarning(null);

    // Advance to next angle or finish
    if (currentStepIndex < angles.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleRetake = () => {
    if (pendingCapture) {
      URL.revokeObjectURL(pendingCapture.previewUrl);
    }
    setPendingCapture(null);
    setQualityWarning(null);
  };

  const handleAcceptAnyway = () => {
    if (pendingCapture) {
      commitCapture(pendingCapture);
    }
  };

  const handleFinishAndSubmit = () => {
    if (capturedItems.length === 0) return;

    // Convert Blobs to standard File array
    const files: File[] = capturedItems.map((c, idx) => {
      const filename = `${c.angle.tag}_${idx + 1}.jpg`;
      return new File([c.blob], filename, { type: 'image/jpeg' });
    });

    const tags = capturedItems.map((c) => c.angle.tag);

    onCaptureComplete(files, tags);
    onClose();
  };

  // Fallback demo snapshot generator if camera is unavailable in test environment
  const handleSimulateCapture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw realistic simulation background
    const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
    gradient.addColorStop(0, '#10121C');
    gradient.addColorStop(1, '#1A1D2D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1280, 720);

    // Draw device outline based on current angle
    ctx.strokeStyle = '#FFC21A';
    ctx.lineWidth = 4;
    const b = currentAngle.overlayBox;
    const rx = (b.x / 100) * 1280;
    const ry = (b.y / 100) * 720;
    const rw = (b.w / 100) * 1280;
    const rh = (b.h / 100) * 720;
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${category.toUpperCase()} - ${currentAngle.name.toUpperCase()}`, rx + 24, ry + 50);

    ctx.fillStyle = '#22D3EE';
    ctx.font = '20px monospace';
    ctx.fillText(`AR Bounding Guide: ${currentAngle.tag} [PASSED]`, rx + 24, ry + 90);

    const quality = evaluateImageQuality(canvas);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        const item: CapturedAngleItem = {
          angle: currentAngle,
          blob,
          previewUrl,
          quality,
        };
        commitCapture(item);
      },
      'image/jpeg',
      0.92
    );
  };

  const isAllAnglesCaptured = capturedItems.length >= angles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#12131A] border border-[#252836] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 bg-[#0D0E15] border-b border-[#252836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC21A] to-[#F57C00] flex items-center justify-center text-slate-950 font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">AR Inspection Capture Guide</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181926] text-amber-300 border border-amber-500/30">
                  {category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Step-by-step angle alignment with real-time blur & lighting validation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E202E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Angle Steps Progress Bar */}
        <div className="px-6 py-2.5 bg-[#08080D] border-b border-[#1E202E] flex items-center justify-between gap-2 overflow-x-auto">
          {angles.map((ang, idx) => {
            const isDone = capturedItems.some((c) => c.angle.id === ang.id);
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={ang.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/20 text-[#FFC21A] border-[#FFC21A]'
                    : isDone
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#12131A] text-slate-400 border-[#252836]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-[#181926] text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                )}
                <span>{ang.name}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Area with AR Overlay Guide */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[380px] overflow-hidden select-none">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Hidden Canvas for capture & pixel checks */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback Camera Error / Perms Notice */}
          {!cameraActive && (
            <div className="p-8 text-center max-w-md space-y-4">
              <Camera className="w-12 h-12 text-[#FFC21A] mx-auto animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white">Camera Viewfinder</h4>
                <p className="text-xs text-slate-400 pt-1">
                  {cameraError || 'Requesting camera access via getUserMedia (Web API)...'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateCapture}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg"
              >
                Simulate AR Capture for Angle {currentStepIndex + 1}
              </button>
            </div>
          )}

          {/* AR Alignment Guide Bounding Box & Reticle (Canvas/SVG overlay) */}
          {cameraActive && currentAngle && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
              {/* Dynamic AR Outline Box */}
              <div
                className="absolute border-2 border-dashed border-[#FFC21A] rounded-2xl shadow-[0_0_20px_rgba(255,194,26,0.35)] transition-all duration-300 pointer-events-none"
                style={{
                  left: `${currentAngle.overlayBox.x}%`,
                  top: `${currentAngle.overlayBox.y}%`,
                  width: `${currentAngle.overlayBox.w}%`,
                  height: `${currentAngle.overlayBox.h}%`,
                }}
              >
                {/* 4 Corner L-Brackets */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#FFC21A] rounded-tl" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#FFC21A] rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#FFC21A] rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#FFC21A] rounded-br" />

                {/* Center Target Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-60">
                  <div className="w-full h-0.5 bg-[#FFC21A]" />
                  <div className="h-full w-0.5 bg-[#FFC21A] absolute" />
                </div>

                {/* Guide Badge */}
                <span className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-[#FFC21A] border border-[#FFC21A]/50">
                  ALIGN: {currentAngle.aspectRatioLabel.toUpperCase()}
                </span>
              </div>

              {/* Angle Instruction Pill */}
              <div className="mx-auto mt-2 px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-[#252836] text-xs font-semibold text-white shadow-xl max-w-md text-center">
                <span className="text-[#FFC21A] block font-bold text-[11px] uppercase tracking-wider">
                  {currentAngle.name}
                </span>
                <span className="text-slate-300 text-[11px]">{currentAngle.instruction}</span>
              </div>
            </div>
          )}

          {/* Quality Check Warning Overlay */}
          {qualityWarning && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-sm font-bold text-white">Quality Check Notice</h4>
                <p className="text-xs text-rose-300 font-medium">
                  {qualityWarning.message}
                </p>
                <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-mono text-slate-400">
                  <span>Sharpness: <strong>{qualityWarning.blurScore}</strong> (min: 85)</span>
                  <span>Luminance: <strong>{qualityWarning.brightness}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAnyway}
                  className="px-4 py-2 rounded-xl bg-[#181926] text-slate-300 hover:text-white border border-[#252836] text-xs font-semibold transition-colors"
                >
                  Accept Anyway
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar & Thumbnail Strip */}
        <div className="p-4 bg-[#0D0E15] border-t border-[#252836] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Thumbnails of captured angles */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {capturedItems.map((item, idx) => (
              <div
                key={item.angle.id}
                className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/50 bg-[#12131A] shrink-0 group"
              >
                <img
                  src={item.previewUrl}
                  alt={item.angle.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono text-center text-emerald-400 truncate">
                  #{idx + 1}
                </span>
              </div>
            ))}

            {capturedItems.length === 0 && (
              <span className="text-[11px] text-slate-500 italic pl-1">
                No angles captured yet. Follow frame guide.
              </span>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={cameraActive ? handleSnap : handleSimulateCapture}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-amber-900/30"
            >
              <Camera className="w-4 h-4" />
              <span>Capture {currentAngle?.name}</span>
            </button>

            {capturedItems.length > 0 && (
              <button
                type="button"
                onClick={handleFinishAndSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Submit {capturedItems.length} Photo{capturedItems.length === 1 ? '' : 's'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
