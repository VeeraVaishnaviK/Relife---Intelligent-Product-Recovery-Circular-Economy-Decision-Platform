'use client';

import React, { useState } from 'react';
import {
  RegisterProductResponse,
  ImageInspectionResponse,
  FunctionalTestResponse,
  EvaluateDecisionResponse,
} from '../../lib/types';
import { Step1Registration } from './Step1Registration';
import { Step2ImageInspection } from './Step2ImageInspection';
import { Step3FunctionalTests } from './Step3FunctionalTests';
import { Step4CostEstimation } from './Step4CostEstimation';
import { Step5DecisionEngine } from './Step5DecisionEngine';
import { Step6HumanReview } from './Step6HumanReview';
import { Step7Report } from './Step7Report';
import {
  PlusCircle,
  ScanEye,
  CheckCircle2,
  DollarSign,
  Award,
  ShieldAlert,
  FileText,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Registration', icon: PlusCircle },
  { id: 2, name: 'Vision Inspection', icon: ScanEye },
  { id: 3, name: 'Functional Tests', icon: CheckCircle2 },
  { id: 4, name: 'Cost Estimation', icon: DollarSign },
  { id: 5, name: 'Decision Engine', icon: Award },
  { id: 6, name: 'Human Review', icon: ShieldAlert },
  { id: 7, name: 'Explainable Report', icon: FileText },
];

export function RecoveryWizard() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Workflow state shared across steps
  const [returnId, setReturnId] = useState<string>('REL-DEMO-001');
  const [registeredData, setRegisteredData] = useState<RegisterProductResponse | null>(null);
  const [inspectionData, setInspectionData] = useState<ImageInspectionResponse | null>(null);
  const [testsData, setTestsData] = useState<FunctionalTestResponse | null>(null);
  const [decisionData, setDecisionData] = useState<EvaluateDecisionResponse | null>(null);

  // Quick 2-Minute Demo Trigger
  const handleLoadDemoScenario = () => {
    setReturnId('REL-DEMO-001');
    setCurrentStep(1);
  };

  const handleRegistered = (data: RegisterProductResponse) => {
    setReturnId(data.return_id);
    setRegisteredData(data);
    setCurrentStep(2);
  };

  const handleInspectionComplete = (data: ImageInspectionResponse) => {
    setInspectionData(data);
    setCurrentStep(3);
  };

  const handleTestsComplete = (data: FunctionalTestResponse) => {
    setTestsData(data);
    setCurrentStep(4);
  };

  const handleProceedToDecision = () => {
    setCurrentStep(5);
  };

  const handleDecisionComplete = (data: EvaluateDecisionResponse) => {
    setDecisionData(data);
    // If human review required, go to step 6, otherwise step 7
    if (data.human_review_required) {
      setCurrentStep(6);
    } else {
      setCurrentStep(7);
    }
  };

  const handleReviewResolved = () => {
    setCurrentStep(7);
  };

  return (
    <div className="space-y-6">
      {/* Top Stepper Navigation Header */}
      <div className="bg-[#12131A] border border-[#252836] p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E202E]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC21A] animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ReLife AI • End-to-End Recovery Flow
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDemoScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-[#FFC21A] border border-[#FFC21A]/30 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Laptop Demo Scenario</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setReturnId('');
                setRegisteredData(null);
                setInspectionData(null);
                setTestsData(null);
                setDecisionData(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E202E] hover:bg-[#252836] text-slate-400 hover:text-white border border-[#252836] text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Stepper Steps Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#1E202E] border-[#FFC21A] text-white shadow-lg ring-1 ring-[#FFC21A]/40'
                    : isCompleted
                    ? 'bg-[#08080D] border-emerald-500/40 text-emerald-300'
                    : 'bg-[#08080D] border-[#252836] text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold">0{step.id}</span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FFC21A]' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div className="text-[11px] font-bold truncate">{step.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step View Content */}
      <div className="transition-all duration-200">
        {currentStep === 1 && (
          <Step1Registration
            onRegistered={handleRegistered}
            registeredData={registeredData}
          />
        )}

        {currentStep === 2 && (
          <Step2ImageInspection
            returnId={returnId}
            onInspectionComplete={handleInspectionComplete}
            inspectionData={inspectionData}
            category={registeredData?.category || 'Laptop'}
          />
        )}

        {currentStep === 3 && (
          <Step3FunctionalTests
            returnId={returnId}
            onTestsComplete={handleTestsComplete}
            testsData={testsData}
          />
        )}

        {currentStep === 4 && (
          <Step4CostEstimation
            returnId={returnId}
            onProceedToDecision={handleProceedToDecision}
          />
        )}

        {currentStep === 5 && (
          <Step5DecisionEngine
            returnId={returnId}
            onDecisionComplete={handleDecisionComplete}
            decisionData={decisionData}
          />
        )}

        {currentStep === 6 && (
          <Step6HumanReview
            returnId={returnId}
            decisionData={decisionData}
            onReviewResolved={handleReviewResolved}
          />
        )}

        {currentStep === 7 && (
          <Step7Report returnId={returnId || 'REL-DEMO-001'} />
        )}
      </div>

      {/* Bottom Step Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-[#252836] text-xs">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12131A] hover:bg-[#1E202E] text-slate-300 border border-[#252836] font-semibold transition-all disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <span className="text-slate-500 font-mono text-[11px]">
          Step {currentStep} of 7 • ReLife Intelligent Recovery
        </span>

        <button
          type="button"
          disabled={currentStep === 7}
          onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12131A] hover:bg-[#1E202E] text-[#FFC21A] border border-[#FFC21A]/30 font-semibold transition-all disabled:opacity-40 cursor-pointer"
        >
          <span>Next Step</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
