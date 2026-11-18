import os
import sys
import subprocess
import shutil
from pathlib import Path
from typing import Tuple, Optional

class PdfConverter:
    """
    Converts finalized DOCX files to PDF directly from OpenXML
    using native Microsoft Word COM automation (Windows) or LibreOffice headless (Linux/Cross-platform).
    """

    @classmethod
    def _try_libreoffice(cls, docx_path: Path, output_pdf_path: Path) -> bool:
        soffice_binary = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice_binary:
            for p in [Path(r"C:\Program Files\LibreOffice\program\soffice.exe"), Path(r"C:\Program Files (x86)\LibreOffice\program\soffice.exe")]:
                if p.exists():
                    soffice_binary = str(p)
                    break

        if soffice_binary:
            try:
                cmd = [
                    soffice_binary,
                    "--headless",
                    "--convert-to", "pdf",
                    "--outdir", str(output_pdf_path.parent),
                    str(docx_path)
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=8)
                expected_pdf = output_pdf_path.parent / f"{docx_path.stem}.pdf"
                if expected_pdf.exists():
                    if expected_pdf != output_pdf_path:
                        shutil.move(str(expected_pdf), str(output_pdf_path))
                    return True
            except Exception:
                pass
        return False

    @classmethod
    def _try_word_com(cls, docx_path: Path, output_pdf_path: Path) -> bool:
        # Only attempt Word COM if user explicitly enabled it or in interactive desktop session
        if sys.platform != "win32" or os.environ.get("ENABLE_WORD_COM", "0") != "1":
            return False
        try:
            import win32com.client
            import pythoncom
            pythoncom.CoInitialize()
            word = win32com.client.DispatchEx("Word.Application")
            try:
                word.Visible = False
                word.DisplayAlerts = 0
                doc = word.Documents.Open(str(docx_path), ReadOnly=True)
                doc.SaveAs(str(output_pdf_path), FileFormat=17)
                doc.Close(SaveChanges=False)
                return output_pdf_path.exists() and output_pdf_path.stat().st_size > 0
            finally:
                try:
                    word.Quit()
                except Exception:
                    pass
                pythoncom.CoUninitialize()
        except Exception:
            return False

    @classmethod
    def convert_docx_to_pdf(cls, docx_path: Path, output_pdf_path: Path) -> Tuple[bool, Optional[str]]:
        docx_path = Path(docx_path).resolve()
        output_pdf_path = Path(output_pdf_path).resolve()
        output_pdf_path.parent.mkdir(parents=True, exist_ok=True)

        if not docx_path.exists():
            return False, f"Source DOCX file not found: {docx_path}"

        # 1. Try LibreOffice headless
        if cls._try_libreoffice(docx_path, output_pdf_path):
            return True, None

        # 2. Try Word COM (if enabled)
        if cls._try_word_com(docx_path, output_pdf_path):
            return True, None

        return False, "PDF generation requires Microsoft Word or LibreOffice. DOCX format is generated and available for download."
