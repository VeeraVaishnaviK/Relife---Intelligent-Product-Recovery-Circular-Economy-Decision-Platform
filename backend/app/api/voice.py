import json
import re
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..voice_models import VoiceInspectionLog

router = APIRouter(prefix="/api/voice", tags=["voice-inspection"])


class ParseVoiceRequest(BaseModel):
    raw_transcript: str
    return_id: Optional[str] = None
    inspector_id: Optional[str] = "tech_inspector_01"


class ParsedDefectTag(BaseModel):
    defect_type: str        # crack | dent | scratch | missing_part | battery_swelling | loose_hinge
    component: str          # display | keyboard | battery | motherboard | hinge | ports | casing
    severity: str           # high | med | low
    location: Optional[str] = "general"
    status_flag: str        # fail | pass | review


class ParseVoiceResponse(BaseModel):
    log_id: int
    raw_transcript: str
    inspector_id: str
    parsed_defects: List[ParsedDefectTag]
    recommended_checklist: Dict[str, str]
    formatted_notes: str
    confidence_score: float
    created_at: str


def _nlp_extract_defects(text: str) -> Dict[str, Any]:
    """
    Lightweight rule-based NLP extraction matching ReLife's defect and condition taxonomy.
    """
    t = text.lower()
    defects = []
    checklist: Dict[str, str] = {}

    # 1. Screen / Display checks
    if any(k in t for k in ["screen crack", "cracked screen", "display crack", "broken display", "cracked display", "shattered screen"]):
        loc = "top left corner" if "top left" in t else ("bottom" if "bottom" in t else "panel")
        defects.append(ParsedDefectTag(
            defect_type="crack",
            component="display",
            severity="high",
            location=loc,
            status_flag="fail"
        ))
        checklist["display_ok"] = "fail"
    elif "screen looks fine" in t or "display ok" in t or "screen good" in t or "display pass" in t:
        checklist["display_ok"] = "pass"

    # 2. Battery checks
    if any(k in t for k in ["swelling", "battery swell", "swollen battery", "battery bulging", "battery dead", "battery fault"]):
        defects.append(ParsedDefectTag(
            defect_type="battery_swelling",
            component="battery",
            severity="high",
            location="internal pouch",
            status_flag="fail"
        ))
        checklist["battery_test"] = "fail"
    elif "battery health good" in t or "battery ok" in t or "battery fine" in t:
        checklist["battery_test"] = "pass"

    # 3. Hinge & Structural checks
    if any(k in t for k in ["loose hinge", "hinge feels loose", "hinge broken", "hinge damage"]):
        defects.append(ParsedDefectTag(
            defect_type="loose_hinge",
            component="hinge",
            severity="med",
            location="pivot axle",
            status_flag="review"
        ))

    # 4. Keyboard checks
    if any(k in t for k in ["keyboard broken", "missing keys", "keys sticky", "spill on keyboard"]):
        defects.append(ParsedDefectTag(
            defect_type="missing_part",
            component="keyboard",
            severity="med",
            location="keycaps",
            status_flag="fail"
        ))
    elif "keyboard looks fine" in t or "keyboard fine" in t or "keyboard ok" in t:
        pass

    # 5. Dents & Scratches
    if "dent" in t:
        defects.append(ParsedDefectTag(
            defect_type="dent",
            component="casing",
            severity="med",
            location="corner",
            status_flag="review"
        ))
    if "scratch" in t:
        defects.append(ParsedDefectTag(
            defect_type="scratch",
            component="casing",
            severity="low",
            location="lid / rear",
            status_flag="pass"
        ))

    # 6. Power sequencing
    if "does not turn on" in t or "no power" in t or "won't boot" in t:
        checklist["powers_on"] = "fail"
    elif "powers on" in t or "boots up" in t or "turns on" in t:
        checklist["powers_on"] = "pass"

    # 7. Ports
    if "ports loose" in t or "broken port" in t or "usb damaged" in t:
        checklist["ports_ok"] = "fail"
    elif "ports look fine" in t or "ports working" in t or "ports ok" in t:
        checklist["ports_ok"] = "pass"

    # Formatted Technician note
    defect_summaries = [f"{d.component.capitalize()}: {d.defect_type} ({d.severity} severity)" for d in defects]
    if defect_summaries:
        formatted_notes = f"Voice Inspection Log: {'; '.join(defect_summaries)}. Spoken findings: \"{text.strip()}\"."
    else:
        formatted_notes = f"Voice Inspection Log: Verified visual & bench condition. Spoken notes: \"{text.strip()}\"."

    return {
        "defects": defects,
        "checklist": checklist,
        "formatted_notes": formatted_notes,
        "confidence": 94.0 if defects else 88.0
    }


@router.post("/parse-and-log", response_model=ParseVoiceResponse)
def parse_and_log_voice_inspection(payload: ParseVoiceRequest, db: Session = Depends(get_db)):
    """
    Parses spoken inspection transcript into structured defect tags and records an additive audit log.
    """
    if not payload.raw_transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty")

    nlp_result = _nlp_extract_defects(payload.raw_transcript)
    now = datetime.utcnow()

    parsed_json = json.dumps({
        "defects": [d.dict() for d in nlp_result["defects"]],
        "checklist": nlp_result["checklist"],
        "formatted_notes": nlp_result["formatted_notes"],
    })

    log_entry = VoiceInspectionLog(
        return_id=payload.return_id,
        raw_transcript=payload.raw_transcript.strip(),
        parsed_output_json=parsed_json,
        inspector_id=payload.inspector_id or "tech_inspector_01",
        confidence_score=nlp_result["confidence"],
        created_at=now
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return ParseVoiceResponse(
        log_id=log_entry.id,
        raw_transcript=log_entry.raw_transcript,
        inspector_id=log_entry.inspector_id,
        parsed_defects=nlp_result["defects"],
        recommended_checklist=nlp_result["checklist"],
        formatted_notes=nlp_result["formatted_notes"],
        confidence_score=log_entry.confidence_score,
        created_at=log_entry.created_at.strftime("%Y-%m-%d %H:%M:%S")
    )


@router.get("/logs", response_model=List[ParseVoiceResponse])
def list_voice_inspection_logs(db: Session = Depends(get_db)):
    """
    Returns recent voice inspection audit logs.
    """
    logs = db.query(VoiceInspectionLog).order_by(VoiceInspectionLog.created_at.desc()).limit(20).all()
    results = []
    for l in logs:
        try:
            data = json.loads(l.parsed_output_json)
            defects = [ParsedDefectTag(**d) for d in data.get("defects", [])]
            checklist = data.get("checklist", {})
            formatted_notes = data.get("formatted_notes", l.raw_transcript)
        except Exception:
            defects = []
            checklist = {}
            formatted_notes = l.raw_transcript

        results.append(ParseVoiceResponse(
            log_id=l.id,
            raw_transcript=l.raw_transcript,
            inspector_id=l.inspector_id,
            parsed_defects=defects,
            recommended_checklist=checklist,
            formatted_notes=formatted_notes,
            confidence_score=l.confidence_score,
            created_at=l.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ))
    return results
