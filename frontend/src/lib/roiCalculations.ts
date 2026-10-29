/**
 * ReLife AI Enterprise Circular ROI & Carbon Abatement Engine
 *
 * Dedicated isolated business case projection model.
 * Sourced Constants:
 * - EPA WARM v15 & ADEME Circularity Lifecycle GHG Factor: ~21.4 kg CO2e per kg electronic hardware diverted
 * - Average Device Weight: ~1.45 kg (weighted laptop & smartphone return mix)
 * - Automation Efficiency Factor: 50% labor inspection time reduction via AI CV + checklist
 */

export interface ROIInputs {
  monthlyReturns: number;             // e.g. 10,000 units
  avgProductValueInr: number;         // e.g. ₹28,000
  currentDisposalRatePct: number;     // e.g. 40% currently discarded or undervalued
  manualInspectionCostInr: number;    // e.g. ₹450 per unit labor cost
  refurbSuccessRatePct: number;       // e.g. 72% success rate
  avgDeviceWeightKg?: number;         // default 1.45 kg
  automationEfficiencyPct?: number;   // default 50% labor time reduction
}

export interface ROIResults {
  // Monthly metrics
  monthlyValueRecoveredInr: number;
  monthlyLaborSavingsInr: number;
  monthlyTotalBenefitInr: number;
  monthlyCO2AvoidedKg: number;
  monthlyWasteDivertedKg: number;

  // Annualized metrics (x12)
  annualValueRecoveredInr: number;
  annualLaborSavingsInr: number;
  annualTotalBenefitInr: number;
  annualCO2AvoidedTons: number;
  annualWasteDivertedTons: number;

  // Efficiency KPIs
  roiMultiple: number;
  recoveryUpliftPct: number;

  // Breakdown for Charts
  breakdown: {
    category: string;
    beforeInr: number;
    withReLifeInr: number;
  }[];
  esgBreakdown: {
    metric: string;
    amount: number;
    unit: string;
  }[];
}

// Environmental Constants
export const CO2_EMISSION_FACTOR_PER_KG = 21.4; // kg CO2e / kg diverted
export const DEFAULT_DEVICE_WEIGHT_KG = 1.45;    // kg
export const DEFAULT_AUTOMATION_EFFICIENCY = 0.50; // 50% reduction

export const ENTERPRISE_PRESETS: Record<string, ROIInputs> = {
  midMarket: {
    monthlyReturns: 2500,
    avgProductValueInr: 22000,
    currentDisposalRatePct: 45,
    manualInspectionCostInr: 400,
    refurbSuccessRatePct: 68,
  },
  enterprise: {
    monthlyReturns: 10000,
    avgProductValueInr: 32000,
    currentDisposalRatePct: 38,
    manualInspectionCostInr: 500,
    refurbSuccessRatePct: 75,
  },
  globalHub: {
    monthlyReturns: 50000,
    avgProductValueInr: 38000,
    currentDisposalRatePct: 35,
    manualInspectionCostInr: 550,
    refurbSuccessRatePct: 80,
  },
};

export function calculateEnterpriseROI(inputs: ROIInputs): ROIResults {
  const {
    monthlyReturns,
    avgProductValueInr,
    currentDisposalRatePct,
    manualInspectionCostInr,
    refurbSuccessRatePct,
    avgDeviceWeightKg = DEFAULT_DEVICE_WEIGHT_KG,
    automationEfficiencyPct = DEFAULT_AUTOMATION_EFFICIENCY,
  } = inputs;

  // Recovery Uplift %: The fraction of currently wasted units rescued through circular routing
  // Assumed Recovery Uplift = (Disposal Rate % * Refurb Success Rate %)
  const recoveryUpliftFraction = (currentDisposalRatePct / 100.0) * (refurbSuccessRatePct / 100.0);
  const recoveryUpliftPct = Math.round(recoveryUpliftFraction * 1000) / 10;

  // Estimated Value Recovered = Monthly Returns * Avg Product Value * Recovery Uplift Fraction
  const monthlyValueRecoveredInr = monthlyReturns * avgProductValueInr * recoveryUpliftFraction;

  // Estimated Labor Cost Saved = Monthly Returns * Manual Cost * Automation Efficiency Factor
  const monthlyLaborSavingsInr = monthlyReturns * manualInspectionCostInr * automationEfficiencyPct;

  const monthlyTotalBenefitInr = monthlyValueRecoveredInr + monthlyLaborSavingsInr;

  // Waste Diverted & Carbon Abated
  // Diverted units = units salvaged from disposal
  const unitsDiverted = monthlyReturns * recoveryUpliftFraction;
  const monthlyWasteDivertedKg = unitsDiverted * avgDeviceWeightKg;
  const monthlyCO2AvoidedKg = monthlyWasteDivertedKg * CO2_EMISSION_FACTOR_PER_KG;

  // Annualized Figures
  const annualValueRecoveredInr = monthlyValueRecoveredInr * 12;
  const annualLaborSavingsInr = monthlyLaborSavingsInr * 12;
  const annualTotalBenefitInr = monthlyTotalBenefitInr * 12;
  const annualCO2AvoidedTons = (monthlyCO2AvoidedKg * 12) / 1000;
  const annualWasteDivertedTons = (monthlyWasteDivertedKg * 12) / 1000;

  // Indicative software investment assumption for ROI Multiple calculation (approx 3% of benefit)
  const estimatedAnnualSoftwareInvestment = Math.max(600000, annualTotalBenefitInr * 0.035);
  const roiMultiple = Math.round((annualTotalBenefitInr / estimatedAnnualSoftwareInvestment) * 10) / 10;

  // Comparison breakdown
  const baselineMonthlyValueRealized = monthlyReturns * avgProductValueInr * (1 - currentDisposalRatePct / 100) * 0.5;
  const relifeMonthlyValueRealized = baselineMonthlyValueRealized + monthlyValueRecoveredInr;

  const baselineLaborCost = monthlyReturns * manualInspectionCostInr;
  const relifeLaborCost = baselineLaborCost - monthlyLaborSavingsInr;

  return {
    monthlyValueRecoveredInr: Math.round(monthlyValueRecoveredInr),
    monthlyLaborSavingsInr: Math.round(monthlyLaborSavingsInr),
    monthlyTotalBenefitInr: Math.round(monthlyTotalBenefitInr),
    monthlyCO2AvoidedKg: Math.round(monthlyCO2AvoidedKg),
    monthlyWasteDivertedKg: Math.round(monthlyWasteDivertedKg),

    annualValueRecoveredInr: Math.round(annualValueRecoveredInr),
    annualLaborSavingsInr: Math.round(annualLaborSavingsInr),
    annualTotalBenefitInr: Math.round(annualTotalBenefitInr),
    annualCO2AvoidedTons: Math.round(annualCO2AvoidedTons * 10) / 10,
    annualWasteDivertedTons: Math.round(annualWasteDivertedTons * 10) / 10,

    roiMultiple,
    recoveryUpliftPct,

    breakdown: [
      {
        category: 'Net Recovered Value',
        beforeInr: Math.round(baselineMonthlyValueRealized * 12),
        withReLifeInr: Math.round(relifeMonthlyValueRealized * 12),
      },
      {
        category: 'Processing & Inspection Labor',
        beforeInr: Math.round(baselineLaborCost * 12),
        withReLifeInr: Math.round(relifeLaborCost * 12),
      },
    ],

    esgBreakdown: [
      {
        metric: 'E-Waste Diverted from Landfills',
        amount: Math.round(annualWasteDivertedTons * 10) / 10,
        unit: 'Tons/Year',
      },
      {
        metric: 'Net Greenhouse Emissions Avoided',
        amount: Math.round(annualCO2AvoidedTons * 10) / 10,
        unit: 'Tons CO2e/Year',
      },
      {
        metric: 'Circularity Diversion Ratio',
        amount: Math.round(recoveryUpliftPct),
        unit: '% Uplift',
      },
    ],
  };
}
