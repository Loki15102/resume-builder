# AI-Powered ATS Resume Builder

> **Production-ready, layout-preserving resume customizer that tailors your master DOCX resume to any job description using surgical XML-level run editing — guaranteeing 100% template formatting preservation.**

---

## 🌟 Overview & Core Objective

The **AI-Powered ATS Resume Builder** is an intelligent web application designed to optimize existing professional resumes against job descriptions from platforms like **LinkedIn, Indeed, Naukri, Foundit, and company career portals**.

Unlike traditional resume builders that destroy templates, convert HTML to DOCX, or recreate documents with generic designs, this system uses **Office Open XML (OOXML) run-level editing** to replace only textual elements while strictly locking:
- Template design & layout geometry
- Font families (Calibri/Arial), font sizes, and color palettes
- Section headings and custom bottom borders
- Bold/italic emphasis spans
- Native bullet list indentations (`<w:numPr>`)
- Table grid structures and cell paddings
- Page margins (0.55 in) and letter dimensions

---

## 🚀 Key Features

### 1. Master Resume Protection
- Predefined master resume stored in `.docx` format (`backend/storage/templates/master_resume.docx`).
- Serves as the single source of truth for all professional accomplishments.
- Fully replaceable via the Dashboard or Settings modal with instant XML structure validation.
- **Strict safety protocol**: Master template is always cloned before editing and is **never** overwritten during resume generation.

### 2. Intelligent Job Description Parsing
- Accepts raw job posting text pasted from LinkedIn, Indeed, Naukri, or career portals.
- Automatically extracts:
  - Job Title & Target Company Name
  - Required Experience level
  - Core Technical Skills & Frameworks
  - Preferred Competencies & Tools
  - Roles & Responsibilities
  - High-priority ATS indexing keywords

### 3. Factual Authenticity Guardrails
- **No Hallucinations**: Strict system prompts prevent the generation of fake employers, unverified certifications, exaggerated degrees, or synthetic employment dates.
- Reframes existing accomplishments using action verbs (STAR methodology) and highlights matching skills already in the candidate's background.

### 4. Strict XML Formatting Preservation
- Direct OpenXML run-level manipulation (`python-docx` + `lxml`).
- Handles text split across multiple `<w:r>` runs within a single sentence or bullet point.
- Preserves distinct bold prefixes (e.g., `Programming Languages: `) while updating values.
- Automated formatting validator inspects:
  - `styles.xml` consistency
  - Margin metrics & page dimensions
  - Table grid dimensions & cell count
  - XML archive structure

### 5. ATS Compatibility Scorer
- Pre-optimization vs. Post-optimization match score comparison (e.g., `58%` -> `94%`, `+36% boost`).
- Breakdown:
  - Matched keywords (with occurrence frequencies)
  - Missing keywords & skill gaps (highlighted separately without inventing fake skills)
  - Required skills match percentage
  - Experience seniority relevance
  - STAR action verb density
- Clearly labeled with standard ATS simulation disclaimer.

### 6. Interactive Side-by-Side Review & Comparison
- Section-by-section diff view (Summary, Technical Skills, Professional Experience, Projects).
- Individual control over every modification:
  - **Accept** (green check)
  - **Reject** (red cross)
  - **Inline Edit** (customize wording directly before building)
- Character length difference and layout overflow warning indicators.

### 7. Dual Format Download
- Primary format: **DOCX** with standard ATS filename:
  `CandidateName_CompanyName_JobTitle_Resume.docx`
- Direct **PDF** export generated directly from the finalized DOCX OpenXML.

### 8. Bento Grid Dashboard
- Modern, responsive React dashboard styled with Tailwind CSS, Lucide icons, and light/dark theme toggling.
- Complete resume history drawer with download, reload, and delete capabilities.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Framer Motion |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Document Processing** | `python-docx`, `lxml`, Office Open XML (OOXML) |
| **PDF Conversion** | Microsoft Word COM automation / LibreOffice headless / python fallback |
| **Database** | SQLite via SQLAlchemy 2.0 |
| **AI Integration** | Google Gemini API (`gemini-2.5-flash`), OpenAI API (`gpt-4o-mini`), Deterministic Local Heuristics |
| **Testing** | PyTest (automated formatting preservation & endpoint verification) |

---

## 📂 Project Architecture

```
resume-builder/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py         # REST API routes (upload, parse, analyze, optimize, generate, history)
│   │   ├── core/
│   │   │   └── config.py            # Environment, file paths, and layout threshold configuration
│   │   ├── models/
│   │   │   └── database.py          # SQLite SQLAlchemy models (ResumeHistory, AppSetting)
│   │   ├── services/
│   │   │   ├── docx_engine.py       # OOXML in-place run replacement & layout engine
│   │   │   ├── ats_scorer.py        # ATS compatibility scoring & keyword gap analysis
│   │   │   ├── ai_service.py        # Gemini / OpenAI / Heuristic resume customization
│   │   │   ├── formatting_validator.py # XML & geometry regression validator
│   │   │   ├── pdf_converter.py     # DOCX-to-PDF export pipeline
│   │   │   └── template_generator.py# Default professional master resume generator
│   │   └── main.py                  # FastAPI application entry point & CORS
│   ├── storage/
│   │   ├── templates/               # Master resume DOCX templates
│   │   ├── resumes/                 # Generated customized DOCX and PDF files
│   │   └── resume_builder.db        # SQLite database
│   ├── tests/
│   │   ├── test_backend.py          # Automated tests for ATS, API, & format preservation
│   │   └── test_complex_docx.py     # Tests for tables, multi-run sentences, & list bullets
│   └── requirements.txt             # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Brand, mode toggle, history & settings triggers
│   │   │   ├── MasterResumeCard.tsx # Master template info & DOCX uploader
│   │   │   ├── JobDescriptionCard.tsx# Raw JD input with sample loaders
│   │   │   ├── JobRequirementsCard.tsx# Extracted role, company, & core skills
│   │   │   ├── AtsScoreCard.tsx     # Dual ATS score display & progress metrics
│   │   │   ├── KeywordAnalysisCard.tsx# Matched tags & missing skill gap alerts
│   │   │   ├── ResumeComparisonCard.tsx# Interactive diff cards with Accept/Reject/Edit
│   │   │   ├── DocumentPreviewCard.tsx# High-fidelity DOCX layout visual simulation
│   │   │   ├── DownloadCenterCard.tsx # Standardized DOCX & PDF download buttons
│   │   │   ├── HistoryDrawer.tsx    # Slide-over past resumes manager
│   │   │   └── SettingsModal.tsx    # AI Provider & threshold configuration
│   │   ├── services/
│   │   │   └── api.ts               # Type-safe API client
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript interfaces
│   │   ├── App.tsx                  # Bento Grid orchestration dashboard
│   │   ├── index.css                # Tailwind CSS v4 styling & theme tokens
│   │   └── main.tsx                 # React DOM mount
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts               # Vite bundler & API proxy configuration
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Repository security exclusions
├── start_backend.bat                # Windows 1-click backend runner
├── start_frontend.bat               # Windows 1-click frontend runner
├── start_backend.ps1                # PowerShell backend runner
├── start_frontend.ps1               # PowerShell frontend runner
└── README.md                        # Documentation
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.10 through 3.14)
- Node.js 18+ & npm

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run automated tests to verify document engine & formatting validator
pytest tests/ -v

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000` (API documentation available at `http://127.0.0.1:8000/docs`).

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies (already pre-configured)
npm install

# Start Vite dev server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Environment Configuration (`.env`)

Create a `.env` file in the root directory (or configure via the Settings UI):

```ini
# AI Provider: "gemini", "openai", or "heuristic" (default offline test mode)
AI_PROVIDER=gemini

# Google Gemini API Key (recommended)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# OpenAI API Key (optional alternative)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Max text length expansion threshold (0.15 = 15%)
MAX_LENGTH_EXPANSION_THRESHOLD=0.15
```

> **Note**: If no API key is supplied, the application automatically runs in **Deterministic Heuristic Mode**, which performs real keyword extraction, STAR action-verb restructuring, and ATS scoring locally without requiring an internet connection.

---

## 📡 API Reference

### Template Management
- `GET /api/template/info`: Inspect current master resume metadata, candidate info, and extracted sections.
- `POST /api/template/upload`: Upload replacement master `.docx` resume with validation.

### Job Description & Optimization
- `POST /api/job/parse`: Extract title, company, skills, and ATS keywords from raw text.
  - Body: `{"job_description": "string"}`
- `POST /api/resume/analyze`: Compute baseline ATS match score and gap analysis.
  - Body: `{"job_description": "string"}`
- `POST /api/resume/optimize`: Generate proposed section-by-section modifications.
  - Body: `{"job_description": "string", "job_data": {...}}`

### Resume Generation & Download
- `POST /api/resume/generate`: Apply approved modifications into a clean DOCX copy, run formatting validator, compute post-optimization ATS score, and save in history.
- `GET /api/resume/download/{history_id}/{format}`: Download generated resume in `docx` or `pdf` with filename `CandidateName_CompanyName_JobTitle_Resume.docx`.

### History & Settings
- `GET /api/history`: List all previously generated resumes.
- `GET /api/history/{id}`: Retrieve detailed record and diff metadata.
- `DELETE /api/history/{id}`: Delete resume and associated files.
- `GET /api/settings`: Retrieve active engine configuration.
- `POST /api/settings`: Update API keys, providers, and layout thresholds.

---

## 🧪 Automated Testing & Formatting Validation

Run the automated test suite anytime with:

```bash
cd backend
$env:PYTHONPATH="."
python -m pytest tests/ -v
```

The test suite covers:
1. `test_master_template_generation_and_parsing`: Verifies OpenXML generation and extraction of sections.
2. `test_ats_scorer_simulation`: Validates keyword matching, seniority analysis, and score calculation.
3. `test_ai_jd_parsing`: Validates job requirement extraction from untrusted JD strings.
4. `test_docx_formatting_preservation`: Strict regression test ensuring font families, margins, styles, and section counts remain identical after text modification.
5. `test_api_endpoints_workflow`: Full end-to-end integration test of the REST API workflow.
6. `test_complex_docx_table_and_mixed_runs`: Stress test for resumes with tables, multi-run text splits, and list bullets.

---

## 🛡️ Security & Privacy

- API keys are never exposed to the frontend browser bundle.
- Untrusted user input in job descriptions is treated as raw data, not instructions (prompt injection mitigation).
- The master resume is locked as read-only during generation; every customized output is generated in an isolated file.
- SQLite database transactions run with isolated session boundaries.
- No resume data or personal information is transmitted to unauthorized external logging services.
