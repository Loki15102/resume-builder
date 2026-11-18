import os
import re
import copy
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import docx
from docx import Document
from docx.text.paragraph import Paragraph
from docx.text.run import Run
from docx.table import Table, _Cell
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

class DocxElementRef:
    """Represents a reference to a paragraph either in doc body or in a table cell."""
    def __init__(self, element_id: str, section: str, paragraph: Paragraph, location_type: str = "body", table_idx: int = -1, row_idx: int = -1, col_idx: int = -1):
        self.element_id = element_id
        self.section = section
        self.paragraph = paragraph
        self.location_type = location_type
        self.table_idx = table_idx
        self.row_idx = row_idx
        self.col_idx = col_idx

    @property
    def text(self) -> str:
        return self.paragraph.text.strip()


class DocxEngine:
    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)
        if not self.file_path.exists():
            raise FileNotFoundError(f"DOCX file not found: {self.file_path}")
        self.doc = Document(str(self.file_path))

    @staticmethod
    def is_bullet_paragraph(p: Paragraph) -> bool:
        """Check if paragraph is a bullet list or numbered item."""
        style_name = (p.style.name if p.style else "").lower()
        if "bullet" in style_name or "list" in style_name or "number" in style_name:
            return True
        # Check XML numPr
        pPr = p._element.find(qn('w:pPr'))
        if pPr is not None and pPr.find(qn('w:numPr')) is not None:
            return True
        # Check text starts with bullet symbol
        t = p.text.strip()
        if t.startswith(("•", "-", "*", "–", "—")) or re.match(r"^\d+\.", t):
            return True
        return False

    @staticmethod
    def is_heading_paragraph(p: Paragraph) -> bool:
        """Detect section headings based on styles, borders, or uppercase bold patterns."""
        style_name = (p.style.name if p.style else "").lower()
        if "heading" in style_name or "title" in style_name:
            return True
        pPr = p._element.find(qn('w:pPr'))
        if pPr is not None and pPr.find(qn('w:pBdr')) is not None:
            return True
        text = p.text.strip()
        if len(text) < 40 and (text.isupper() or any(r.bold for r in p.runs if len(r.text.strip()) > 3)):
            # Common resume section titles
            keywords = ["summary", "objective", "skills", "experience", "employment", "work history", "projects", "education", "certifications", "achievements", "publications"]
            if any(kw in text.lower() for kw in keywords):
                return True
        return False

    def collect_all_paragraphs(self) -> List[DocxElementRef]:
        """Collect all paragraphs from body and tables in reading order with section detection."""
        refs: List[DocxElementRef] = []
        current_section = "Header"
        p_idx = 0

        # 1. Main body paragraphs
        for i, p in enumerate(self.doc.paragraphs):
            text = p.text.strip()
            if not text:
                continue

            if self.is_heading_paragraph(p):
                current_section = text.title()
                refs.append(DocxElementRef(
                    element_id=f"p_{p_idx}",
                    section="Heading",
                    paragraph=p,
                    location_type="body"
                ))
            else:
                effective_sec = current_section
                if current_section == "Header" and len(text) > 50 and not any(c in text for c in ["@", "linkedin", "|", "github"]):
                    effective_sec = "Professional Summary"

                refs.append(DocxElementRef(
                    element_id=f"p_{p_idx}",
                    section=effective_sec,
                    paragraph=p,
                    location_type="body"
                ))
            p_idx += 1

        # 2. Table paragraphs
        for t_idx, table in enumerate(self.doc.tables):
            for r_idx, row in enumerate(table.rows):
                for c_idx, cell in enumerate(row.cells):
                    for cp in cell.paragraphs:
                        text = cp.text.strip()
                        if not text:
                            continue
                        if self.is_heading_paragraph(cp):
                            current_section = text.title()
                            refs.append(DocxElementRef(
                                element_id=f"t_{t_idx}_{r_idx}_{c_idx}_{p_idx}",
                                section="Heading",
                                paragraph=cp,
                                location_type="table",
                                table_idx=t_idx,
                                row_idx=r_idx,
                                col_idx=c_idx
                            ))
                        else:
                            refs.append(DocxElementRef(
                                element_id=f"t_{t_idx}_{r_idx}_{c_idx}_{p_idx}",
                                section=current_section,
                                paragraph=cp,
                                location_type="table",
                                table_idx=t_idx,
                                row_idx=r_idx,
                                col_idx=c_idx
                            ))
                        p_idx += 1

        return refs

    def extract_full_text(self) -> str:
        """Extract clean text content of entire resume."""
        refs = self.collect_all_paragraphs()
        return "\n".join(r.text for r in refs if r.text)

    def extract_candidate_info(self) -> Dict[str, str]:
        """Extract candidate contact details from header paragraphs."""
        refs = self.collect_all_paragraphs()
        info = {
            "name": "Candidate",
            "title": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": ""
        }

        # First few paragraphs typically contain name & contact
        header_texts = [r.text for r in refs[:5]]
        full_header = " ".join(header_texts)

        # Name: usually the first non-empty paragraph
        for r in refs[:3]:
            t = r.text
            if t and len(t.split()) <= 4 and not any(char in t for char in ["@", "|", "http", "www", "+"]):
                clean_name = t.replace(".", " ").strip()
                info["name"] = clean_name.title()
                break

        # Title: often second line or in summary / job title
        for r in refs[1:10]:
            t = r.text
            if t and t != info["name"] and not any(char in t for char in ["@", "http", "+1", "+91"]):
                if len(t) <= 60 and any(role_word in t.lower() for role_word in ["engineer", "developer", "architect", "lead", "manager", "analyst", "specialist"]):
                    info["title"] = t
                    break
                elif len(t) > 60 and not info["title"]:
                    role_m = re.match(r'^([A-Za-z\s\-\/\+]+?(?:Developer|Engineer|Architect|Lead|Manager))(?:\s+with|\s+having|\s*[,-])', t, re.IGNORECASE)
                    if role_m:
                        info["title"] = role_m.group(1).strip()

        # Location: search for City, Country or State
        loc_patterns = [
            r'\b([A-Za-z\s]+,\s*India)\b',
            r'\b([A-Za-z\s]+,\s*(?:CA|NY|TX|WA|IL|MA|FL|GA|NC|VA|CO))\b',
            r'\b([A-Za-z\s]+,\s*(?:United States|USA|UK|United Kingdom|Singapore|Germany|Canada|Australia))\b'
        ]
        for pat in loc_patterns:
            m = re.search(pat, "\n".join([r.text for r in refs[:10]]))
            if m:
                cand_loc = m.group(1).strip()
                if len(cand_loc) < 35 and not any(w in cand_loc.lower() for w in ["api", "graphql", "jwt", "technologies", "private"]):
                    info["location"] = cand_loc
                    break
        if not info["location"]:
            if "chennai" in "\n".join([r.text for r in refs[:10]]).lower():
                info["location"] = "Chennai, India"

        # Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', full_header)
        if email_match:
            info["email"] = email_match.group(0)

        # Phone
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', full_header)
        if phone_match:
            info["phone"] = phone_match.group(0)

        # LinkedIn
        li_match = re.search(r'linkedin\.com/in/[\w\-]+', full_header)
        if li_match:
            info["linkedin"] = li_match.group(0)

        # GitHub
        gh_match = re.search(r'github\.com/[\w\-]+', full_header)
        if gh_match:
            info["github"] = gh_match.group(0)

        return info

    def extract_sections(self) -> Dict[str, List[Dict[str, Any]]]:
        """Group elements by detected sections."""
        refs = self.collect_all_paragraphs()
        sections: Dict[str, List[Dict[str, Any]]] = {}

        for ref in refs:
            sec = ref.section
            if sec not in sections:
                sections[sec] = []

            sections[sec].append({
                "id": ref.element_id,
                "text": ref.text,
                "is_bullet": self.is_bullet_paragraph(ref.paragraph),
                "is_heading": self.is_heading_paragraph(ref.paragraph),
                "length": len(ref.text),
                "word_count": len(ref.text.split())
            })
        return sections

    @classmethod
    def replace_text_in_paragraph_runs(cls, paragraph: Paragraph, target_text: str, replacement_text: str) -> bool:
        """
        Safely replace target_text with replacement_text inside a paragraph,
        handling text that spans across multiple <w:r> runs while strictly
        preserving run properties (<w:rPr>).
        """
        if not target_text or target_text not in paragraph.text:
            return False

        full_text = "".join(run.text for run in paragraph.runs)
        if target_text not in full_text:
            # Maybe spacing differences
            return False

        # Calculate character offsets for each run
        start_idx = full_text.find(target_text)
        end_idx = start_idx + len(target_text)

        curr_offset = 0
        run_spans: List[Tuple[int, int, Run]] = []
        for run in paragraph.runs:
            run_len = len(run.text)
            run_spans.append((curr_offset, curr_offset + run_len, run))
            curr_offset += run_len

        # Find overlapping runs
        first_modified = False
        for r_start, r_end, run in run_spans:
            # No overlap
            if r_end <= start_idx or r_start >= end_idx:
                continue

            run_text = run.text
            # Overlap segment within this run
            local_start = max(0, start_idx - r_start)
            local_end = min(len(run_text), end_idx - r_start)

            if not first_modified:
                # Place replacement in the first matching run
                new_run_text = run_text[:local_start] + replacement_text + run_text[local_end:]
                run.text = new_run_text
                first_modified = True
            else:
                # Remove matched portion from subsequent overlapping runs
                new_run_text = run_text[:local_start] + run_text[local_end:]
                run.text = new_run_text

        return True

    @classmethod
    def update_paragraph_content_preserving_format(cls, paragraph: Paragraph, new_text: str) -> bool:
        """
        Update the entire paragraph content (such as a bullet point or summary block)
        while strictly preserving paragraph format (<w:pPr>) and the primary run's
        styling (<w:rPr>: font, size, color, bold, italics).
        
        If the paragraph has a distinct bold label prefix (e.g. 'Languages: ' or 'Company | Role: '),
        it preserves that prefix run and updates the body run!
        """
        if not paragraph.runs:
            # Paragraph has no runs, add one with default style
            run = paragraph.add_run(new_text)
            return True

        runs = paragraph.runs
        original_text = "".join(r.text for r in runs).strip()

        # Check for category / prefix pattern: e.g. "Languages: Python, Go" or "Title: Text"
        colon_idx = original_text.find(":")
        if 0 < colon_idx < 35 and ":" in new_text:
            new_colon_idx = new_text.find(":")
            # If original had a bold prefix run before colon
            prefix_orig = original_text[:colon_idx + 1]
            body_orig = original_text[colon_idx + 1:].strip()
            
            prefix_new = new_text[:new_colon_idx + 1]
            body_new = new_text[new_colon_idx + 1:].strip()

            # If run 0 covers the prefix
            if len(runs) >= 2 and runs[0].text.strip() == prefix_orig.strip():
                runs[0].text = prefix_new + " "
                runs[1].text = body_new
                # Clear any extra runs
                for r in runs[2:]:
                    r.text = ""
                return True

        # Standard paragraph or bullet point replacement:
        # Keep run 0, clone its XML rPr if needed, update its text, clear subsequent runs
        primary_run = runs[0]
        primary_run.text = new_text
        for r in runs[1:]:
            r.text = ""

        return True

    def apply_modifications(
        self,
        modifications: List[Dict[str, Any]],
        output_path: Path
    ) -> Tuple[int, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Create a new copy of the document and apply approved modifications.
        Never overwrites the master document.
        
        modifications item schema:
        {
            "id": "p_5",  # or original_text match
            "original_text": "...",
            "replacement_text": "...",
            "section": "Professional Summary"
        }
        
        Returns:
            (applied_count, warnings_list, layout_metrics)
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Clone master document directly by saving copy to output_path and opening copy
        shutil.copy2(str(self.file_path), str(output_path))
        new_doc = Document(str(output_path))

        applied_count = 0
        warnings: List[Dict[str, Any]] = []
        total_orig_chars = 0
        total_new_chars = 0

        # Collect paragraphs in the cloned document
        all_paragraphs: List[Paragraph] = []
        for p in new_doc.paragraphs:
            if p.text.strip():
                all_paragraphs.append(p)
        for t in new_doc.tables:
            for row in t.rows:
                for cell in row.cells:
                    for cp in cell.paragraphs:
                        if cp.text.strip():
                            all_paragraphs.append(cp)

        # Apply each modification
        for mod in modifications:
            orig = mod.get("original_text", "").strip()
            repl = mod.get("replacement_text", "").strip()
            if not orig or not repl or orig == repl:
                continue

            orig_len = len(orig)
            repl_len = len(repl)
            total_orig_chars += orig_len
            total_new_chars += repl_len

            # Check length expansion warning
            expansion_ratio = (repl_len - orig_len) / max(orig_len, 1)
            if expansion_ratio > 0.20 and (repl_len - orig_len) > 40:
                warnings.append({
                    "section": mod.get("section", "General"),
                    "type": "LENGTH_EXPANSION",
                    "message": f"Content expanded by {int(expansion_ratio * 100)}% (+{repl_len - orig_len} chars). May affect page boundaries.",
                    "original_length": orig_len,
                    "new_length": repl_len,
                    "original_text": orig[:60] + "...",
                    "replacement_text": repl[:60] + "..."
                })

            # Find matching paragraph in document
            matched = False

            # Exact match first
            for p in all_paragraphs:
                p_text = p.text.strip()
                if p_text == orig:
                    self.update_paragraph_content_preserving_format(p, repl)
                    applied_count += 1
                    matched = True
                    break
            
            # Substring match if not full paragraph match
            if not matched:
                for p in all_paragraphs:
                    if orig in p.text:
                        success = self.replace_text_in_paragraph_runs(p, orig, repl)
                        if success:
                            applied_count += 1
                            matched = True
                            break

            # Fuzzy match (e.g. whitespace or minor punctuation differences)
            if not matched:
                norm_orig = re.sub(r'\s+', ' ', orig)
                for p in all_paragraphs:
                    norm_p = re.sub(r'\s+', ' ', p.text.strip())
                    if norm_orig in norm_p or norm_p == norm_orig:
                        self.update_paragraph_content_preserving_format(p, repl)
                        applied_count += 1
                        matched = True
                        break

        # Save finalized copy
        new_doc.save(str(output_path))

        net_expansion = (total_new_chars - total_orig_chars) / max(total_orig_chars, 1) if total_orig_chars > 0 else 0.0
        layout_metrics = {
            "total_modifications_requested": len(modifications),
            "total_modifications_applied": applied_count,
            "original_characters": total_orig_chars,
            "optimized_characters": total_new_chars,
            "character_delta": total_new_chars - total_orig_chars,
            "net_expansion_percent": round(net_expansion * 100, 1),
            "layout_overflow_risk": "Low" if net_expansion < 0.10 else ("Medium" if net_expansion < 0.20 else "High")
        }

        return applied_count, warnings, layout_metrics

    def generate_html_preview(self) -> Dict[str, Any]:
        """
        Generate structured HTML/CSS preview representation from DOCX elements
        to display inside the web application with 100% visual fidelity matching
        Microsoft Word (Cambria, borders, tabs, exact colors, and run properties).
        """
        sections_data = self.extract_sections()
        candidate = self.extract_candidate_info()

        # Detect document font
        doc_font = "Cambria, Georgia, serif"
        for p in self.doc.paragraphs[:10]:
            for r in p.runs:
                if r.font.name:
                    doc_font = f"{r.font.name}, serif"
                    break
            if doc_font != "Cambria, Georgia, serif":
                break

        elements = []
        for p in self.doc.paragraphs:
            text = p.text.strip()
            pPr = p._element.pPr
            bdr_el = pPr.find(qn('w:pBdr')) if pPr is not None else None
            has_bottom_border = False
            border_color = "#000000"
            if bdr_el is not None:
                bottom_el = bdr_el.find(qn('w:bottom'))
                if bottom_el is not None:
                    has_bottom_border = True
                    col_val = bottom_el.get(qn('w:color'))
                    if col_val and col_val != "auto":
                        border_color = f"#{col_val}"

            # Check if empty divider line (like P2 under contact line)
            if not text:
                if has_bottom_border:
                    elements.append({
                        "type": "divider",
                        "text": "",
                        "border_color": border_color or "#000000",
                        "runs": [],
                        "page_number": 1
                    })
                continue

            is_bullet = self.is_bullet_paragraph(p)
            is_heading = has_bottom_border or self.is_heading_paragraph(p)
            has_tab = '\t' in p.text

            # Parse alignment
            align_str = "left"
            if p.alignment == docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER or (pPr is not None and pPr.find(qn('w:jc')) is not None and pPr.find(qn('w:jc')).get(qn('w:val')) == 'center'):
                align_str = "center"
            elif p.alignment == docx.enum.text.WD_ALIGN_PARAGRAPH.JUSTIFY or (pPr is not None and pPr.find(qn('w:jc')) is not None and pPr.find(qn('w:jc')).get(qn('w:val')) in ['both', 'justify']):
                align_str = "justify"
            elif p.alignment == docx.enum.text.WD_ALIGN_PARAGRAPH.RIGHT or (pPr is not None and pPr.find(qn('w:jc')) is not None and pPr.find(qn('w:jc')).get(qn('w:val')) == 'right'):
                align_str = "right"

            # Parse runs with full style fidelity
            runs_data = []
            for r in p.runs:
                if r.text:
                    r_color = None
                    if r.font.color and r.font.color.rgb:
                        r_color = f"#{str(r.font.color.rgb)}"
                    else:
                        # Check themeColor in XML
                        rPr = r._element.rPr
                        if rPr is not None:
                            color_node = rPr.find(qn('w:color'))
                            if color_node is not None:
                                cval = color_node.get(qn('w:val'))
                                if cval and cval != "auto":
                                    r_color = f"#{cval}"

                    runs_data.append({
                        "text": r.text,
                        "bold": bool(r.bold),
                        "italic": bool(r.italic),
                        "underline": bool(r.underline),
                        "color": r_color,
                        "size_pt": r.font.size.pt if r.font.size else None,
                        "font_name": r.font.name or "Cambria"
                    })

            # Spacing
            space_before_pt = 0.0
            space_after_pt = 0.0
            if pPr is not None:
                sp_node = pPr.find(qn('w:spacing'))
                if sp_node is not None:
                    b_val = sp_node.get(qn('w:before'))
                    if b_val:
                        try:
                            space_before_pt = round(int(b_val) / 20.0, 1)
                        except ValueError:
                            pass
                    a_val = sp_node.get(qn('w:after'))
                    if a_val:
                        try:
                            space_after_pt = round(int(a_val) / 20.0, 1)
                        except ValueError:
                            pass

            page_num = 1 if len(elements) <= 26 else 2

            # Tabbed row (e.g. Company on left, Date on right)
            if has_tab and not is_bullet:
                parts = [s for s in p.text.split('\t') if s.strip()]
                tab_l = parts[0].strip() if parts else ""
                tab_r = parts[-1].strip() if len(parts) > 1 else ""

                left_run = next((r for r in runs_data if r["text"].strip()), None)
                right_run = next((r for r in reversed(runs_data) if r["text"].strip()), None)

                tab_l_bold = left_run["bold"] if left_run is not None else True
                tab_r_bold = right_run["bold"] if right_run is not None else True
                tab_l_sz = left_run["size_pt"] if left_run and left_run["size_pt"] else 11.0
                tab_r_sz = right_run["size_pt"] if right_run and right_run["size_pt"] else 11.0

                elements.append({
                    "type": "tabbed_row",
                    "text": text,
                    "tab_left": tab_l,
                    "tab_right": tab_r,
                    "tab_left_bold": tab_l_bold,
                    "tab_right_bold": tab_r_bold,
                    "tab_left_size": tab_l_sz,
                    "tab_right_size": tab_r_sz,
                    "runs": runs_data,
                    "alignment": align_str,
                    "has_bottom_border": has_bottom_border,
                    "border_color": border_color,
                    "space_before_pt": space_before_pt,
                    "space_after_pt": space_after_pt,
                    "page_number": page_num
                })
            elif is_heading:
                # Heading element (e.g. PROFESSIONAL EXPERIENCE, SKILLS)
                # Headings always have a single bottom underline border in this template
                elements.append({
                    "type": "heading",
                    "text": text,
                    "runs": runs_data,
                    "alignment": align_str,
                    "has_bottom_border": True,
                    "border_color": border_color or "#000000",
                    "heading_color": "#365F91",
                    "space_before_pt": space_before_pt or 8.0,
                    "space_after_pt": space_after_pt,
                    "page_number": page_num
                })
            elif is_bullet:
                # Bullet element
                elements.append({
                    "type": "bullet",
                    "text": text,
                    "runs": runs_data,
                    "alignment": align_str,
                    "space_before_pt": space_before_pt,
                    "space_after_pt": space_after_pt,
                    "page_number": page_num
                })
            else:
                # Standard paragraph
                elements.append({
                    "type": "paragraph",
                    "text": text,
                    "runs": runs_data,
                    "alignment": align_str,
                    "has_bottom_border": has_bottom_border,
                    "border_color": border_color,
                    "space_before_pt": space_before_pt,
                    "space_after_pt": space_after_pt,
                    "page_number": page_num
                })

        return {
            "candidate": candidate,
            "sections": sections_data,
            "doc_font": doc_font,
            "elements": elements
        }
