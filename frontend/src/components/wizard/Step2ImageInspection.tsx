'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ImageInspectionResponse,
  SampleImageItem,
  DefectDetectionItem,
} from '../../lib/types';
import { fetchSampleImages, uploadInspection } from '../../lib/api';
import {
  ScanEye,
  Camera,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  Eye,
  Layers,
} from 'lucide-react';
import { GuidedCaptureCamera } from '../camera/GuidedCaptureCamera';

interface Step2Props {
  returnId: string;
  onInspectionComplete: (data: ImageInspectionResponse) => void;
  inspectionData: ImageInspectionResponse | null;
  category?: string;
}

const DEFECT_COLORS: Record<string, string> = {
  crack: '#EF4444',       // Red
  dent: '#F57C00',        // Orange
  scratch: '#FFC21A',     // Gold / Yellow
  'missing part': '#A855F7', // Purple
  default: '#22D3EE',     // Cyan
};

export function Step2ImageInspection({
  returnId,
  onInspectionComplete,
  inspectionData,
  category = 'Laptop',
}: Step2Props) {
  const [samples, setSamples] = useState<SampleImageItem[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>('laptop_cracked_screen.jpg');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [capturedAngleTags, setCapturedAngleTags] = useState<string[]>([]);
  const [isGuidedCameraOpen, setIsGuidedCameraOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('/api/inspections/image/laptop_cracked_screen.jpg');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSampleImages()
      .then((data) => {
        setSamples(data);
      })
      .catch((err) => console.error('Error loading sample inspection images:', err));
  }, []);

  const handleSelectSample = (filename: string) => {
    setSelectedSample(filename);
    setUploadedFiles([]);
    setPreviewUrl(`http://localhost:8000/api/inspections/image/${filename}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      setUploadedFiles(filesArray);
      setSelectedSample('');
      const localUrl = URL.createObjectURL(filesArray[0]);
      setPreviewUrl(localUrl);
    }
  };

  const handleRunInspection = async () => {
    if (!returnId) {
      setError('Please register a product in Step 1 first to generate a Return ID.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('return_id', returnId);

      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          formData.append('files', file);
        });
      } else if (selectedSample) {
        formData.append('sample_filename', selectedSample);
      } else {
        formData.append('sample_filename', 'laptop_cracked_screen.jpg');
      }

      if (capturedAngleTags.length > 0) {
        formData.append('capture_tags', capturedAngleTags.join(','));
      }

      const res = await uploadInspection(formData);
      onInspectionComplete(res);
    } catch (err: any) {
      console.error('Inspection failed:', err);
      setError(err.message || 'Image inspection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Honesty Notice Bar */}
      <div className="bg-[#181926] border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-300">
          <Info className="w-4 h-4 shrink-0 text-[#FFC21A]" />
          <span>
            <strong>Honesty Rule:</strong> Visual inspection cannot confirm battery or internal electrical health; routed to testing in Step 3.
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-md bg-[#252836] text-[10px] font-mono text-[#FFC21A] border border-[#FFC21A]/30 shrink-0">
          Demo Mode: Simulated Detections
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Selector & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#12131A] border border-[#252836] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E202E]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FFC21A]" />
                <span>Select or Upload Inspection Photos</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">1-5 Images</span>
            </div>

            {/* Quick Sample Image Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Pre-configured Sample Photos (Instant Demo):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {samples.map((s) => {
                  const isSelected = selectedSample === s.filename;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSample(s.filename)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                        isSelected
                          ? 'bg-[#1E202E] border-[#FFC21A] text-white shadow-md'
                          : 'bg-[#08080D] border-[#252836] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold truncate text-[11px] text-slate-200">{s.title}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{s.expected_defect} • {s.severity}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AR Guided Capture Camera Option */}
            <div className="pt-2 border-t border-[#1E202E]">
              <button
                type="button"
                onClick={() => setIsGuidedCameraOpen(true)}
                className="w-full py-3 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/40 text-white font-bold text-xs flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC21A] to-[#F57C00] flex items-center justify-center text-slate-950">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-white group-hover:text-[#FFC21A] transition-colors">
                      AR-Assisted Capture Guide
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Multi-angle alignment overlays + blur check
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181926] text-amber-300 border border-amber-500/30">
                  Mobile Web
                </span>
              </button>
            </div>

            {/* Upload Input */}
            <div className="space-y-2 pt-2 border-t border-[#1E202E]">
              <label className="text-xs font-semibold text-slate-300 block">
                Or Upload from Device:
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-[#252836] hover:border-[#FFC21A]/60 rounded-xl bg-[#08080D] flex flex-col items-center justify-center text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <UploadCloud className="w-6 h-6 text-slate-500 mb-1" />
                <span>{uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Drag & drop or browse photos'}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG up to 10MB</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRunInspection}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F57C00] text-slate-950 font-bold text-xs tracking-wide shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Running OpenCV & Defect Detector...</span>
              ) : (
                <>
                  <ScanEye className="w-4 h-4" />
                  <span>Run Optical Defect Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Canvas & Detected Bounding Boxes (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#12131A] border border-[#252836] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E202E] mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FFC21A]" />
                <h3 className="text-sm font-bold text-white">Visual Analysis & Bounding Box Overlay</h3>
              </div>
              {inspectionData && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      inspectionData.is_blurry
                        ? 'bg-red-950/50 border-red-500/40 text-red-300'
                        : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    Blur Var: {inspectionData.blur_score} ({inspectionData.quality_flag})
                  </span>
                </div>
              )}
            </div>

            {capturedAngleTags.length > 0 && (
              <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>AR Verified Angles:</strong> {capturedAngleTags.map((t) => t.replace('_', ' ')).join(' • ')}
                  </span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181926] text-emerald-400 border border-emerald-500/30 shrink-0">
                  Passed Pre-Check
                </span>
              </div>
            )}

            {/* Interactive Image View with Bounding Boxes */}
            <div className="relative w-full aspect-square max-h-[420px] bg-[#08080D] rounded-xl overflow-hidden border border-[#252836] flex items-center justify-center">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewUrl}
                    alt="Device Inspection"
                    className="w-full h-full object-contain"
                  />

                  {/* SVG Overlay for Bounding Boxes */}
                  {inspectionData && inspectionData.defects.length > 0 && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {inspectionData.defects.map((defect, i) => {
                        const x = defect.bbox_x * 100;
                        const y = defect.bbox_y * 100;
                        const w = defect.bbox_w * 100;
                        const h = defect.bbox_h * 100;
                        const color = DEFECT_COLORS[defect.defect_type] || DEFECT_COLORS.default;

                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              fill={`${color}22`}
                              stroke={color}
                              strokeWidth="1.2"
                              strokeDasharray="2 1"
                            />
                            <rect
                              x={x}
                              y={Math.max(0, y - 5.5)}
                              width={Math.min(w * 1.3, 40)}
                              height="5.2"
                              fill={color}
                              rx="1"
                            />
                            <text
                              x={x + 1}
                              y={Math.max(3.8, y - 1.5)}
                              fill="#000000"
                              fontSize="3.2"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              {defect.defect_type.toUpperCase()} ({defect.confidence}%)
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No image loaded</p>
                </div>
              )}

              {/* Demo Mode Badge Overlay */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#08080D]/90 border border-[#FFC21A]/50 text-[10px] font-mono text-[#FFC21A] backdrop-blur-sm">
                OpenCV Preprocessed • Simulated Detections
              </div>
            </div>

            {/* Defect Cards List */}
            <div className="mt-4 pt-3 border-t border-[#1E202E] space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Detected Anomalies ({inspectionData ? inspectionData.defects.length : 0}):</span>
                {inspectionData && (
                  <span className="text-[10px] text-slate-400">
                    Model: YOLOv8-ReLife-Simulated-v1.0
                  </span>
                )}
              </div>

              {inspectionData && inspectionData.defects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {inspectionData.defects.map((d, idx) => {
                    const color = DEFECT_COLORS[d.defect_type] || DEFECT_COLORS.default;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#08080D] border border-[#252836] flex items-start gap-2.5 text-xs"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white capitalize">{d.defect_type}</span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#1E202E] text-[#FFC21A]">
                              {d.confidence}% Conf
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="capitalize">Severity: {d.severity}</span>
                            <span>•</span>
                            <span>Simulated</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">{d.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : inspectionData ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No exterior defects detected. Device surface is Grade A pristine.</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Run optical inspection to detect surface cracks, dents, scratches, or missing components.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Standalone AR Guided Capture Modal */}
      {isGuidedCameraOpen && (
        <GuidedCaptureCamera
          category={category}
          onCaptureComplete={(files, tags) => {
            setUploadedFiles(files);
            setCapturedAngleTags(tags);
            setSelectedSample('');
            if (files.length > 0) {
              setPreviewUrl(URL.createObjectURL(files[0]));
            }
          }}
          onClose={() => setIsGuidedCameraOpen(false)}
        />
      )}
    </div>
  );
}
