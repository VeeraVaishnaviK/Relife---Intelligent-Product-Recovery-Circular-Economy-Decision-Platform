from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/roi-calculator", tags=["roi-calculator"])

CO2_EMISSION_FACTOR_PER_KG = 21.4
DEFAULT_DEVICE_WEIGHT_KG = 1.45
DEFAULT_AUTOMATION_EFFICIENCY = 0.50


class ROIRequest(BaseModel):
    monthly_returns: int = Field(default=10000, ge=1)
    avg_product_value_inr: float = Field(default=32000.0, ge=0.0)
    current_disposal_rate_pct: float = Field(default=38.0, ge=0.0, le=100.0)
    manual_inspection_cost_inr: float = Field(default=500.0, ge=0.0)
    refurb_success_rate_pct: float = Field(default=75.0, ge=0.0, le=100.0)
    avg_device_weight_kg: Optional[float] = DEFAULT_DEVICE_WEIGHT_KG
    automation_efficiency_pct: Optional[float] = DEFAULT_AUTOMATION_EFFICIENCY


class ROIResponse(BaseModel):
    annual_value_recovered_inr: float
    annual_labor_savings_inr: float
    annual_total_benefit_inr: float
    annual_co2_avoided_tons: float
    annual_waste_diverted_tons: float
    recovery_uplift_pct: float
    disclaimer: str = "Estimates based on user inputs and industry-standard assumptions; actual results depend on product mix, market conditions, and operational factors."


@router.post("/calculate", response_model=ROIResponse)
def calculate_roi(payload: ROIRequest):
    """
    Isolated business case calculation endpoint for prospective enterprise partners.
    """
    uplift_fraction = (payload.current_disposal_rate_pct / 100.0) * (payload.refurb_success_rate_pct / 100.0)
    monthly_val = payload.monthly_returns * payload.avg_product_value_inr * uplift_fraction
    monthly_labor = payload.monthly_returns * payload.manual_inspection_cost_inr * (payload.automation_efficiency_pct or DEFAULT_AUTOMATION_EFFICIENCY)

    monthly_diverted_units = payload.monthly_returns * uplift_fraction
    monthly_waste_kg = monthly_diverted_units * (payload.avg_device_weight_kg or DEFAULT_DEVICE_WEIGHT_KG)
    monthly_co2_kg = monthly_waste_kg * CO2_EMISSION_FACTOR_PER_KG

    return ROIResponse(
        annual_value_recovered_inr=round(monthly_val * 12, 2),
        annual_labor_savings_inr=round(monthly_labor * 12, 2),
        annual_total_benefit_inr=round((monthly_val + monthly_labor) * 12, 2),
        annual_co2_avoided_tons=round((monthly_co2_kg * 12) / 1000.0, 2),
        annual_waste_diverted_tons=round((monthly_waste_kg * 12) / 1000.0, 2),
        recovery_uplift_pct=round(uplift_fraction * 100.0, 1),
    )
