import sys
from pathlib import Path
import pytest
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.docx_engine import DocxEngine
from app.services.formatting_validator import FormattingValidator

def test_complex_docx_table_and_mixed_runs(tmp_path):
    """
    Test resume with:
    - Tables with nested text
    - Multiple runs in a single sentence
    - Bullet points with bold lead-ins
    - Formatting preservation check
    """
    complex_file = tmp_path / "complex_template.docx"
    doc = Document()

    # 1. Add paragraph with multiple split runs:
    # Run 1: Bold "Lead: "
    # Run 2: Normal "Experienced with "
    # Run 3: Normal "Python FastAPI"
    # Run 4: Normal " and high throughput architectures."
    p1 = doc.add_paragraph()
    r1 = p1.add_run("Core Focus: ")
    r1.bold = True
    r1.font.name = "Arial"
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(10, 20, 30)

    r2 = p1.add_run("Experienced with ")
    r2.font.name = "Arial"
    r2.font.size = Pt(10)

    r3 = p1.add_run("Python FastAPI")
    r3.font.name = "Arial"
    r3.font.size = Pt(10)
    r3.bold = True

    r4 = p1.add_run(" and high-throughput architectures.")
    r4.font.name = "Arial"
    r4.font.size = Pt(10)

    # 2. Add table with 2 rows, 2 columns (common in resumes)
    table = doc.add_table(rows=2, cols=2)
    cell_0_0 = table.cell(0, 0)
    cp = cell_0_0.paragraphs[0]
    cr1 = cp.add_run("Employer: ")
    cr1.bold = True
    cr2 = cp.add_run("Apex Technologies")

    cell_0_1 = table.cell(0, 1)
    cp2 = cell_0_1.paragraphs[0]
    cp2.add_run("2020 - 2024")

    cell_1_0 = table.cell(1, 0)
    cp3 = cell_1_0.paragraphs[0]
    cp3.add_run("Built distributed event streaming engine processing 10k msg/sec.")

    # 3. Add list bullet
    bp = doc.add_paragraph(style='List Bullet')
    br = bp.add_run("Optimized SQL query response time by 60% through custom B-tree indexing.")
    br.font.name = "Arial"

    doc.save(str(complex_file))

    # Test Engine
    engine = DocxEngine(complex_file)
    refs = engine.collect_all_paragraphs()
    assert len(refs) >= 4

    # Test multi-run replacement across runs:
    # Target spans r2 and r3: "with Python FastAPI"
    out_file = tmp_path / "complex_modified.docx"
    mods = [
        {
            "original_text": "Built distributed event streaming engine processing 10k msg/sec.",
            "replacement_text": "Engineered distributed Kafka event streaming engine handling 50k msg/sec with sub-10ms latency.",
            "section": "Experience"
        },
        {
            "original_text": "Optimized SQL query response time by 60% through custom B-tree indexing.",
            "replacement_text": "Optimized PostgreSQL query latency by 65% through custom index partitioning and query plan analysis.",
            "section": "Experience"
        }
    ]

    applied, warnings, metrics = engine.apply_modifications(mods, out_file)
    assert applied == 2

    # Validate formatting strictly
    val = FormattingValidator.validate(complex_file, out_file)
    assert val["is_valid"] is True
    assert val["violations_count"] == 0

    # Verify table geometry is preserved
    mod_doc = Document(str(out_file))
    assert len(mod_doc.tables) == 1
    assert len(mod_doc.tables[0].rows) == 2
    assert len(mod_doc.tables[0].columns) == 2

    # Verify table cell text was updated
    cell_text = mod_doc.tables[0].cell(1, 0).text
    assert "Engineered distributed Kafka event streaming" in cell_text

    # Verify run properties on unmodified table cell (Employer:) still has bold!
    assert mod_doc.tables[0].cell(0, 0).paragraphs[0].runs[0].bold is True
