import os
import sys
import shutil
from pathlib import Path
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.services.docx_engine import DocxEngine
from app.services.ats_scorer import AtsScorer
from app.services.ai_service import AiService
from app.services.formatting_validator import FormattingValidator
from app.services.template_generator import create_master_resume
from app.models.database import init_db, SessionLocal, ResumeHistory
from app.api.endpoints import (
    get_template_info,
    parse_job_description,
    analyze_master_resume,
    optimize_resume,
    generate_customized_resume,
    get_resume_history,
    JobDescriptionRequest,
    OptimizeResumeRequest,
    GenerateResumeRequest,
    ModificationItem
)

SAMPLE_JD = """
Job Title: Senior Full Stack Engineer
Company: Stripe
Location: San Francisco, CA

About the Role:
We are looking for a Senior Full Stack Engineer with 5+ years of experience to join our core payments infrastructure team.
You will architect and scale high-throughput payment microservices handling millions of daily transactions.

Requirements & Technical Skills:
- 5+ years of hands-on experience in software engineering
- Proficient in Python (FastAPI, Django) and TypeScript / React
- Deep experience with Docker, Kubernetes, and AWS cloud infrastructure
- Strong knowledge of PostgreSQL, Redis caching, and database query optimization
- Familiarity with CI/CD deployment automation (GitHub Actions)
- Strong understanding of distributed systems, concurrency, and RESTful APIs

Responsibilities:
- Architect and develop high-reliability distributed services with sub-second latency
- Collaborate with engineering and product leaders to design resilient payment flows
- Champion automated unit testing, code quality, and DevOps best practices
"""

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_master_template_generation_and_parsing(tmp_path):
    test_docx = tmp_path / "test_master.docx"
    create_master_resume(test_docx)
    assert test_docx.exists()

    engine = DocxEngine(test_docx)
    cand = engine.extract_candidate_info()
    assert cand["name"] == "Alex Morgan"
    assert "email" in cand and "alex.morgan.dev@email.com" in cand["email"]

    sections = engine.extract_sections()
    assert "Professional Summary" in sections or "Heading" in sections
    assert "Technical Skills" in sections or any("skill" in s.lower() for s in sections)

def test_ats_scorer_simulation():
    engine = DocxEngine(settings.DEFAULT_TEMPLATE_PATH)
    resume_text = engine.extract_full_text()
    sections = engine.extract_sections()

    analysis = AtsScorer.analyze(resume_text, SAMPLE_JD, sections)
    assert "score" in analysis
    assert 40 <= analysis["score"] <= 95
    assert len(analysis["matched_keywords"]) > 0
    assert "disclaimer" in analysis
    assert "Estimated Job-Description Compatibility Score" in analysis["disclaimer"]

def test_ai_jd_parsing():
    parsed = AiService.parse_job_description(SAMPLE_JD)
    assert "Stripe" in parsed.get("company_name", "") or "Target" in parsed.get("company_name", "")
    assert "Engineer" in parsed.get("job_title", "")
    assert len(parsed.get("required_skills", [])) > 0
    assert len(parsed.get("ats_keywords", [])) > 0

def test_docx_formatting_preservation(tmp_path):
    """
    STRICT FORMATTING PRESERVATION TEST:
    Verify that applying modifications to a DOCX preserves:
    - Page margins and letter size
    - Document style definitions
    - Section structure
    - Run formatting properties
    """
    master_path = settings.DEFAULT_TEMPLATE_PATH
    output_docx = tmp_path / "customized_resume.docx"

    master_engine = DocxEngine(master_path)
    sections = master_engine.extract_sections()

    summary_item = None
    for sec_name, items in sections.items():
        if "summary" in sec_name.lower():
            for it in items:
                if len(it["text"]) > 60:
                    summary_item = it
                    break

    assert summary_item is not None

    mods = [{
        "id": summary_item["id"],
        "section": "Professional Summary",
        "original_text": summary_item["text"],
        "replacement_text": "Experienced Senior Full Stack Engineer specialized in Python, FastAPI, React, and AWS microservices for Stripe payments platform.",
        "accepted": True
    }]

    applied_count, warnings, metrics = master_engine.apply_modifications(mods, output_docx)
    assert applied_count == 1
    assert output_docx.exists()

    val_report = FormattingValidator.validate(master_path, output_docx)
    assert val_report["is_valid"] is True
    assert val_report["violations_count"] == 0
    assert len(val_report["passed_checks"]) >= 3

def test_api_endpoints_workflow():
    db = SessionLocal()
    try:
        # 1. Template info
        tmpl_res = get_template_info()
        assert tmpl_res["status"] == "success"
        assert "candidate" in tmpl_res
        assert tmpl_res["candidate"]["name"] in ["Logeshwaran N", "Alex Morgan"]

        # 2. Parse JD
        jd_req = JobDescriptionRequest(job_description=SAMPLE_JD)
        parse_res = parse_job_description(jd_req)
        assert parse_res["status"] == "success"
        assert "job_title" in parse_res["data"]

        # 3. Analyze master resume
        analyze_res = analyze_master_resume(jd_req)
        assert analyze_res["status"] == "success"
        assert "score" in analyze_res["analysis"]
        orig_score = analyze_res["analysis"]["score"]

        # 4. Optimize proposals
        opt_req = OptimizeResumeRequest(job_description=SAMPLE_JD, job_data=parse_res["data"])
        opt_res = optimize_resume(opt_req)
        assert opt_res["status"] == "success"
        assert len(opt_res["proposals"]) > 0

        first_proposal = opt_res["proposals"][0]
        mod_item = ModificationItem(
            id=first_proposal.get("id"),
            section=first_proposal.get("section", "Professional Summary"),
            original_text=first_proposal.get("original_text"),
            replacement_text=first_proposal.get("replacement_text"),
            reason=first_proposal.get("reason"),
            keywords_added=first_proposal.get("keywords_added", []),
            accepted=True
        )

        # 5. Generate customized resume
        gen_req = GenerateResumeRequest(
            job_description=SAMPLE_JD,
            company_name="Stripe",
            job_title="Senior Full Stack Engineer",
            candidate_name="Alex Morgan",
            approved_modifications=[mod_item]
        )
        gen_res = generate_customized_resume(gen_req, db=db)
        assert gen_res["status"] == "success"
        assert gen_res["formatting_validation"]["is_valid"] is True
        assert gen_res["applied_modifications_count"] >= 1
        history_id = gen_res["history_id"]

        # 6. Check history list
        hist_res = get_resume_history(db=db)
        assert hist_res["status"] == "success"
        assert hist_res["total"] >= 1

    finally:
        db.close()
