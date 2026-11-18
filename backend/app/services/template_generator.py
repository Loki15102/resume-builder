from pathlib import Path
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    """Set inner padding for table cells."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_heading_with_border(doc, text: str, color_hex="1E3A8A"):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text.upper())
    run.font.name = "Calibri"
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(30, 58, 138)  # #1E3A8A Navy
    
    # Add subtle bottom border to heading paragraph
    pPr = p._element.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>\n'
        f'  <w:bottom w:val="single" w:sz="6" w:space="2" w:color="{color_hex}"/>\n'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)
    return p

def create_master_resume(destination_path: Path) -> Path:
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()

    # Set 0.5-0.6 inch margins for professional compact standard layout
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.55)
        section.right_margin = Inches(0.55)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # 1. Candidate Name Header
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_p.paragraph_format.space_before = Pt(0)
    name_p.paragraph_format.space_after = Pt(1)
    name_run = name_p.add_run("ALEX MORGAN")
    name_run.font.name = "Calibri"
    name_run.font.size = Pt(20)
    name_run.font.bold = True
    name_run.font.color.rgb = RGBColor(15, 23, 42)  # #0F172A

    # Subtitle / Role
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(3)
    title_run = title_p.add_run("SENIOR FULL STACK SOFTWARE ENGINEER")
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(11)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(30, 58, 138)

    # Contact line
    contact_p = doc.add_paragraph()
    contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact_p.paragraph_format.space_before = Pt(0)
    contact_p.paragraph_format.space_after = Pt(6)
    contact_run = contact_p.add_run("San Francisco, CA | +1 (555) 382-9102 | alex.morgan.dev@email.com | linkedin.com/in/alexmorgan | github.com/alexmorgan")
    contact_run.font.name = "Calibri"
    contact_run.font.size = Pt(9.5)
    contact_run.font.color.rgb = RGBColor(71, 85, 105)

    # 2. Professional Summary
    add_heading_with_border(doc, "Professional Summary")
    summary_p = doc.add_paragraph()
    summary_p.paragraph_format.space_before = Pt(2)
    summary_p.paragraph_format.space_after = Pt(4)
    summary_p.paragraph_format.line_spacing = 1.15
    s_run = summary_p.add_run(
        "Results-driven Senior Software Engineer with over 7 years of hands-on experience designing, developing, and deploying scalable distributed systems, cloud-native microservices, and modern web applications. Proven track record of spearheading cross-functional engineering teams, optimizing application performance by up to 40%, and delivering high-availability backend platforms supporting millions of active users. Passionate about software craftsmanship, clean architecture, and continuous integration."
    )
    s_run.font.name = "Calibri"
    s_run.font.size = Pt(10)
    s_run.font.color.rgb = RGBColor(30, 41, 59)

    # 3. Technical Skills
    add_heading_with_border(doc, "Technical Skills")
    skills = [
        ("Programming Languages: ", "Python (FastAPI, Django), TypeScript, JavaScript (ES6+), Go, SQL, HTML5/CSS3"),
        ("Frontend Technologies: ", "React.js, Next.js, Redux Toolkit, Tailwind CSS, Webpack, Responsive Design, RESTful Integration"),
        ("Backend & Frameworks: ", "FastAPI, Node.js, Express.js, Microservices Architecture, GraphQL, Celery, gRPC"),
        ("Cloud & DevOps: ", "AWS (EC2, S3, Lambda, ECS, RDS), Docker, Kubernetes, Terraform, CI/CD (GitHub Actions, Jenkins)"),
        ("Databases & Caching: ", "PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Query Optimization, Database Indexing"),
        ("Developer Tools & Methodologies: ", "Git, Linux/Unix, Agile/Scrum, JIRA, Unit Testing (PyTest, Jest), TDD, System Design")
    ]
    for category, skill_list in skills:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.left_indent = Inches(0.15)
        
        run_cat = p.add_run(category)
        run_cat.font.name = "Calibri"
        run_cat.font.size = Pt(9.5)
        run_cat.font.bold = True
        run_cat.font.color.rgb = RGBColor(15, 23, 42)
        
        run_val = p.add_run(skill_list)
        run_val.font.name = "Calibri"
        run_val.font.size = Pt(9.5)
        run_val.font.color.rgb = RGBColor(51, 65, 85)

    # 4. Professional Experience
    add_heading_with_border(doc, "Professional Experience")
    
    # Job 1
    job1_header = doc.add_paragraph()
    job1_header.paragraph_format.space_before = Pt(4)
    job1_header.paragraph_format.space_after = Pt(1)
    j1_title = job1_header.add_run("Senior Full Stack Engineer | CloudNova Solutions Inc.")
    j1_title.font.name = "Calibri"
    j1_title.font.size = Pt(10.5)
    j1_title.font.bold = True
    j1_title.font.color.rgb = RGBColor(15, 23, 42)
    
    job1_sub = doc.add_paragraph()
    job1_sub.paragraph_format.space_before = Pt(0)
    job1_sub.paragraph_format.space_after = Pt(2)
    j1_meta = job1_sub.add_run("San Francisco, CA | March 2022 - Present")
    j1_meta.font.name = "Calibri"
    j1_meta.font.size = Pt(9.0)
    j1_meta.font.italic = True
    j1_meta.font.color.rgb = RGBColor(100, 116, 139)

    bullets_job1 = [
        "Architected and deployed enterprise microservices using Python FastAPI and React, boosting platform throughput by 45% and reducing latency by 35%.",
        "Spearheaded cloud migration of 12 legacy services to AWS ECS and Kubernetes, achieving 99.98% service uptime and saving $75,000 in annual infrastructure costs.",
        "Engineered automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing production deployment release cycles from 3 hours to under 15 minutes.",
        "Mentored a team of 6 software engineers in software design patterns, code review best practices, and automated testing, elevating test coverage to 92%."
    ]
    for b in bullets_job1:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(1)
        bp.paragraph_format.space_after = Pt(1)
        bp.paragraph_format.line_spacing = 1.15
        brun = bp.add_run(b)
        brun.font.name = "Calibri"
        brun.font.size = Pt(9.5)
        brun.font.color.rgb = RGBColor(51, 65, 85)

    # Job 2
    job2_header = doc.add_paragraph()
    job2_header.paragraph_format.space_before = Pt(5)
    job2_header.paragraph_format.space_after = Pt(1)
    j2_title = job2_header.add_run("Software Engineer | Apex Systems & Analytics")
    j2_title.font.name = "Calibri"
    j2_title.font.size = Pt(10.5)
    j2_title.font.bold = True
    j2_title.font.color.rgb = RGBColor(15, 23, 42)
    
    job2_sub = doc.add_paragraph()
    job2_sub.paragraph_format.space_before = Pt(0)
    job2_sub.paragraph_format.space_after = Pt(2)
    j2_meta = job2_sub.add_run("San Jose, CA | June 2019 - February 2022")
    j2_meta.font.name = "Calibri"
    j2_meta.font.size = Pt(9.0)
    j2_meta.font.italic = True
    j2_meta.font.color.rgb = RGBColor(100, 116, 139)

    bullets_job2 = [
        "Developed responsive frontend modules in React.js and TypeScript connected to Python RESTful APIs, improving page load speed by 38%.",
        "Designed and optimized PostgreSQL and Redis database schemas, handling over 2 million daily queries with sub-50ms response times.",
        "Collaborated with product management and UX teams to build self-service user analytics dashboards, driving a 25% increase in user retention.",
        "Implemented secure JWT authentication, role-based access control (RBAC), and automated vulnerability scans, ensuring compliance with SOC-2 standards."
    ]
    for b in bullets_job2:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(1)
        bp.paragraph_format.space_after = Pt(1)
        bp.paragraph_format.line_spacing = 1.15
        brun = bp.add_run(b)
        brun.font.name = "Calibri"
        brun.font.size = Pt(9.5)
        brun.font.color.rgb = RGBColor(51, 65, 85)

    # 5. Key Projects
    add_heading_with_border(doc, "Key Projects")
    
    proj1_p = doc.add_paragraph()
    proj1_p.paragraph_format.space_before = Pt(3)
    proj1_p.paragraph_format.space_after = Pt(1)
    p1_name = proj1_p.add_run("Real-Time Data Streaming & Analytics Platform | ")
    p1_name.font.name = "Calibri"
    p1_name.font.size = Pt(10)
    p1_name.font.bold = True
    p1_name.font.color.rgb = RGBColor(15, 23, 42)
    p1_tech = proj1_p.add_run("Python, Kafka, Redis, Docker, React, AWS")
    p1_tech.font.name = "Calibri"
    p1_tech.font.size = Pt(9.0)
    p1_tech.font.italic = True
    p1_tech.font.color.rgb = RGBColor(71, 85, 105)

    p1_b = doc.add_paragraph(style='List Bullet')
    p1_b.paragraph_format.space_before = Pt(1)
    p1_b.paragraph_format.space_after = Pt(1)
    p1_brun = p1_b.add_run("Engineered an event-driven streaming pipeline processing 50,000+ events per second with Redis caching and real-time WebSocket visualizations.")
    p1_brun.font.name = "Calibri"
    p1_brun.font.size = Pt(9.5)
    p1_brun.font.color.rgb = RGBColor(51, 65, 85)

    proj2_p = doc.add_paragraph()
    proj2_p.paragraph_format.space_before = Pt(3)
    proj2_p.paragraph_format.space_after = Pt(1)
    p2_name = proj2_p.add_run("Enterprise Document Search Engine | ")
    p2_name.font.name = "Calibri"
    p2_name.font.size = Pt(10)
    p2_name.font.bold = True
    p2_name.font.color.rgb = RGBColor(15, 23, 42)
    p2_tech = proj2_p.add_run("FastAPI, Elasticsearch, PostgreSQL, Next.js")
    p2_tech.font.name = "Calibri"
    p2_tech.font.size = Pt(9.0)
    p2_tech.font.italic = True
    p2_tech.font.color.rgb = RGBColor(71, 85, 105)

    p2_b = doc.add_paragraph(style='List Bullet')
    p2_b.paragraph_format.space_before = Pt(1)
    p2_b.paragraph_format.space_after = Pt(1)
    p2_brun = p2_b.add_run("Built an inverted-index full-text search microservice indexing 1M+ PDF documents with fuzzy search, autocomplete, and sub-second retrieval.")
    p2_brun.font.name = "Calibri"
    p2_brun.font.size = Pt(9.5)
    p2_brun.font.color.rgb = RGBColor(51, 65, 85)

    # 6. Education & Certifications
    add_heading_with_border(doc, "Education & Certifications")
    
    edu_p = doc.add_paragraph()
    edu_p.paragraph_format.space_before = Pt(3)
    edu_p.paragraph_format.space_after = Pt(1)
    edu_run = edu_p.add_run("Bachelor of Science in Computer Science | University of California, Berkeley (2015 - 2019)")
    edu_run.font.name = "Calibri"
    edu_run.font.size = Pt(9.5)
    edu_run.font.bold = True
    edu_run.font.color.rgb = RGBColor(15, 23, 42)

    cert_p = doc.add_paragraph()
    cert_p.paragraph_format.space_before = Pt(1)
    cert_p.paragraph_format.space_after = Pt(2)
    cert_run = cert_p.add_run("Certifications: AWS Certified Solutions Architect (Associate) | Certified Kubernetes Application Developer (CKAD)")
    cert_run.font.name = "Calibri"
    cert_run.font.size = Pt(9.5)
    cert_run.font.color.rgb = RGBColor(51, 65, 85)

    doc.save(str(destination_path))
    return destination_path

if __name__ == "__main__":
    from app.core.config import settings
    create_master_resume(settings.DEFAULT_TEMPLATE_PATH)
    print(f"Master resume created at {settings.DEFAULT_TEMPLATE_PATH}")
