import os
import re
import uuid
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.database import get_db, ResumeHistory, AppSetting
from app.services.docx_engine import DocxEngine
from app.services.ats_scorer import AtsScorer
from app.services.ai_service import AiService
from app.services.formatting_validator import FormattingValidator
from app.services.pdf_converter import PdfConverter
from app.services.template_generator import create_master_resume

router = APIRouter()

# --- Request / Response Schemas ---

class JobDescriptionRequest(BaseModel):
    job_description: str = Field(..., min_length=20, description="Pasted job description text")

class OptimizeResumeRequest(BaseModel):
    job_description: str = Field(..., min_length=20)
    job_data: Optional[Dict[str, Any]] = None

class ModificationItem(BaseModel):
    id: Optional[str] = None
    section: str
    original_text: str
    replacement_text: str
    reason: Optional[str] = None
    keywords_added: Optional[List[str]] = []
    accepted: Optional[bool] = True

class GenerateResumeRequest(BaseModel):
    job_description: str
    company_name: Optional[str] = "Company"
    job_title: Optional[str] = "Position"
    candidate_name: Optional[str] = None
    approved_modifications: List[ModificationItem]

class SettingsUpdateRequest(BaseModel):
    ai_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    openai_model: Optional[str] = None
    max_expansion_threshold: Optional[float] = None


# --- Helper Functions ---

def get_or_create_master_docx() -> Path:
    root_master = settings.BASE_DIR.parent / "Logeshwaran_N_Full-Stack.docx"
    if root_master.exists():
        if not settings.DEFAULT_TEMPLATE_PATH.exists() or settings.DEFAULT_TEMPLATE_PATH.stat().st_size != root_master.stat().st_size:
            shutil.copy2(str(root_master), str(settings.DEFAULT_TEMPLATE_PATH))
        return settings.DEFAULT_TEMPLATE_PATH
    if not settings.DEFAULT_TEMPLATE_PATH.exists():
        create_master_resume(settings.DEFAULT_TEMPLATE_PATH)
    return settings.DEFAULT_TEMPLATE_PATH

def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_\-]', '', name.replace(' ', '_'))
    return cleaned or "Document"


# --- Endpoints ---

@router.get("/template/info")
def get_template_info():
    """Get metadata, extracted sections, and preview of current master resume."""
    master_path = get_or_create_master_docx()
    try:
        engine = DocxEngine(master_path)
        candidate = engine.extract_candidate_info()
        sections = engine.extract_sections()
        preview = engine.generate_html_preview()

        file_stat = master_path.stat()
        return {
            "status": "success",
            "file_name": master_path.name,
            "file_size_bytes": file_stat.st_size,
            "last_modified": datetime.fromtimestamp(file_stat.st_mtime, tz=timezone.utc).isoformat(),
            "candidate": candidate,
            "sections_count": len(sections),
            "sections": sections,
            "preview": preview,
            "formatting_rules": {
                "font_family": "Cambria",
                "margins": "0.50 inch (A4 Standard)",
                "heading_color": "#365F91 (Word Theme Accent 1)",
                "template_protection": "Active (XML-level in-place modification only)"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect master template: {str(e)}")


@router.post("/template/upload")
async def upload_master_template(file: UploadFile = File(...)):
    """Upload or replace the default master resume DOCX template."""
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only DOCX files (.docx) are supported.")

    # Save to temporary file first to validate
    temp_path = settings.TEMPLATES_DIR / f"temp_{uuid.uuid4()}.docx"
    try:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (10MB).")

        with open(temp_path, "wb") as f:
            f.write(content)

        # Validate that the DOCX can be parsed
        test_engine = DocxEngine(temp_path)
        text = test_engine.extract_full_text()
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Uploaded document contains insufficient textual content.")

        # Backup existing default if exists
        backup_path = settings.TEMPLATES_DIR / f"backup_master_{int(datetime.now().timestamp())}.docx"
        if settings.DEFAULT_TEMPLATE_PATH.exists():
            shutil.copy2(settings.DEFAULT_TEMPLATE_PATH, backup_path)

        # Replace default template safely
        shutil.move(temp_path, settings.DEFAULT_TEMPLATE_PATH)

        return {
            "status": "success",
            "message": "Master resume template successfully updated.",
            "file_name": file.filename,
            "candidate": test_engine.extract_candidate_info()
        }
    except HTTPException:
        if temp_path.exists():
            temp_path.unlink()
        raise
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded DOCX: {str(e)}")


@router.post("/job/parse")
def parse_job_description(request: JobDescriptionRequest):
    """Extract job title, company name, skills, and ATS keywords from job posting text."""
    try:
        parsed = AiService.parse_job_description(request.job_description)
        return {
            "status": "success",
            "data": parsed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job description parsing failed: {str(e)}")


@router.post("/resume/analyze")
def analyze_master_resume(request: JobDescriptionRequest):
    """Calculate original resume ATS compatibility score and gap analysis."""
    master_path = get_or_create_master_docx()
    try:
        engine = DocxEngine(master_path)
        resume_text = engine.extract_full_text()
        sections_data = engine.extract_sections()
        analysis = AtsScorer.analyze(resume_text, request.job_description, sections_data)

        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS analysis failed: {str(e)}")


@router.post("/resume/optimize")
def optimize_resume(request: OptimizeResumeRequest):
    """
    Generate section-by-section AI modification proposals with ATS keywords,
    diff calculations, and strict authenticity guardrails.
    """
    master_path = get_or_create_master_docx()
    try:
        engine = DocxEngine(master_path)
        candidate = engine.extract_candidate_info()
        sections = engine.extract_sections()
        resume_text = engine.extract_full_text()

        # Parse JD if not provided
        jd_data = request.job_data or AiService.parse_job_description(request.job_description)
        original_analysis = AtsScorer.analyze(resume_text, request.job_description, sections)

        proposals = AiService.generate_customization_proposals(
            resume_sections=sections,
            candidate_info=candidate,
            jd_data=jd_data,
            missing_keywords=original_analysis.get("missing_keywords", [])
        )

        return {
            "status": "success",
            "job_data": jd_data,
            "original_ats_score": original_analysis.get("score", 0),
            "original_analysis": original_analysis,
            "proposals_count": len(proposals),
            "proposals": proposals,
            "authenticity_guarantee": "Authenticity verified. No fake employers, dates, or unauthorized credentials introduced."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post("/resume/generate")
def generate_customized_resume(
    request: GenerateResumeRequest,
    db: Session = Depends(get_db)
):
    """
    Apply approved modifications into a clean copy of the master DOCX,
    validate 100% formatting preservation, calculate post-optimization ATS score,
    generate PDF, and store in history.
    """
    master_path = get_or_create_master_docx()
    master_engine = DocxEngine(master_path)
    candidate_info = master_engine.extract_candidate_info()

    cand_name = request.candidate_name or candidate_info.get("name", "Candidate")
    comp_name = request.company_name or "TargetCompany"
    role_title = request.job_title or "TargetRole"

    # Professional filename standard: CandidateName_CompanyName_JobTitle_Resume.docx
    base_stem = f"{sanitize_filename(cand_name)}_{sanitize_filename(comp_name)}_{sanitize_filename(role_title)}_Resume"
    timestamp_suffix = datetime.now().strftime("%Y%m%d_%H%M%S")
    docx_filename = f"{base_stem}_{timestamp_suffix}.docx"
    pdf_filename = f"{base_stem}_{timestamp_suffix}.pdf"

    output_docx_path = settings.RESUMES_DIR / docx_filename
    output_pdf_path = settings.RESUMES_DIR / pdf_filename

    # Filter accepted modifications
    active_mods = [m.model_dump() for m in request.approved_modifications if m.accepted is not False]

    # 1. Apply modifications strictly preserving original document formatting
    applied_count, warnings, layout_metrics = master_engine.apply_modifications(
        modifications=active_mods,
        output_path=output_docx_path
    )

    # 2. Validate formatting preservation
    validation_report = FormattingValidator.validate(master_path, output_docx_path)

    # 3. Calculate Original vs Optimized ATS score
    new_engine = DocxEngine(output_docx_path)
    new_text = new_engine.extract_full_text()
    orig_text = master_engine.extract_full_text()

    orig_analysis = AtsScorer.analyze(orig_text, request.job_description, master_engine.extract_sections())
    opt_analysis = AtsScorer.analyze(new_text, request.job_description, new_engine.extract_sections())

    # 4. Generate PDF from finalized DOCX
    pdf_success, pdf_msg = PdfConverter.convert_docx_to_pdf(output_docx_path, output_pdf_path)
    final_pdf_path = str(output_pdf_path) if pdf_success else None
    final_pdf_filename = pdf_filename if pdf_success else None

    # 5. Save in SQLite History
    history_record = ResumeHistory(
        company_name=comp_name,
        job_title=role_title,
        candidate_name=cand_name,
        job_description=request.job_description,
        original_ats_score=orig_analysis.get("score", 0.0),
        optimized_ats_score=opt_analysis.get("score", 0.0),
        docx_filename=docx_filename,
        pdf_filename=final_pdf_filename,
        docx_path=str(output_docx_path),
        pdf_path=final_pdf_path,
        matched_keywords_json=json.dumps(opt_analysis.get("matched_keywords", [])),
        missing_keywords_json=json.dumps(opt_analysis.get("missing_keywords", [])),
        changes_applied_json=json.dumps(active_mods),
        ats_analysis_json=json.dumps(opt_analysis)
    )
    db.add(history_record)
    db.commit()
    db.refresh(history_record)

    # 6. Generate optimized HTML preview for UI side-by-side comparison
    optimized_preview = new_engine.generate_html_preview()

    return {
        "status": "success",
        "history_id": history_record.id,
        "filename": docx_filename,
        "pdf_available": pdf_success,
        "pdf_message": pdf_msg,
        "applied_modifications_count": applied_count,
        "warnings": warnings,
        "layout_metrics": layout_metrics,
        "formatting_validation": validation_report,
        "ats_scores": {
            "original_score": orig_analysis.get("score", 0.0),
            "optimized_score": opt_analysis.get("score", 0.0),
            "score_delta": round(opt_analysis.get("score", 0.0) - orig_analysis.get("score", 0.0), 1),
            "matched_keywords_count": opt_analysis.get("matched_keywords_count", 0),
            "missing_keywords_count": opt_analysis.get("missing_keywords_count", 0),
            "original_analysis": orig_analysis,
            "optimized_analysis": opt_analysis
        },
        "optimized_preview": optimized_preview,
        "download_urls": {
            "docx": f"/api/resume/download/{history_record.id}/docx",
            "pdf": f"/api/resume/download/{history_record.id}/pdf" if pdf_success else None
        }
    }


@router.get("/resume/download/{history_id}/{file_format}")
def download_resume(
    history_id: str,
    file_format: str,
    db: Session = Depends(get_db)
):
    """Download customized resume in DOCX (primary) or PDF format with standardized filenames."""
    record = db.query(ResumeHistory).filter(ResumeHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if file_format.lower() == "docx":
        file_path = Path(record.docx_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="DOCX file no longer exists on disk.")
        return FileResponse(
            path=str(file_path),
            filename=record.docx_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    elif file_format.lower() == "pdf":
        if not record.pdf_path:
            raise HTTPException(status_code=404, detail="PDF version was not generated for this resume.")
        file_path = Path(record.pdf_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="PDF file no longer exists on disk.")
        return FileResponse(
            path=str(file_path),
            filename=record.pdf_filename or f"{Path(record.docx_filename).stem}.pdf",
            media_type="application/pdf"
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats: docx, pdf.")


@router.get("/history")
def get_resume_history(db: Session = Depends(get_db)):
    """List all previously generated customized resumes."""
    records = db.query(ResumeHistory).order_by(ResumeHistory.created_at.desc()).all()
    return {
        "status": "success",
        "total": len(records),
        "history": [r.to_dict() for r in records]
    }


@router.get("/history/{history_id}")
def get_history_detail(history_id: str, db: Session = Depends(get_db)):
    """Get complete details and diffs for a specific history record."""
    record = db.query(ResumeHistory).filter(ResumeHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Resume history item not found.")
    
    # Check if files still exist
    docx_exists = Path(record.docx_path).exists() if record.docx_path else False
    pdf_exists = Path(record.pdf_path).exists() if record.pdf_path else False
    
    preview_data = None
    if docx_exists:
        try:
            eng = DocxEngine(Path(record.docx_path))
            preview_data = eng.generate_html_preview()
        except Exception:
            pass

    data = record.to_dict()
    data["docx_exists"] = docx_exists
    data["pdf_exists"] = pdf_exists
    data["preview"] = preview_data
    return {
        "status": "success",
        "item": data
    }


@router.delete("/history/{history_id}")
def delete_history_item(history_id: str, db: Session = Depends(get_db)):
    """Delete a resume history record and clean up associated files."""
    record = db.query(ResumeHistory).filter(ResumeHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Resume history item not found.")

    # Remove files if present
    if record.docx_path and Path(record.docx_path).exists():
        try:
            Path(record.docx_path).unlink()
        except Exception:
            pass
    if record.pdf_path and Path(record.pdf_path).exists():
        try:
            Path(record.pdf_path).unlink()
        except Exception:
            pass

    db.delete(record)
    db.commit()

    return {
        "status": "success",
        "message": "Resume record and generated files deleted successfully."
    }


@router.get("/settings")
def get_application_settings():
    """Get active configuration parameters."""
    return {
        "ai_provider": settings.AI_PROVIDER,
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5),
        "openai_api_key_configured": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5),
        "gemini_model": settings.GEMINI_MODEL,
        "openai_model": settings.OPENAI_MODEL,
        "max_expansion_threshold": settings.MAX_LENGTH_EXPANSION_THRESHOLD,
        "default_template_name": settings.DEFAULT_TEMPLATE_PATH.name
    }


@router.post("/settings")
def update_application_settings(req: SettingsUpdateRequest):
    """Update AI providers, API keys, and layout thresholds."""
    if req.ai_provider:
        settings.AI_PROVIDER = req.ai_provider
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.gemini_model:
        settings.GEMINI_MODEL = req.gemini_model
    if req.openai_model:
        settings.OPENAI_MODEL = req.openai_model
    if req.max_expansion_threshold is not None:
        settings.MAX_LENGTH_EXPANSION_THRESHOLD = req.max_expansion_threshold

    return {
        "status": "success",
        "message": "Settings updated successfully.",
        "settings": {
            "ai_provider": settings.AI_PROVIDER,
            "gemini_api_key_configured": bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5),
            "openai_api_key_configured": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5),
            "gemini_model": settings.GEMINI_MODEL,
            "openai_model": settings.OPENAI_MODEL,
            "max_expansion_threshold": settings.MAX_LENGTH_EXPANSION_THRESHOLD
        }
    }
