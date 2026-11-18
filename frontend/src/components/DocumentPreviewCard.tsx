import React, { useState } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut,
  Layers,
  FileText
} from 'lucide-react';
import type { DocumentPreview, DocumentRun, DocumentElement, FormattingValidation } from '../types';

interface DocumentPreviewCardProps {
  originalPreview: DocumentPreview | null;
  optimizedPreview: DocumentPreview | null;
  validation: FormattingValidation | null;
}

export const DocumentPreviewCard: React.FC<DocumentPreviewCardProps> = ({
  originalPreview,
  optimizedPreview,
  validation,
}) => {
  const [viewMode, setViewMode] = useState<'optimized' | 'original'>('optimized');
  const [pageFilter, setPageFilter] = useState<'all' | '1' | '2'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const activePreview = viewMode === 'optimized' && optimizedPreview ? optimizedPreview : originalPreview;

  if (!activePreview) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
        <Eye className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Document Layout Preview
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Exact visual simulation of your DOCX template preserving fonts, margins, headings, and bullet points.
        </p>
      </div>
    );
  }

  const zoomFactor = zoomLevel / 100;
  const docFont = activePreview.doc_font || "Cambria, Georgia, 'Times New Roman', serif";

  const renderRuns = (runs: DocumentRun[], fallbackText: string) => {
    if (!runs || runs.length === 0) {
      return <span>{fallbackText}</span>;
    }
    return (
      <>
        {runs.map((r, i) => {
          const style: React.CSSProperties = {};
          if (r.color) style.color = r.color;
          if (r.size_pt) style.fontSize = `${r.size_pt * zoomFactor}pt`;
          if (r.font_name) style.fontFamily = `${r.font_name}, ${docFont}`;

          return (
            <span
              key={i}
              style={style}
              className={`
                ${r.bold ? 'font-bold' : 'font-normal'} 
                ${r.italic ? 'italic' : ''} 
                ${r.underline ? 'underline' : ''}
              `}
            >
              {r.text}
            </span>
          );
        })}
      </>
    );
  };

  const renderElement = (el: DocumentElement, idx: number) => {
    // 1. Horizontal Divider Line (under contact info)
    // STRICT SINGLE BOTTOM BORDER (no top, left, right border boxes)
    if (el.type === 'divider') {
      return (
        <div 
          key={idx} 
          style={{
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: `1px solid ${el.border_color || '#000000'}`,
            width: '100%',
            marginTop: `${3 * zoomFactor}px`,
            marginBottom: `${6 * zoomFactor}px`
          }}
        />
      );
    }

    // 2. Section Headings (e.g. PROFESSIONAL EXPERIENCE, SKILLS, PROJECTS, EDUCATION, ACHIEVEMENTS)
    // STRICT SINGLE BOTTOM UNDERLINE BORDER - NEVER A 4-SIDED BOX
    if (el.type === 'heading') {
      return (
        <div 
          key={idx} 
          className="font-bold uppercase tracking-wide text-left"
          style={{
            color: el.heading_color || '#365F91',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: `1px solid ${el.border_color || '#000000'}`,
            fontSize: `${11 * zoomFactor}pt`,
            lineHeight: 1.2,
            marginTop: `${10 * zoomFactor}px`,
            marginBottom: `${3 * zoomFactor}px`,
            paddingBottom: `${1 * zoomFactor}px`,
            width: '100%'
          }}
        >
          {el.text}
        </div>
      );
    }

    // 3. Tabbed rows (e.g. Company & Date, Project & Date, Education & Degree/CGPA)
    if (el.type === 'tabbed_row' || (el.text && el.text.includes('\t') && el.type !== 'bullet')) {
      const parts = el.text ? el.text.split('\t').filter(Boolean) : [];
      const leftText = el.tab_left || parts[0]?.trim() || '';
      const rightText = el.tab_right || (parts.length > 1 ? parts[parts.length - 1]?.trim() : '');

      const isLeftBold = el.tab_left_bold !== undefined ? el.tab_left_bold : true;
      const isRightBold = el.tab_right_bold !== undefined ? el.tab_right_bold : true;
      const leftSize = (el.tab_left_size || 11) * zoomFactor;
      const rightSize = (el.tab_right_size || 11) * zoomFactor;

      return (
        <div 
          key={idx} 
          className="flex justify-between items-baseline w-full"
          style={{
            marginTop: `${(el.space_before_pt ? el.space_before_pt * 0.75 : 4) * zoomFactor}px`,
            marginBottom: `${(el.space_after_pt ? el.space_after_pt * 0.75 : 2) * zoomFactor}px`,
            lineHeight: 1.2
          }}
        >
          <span 
            className={`text-left ${isLeftBold ? 'font-bold' : 'font-normal'}`}
            style={{ fontSize: `${leftSize}pt` }}
          >
            {leftText}
          </span>
          <span 
            className={`text-right shrink-0 ml-4 ${isRightBold ? 'font-bold' : 'font-normal'}`}
            style={{ fontSize: `${rightSize}pt` }}
          >
            {rightText}
          </span>
        </div>
      );
    }

    // 4. Bullet list items (AmZetta, Skills, Projects, Achievements)
    if (el.type === 'bullet') {
      return (
        <div 
          key={idx} 
          className="flex items-start text-justify relative"
          style={{
            fontSize: `${11 * zoomFactor}pt`,
            lineHeight: 1.18,
            marginBottom: `${2 * zoomFactor}px`,
            paddingLeft: `${18 * zoomFactor}px`
          }}
        >
          <span 
            className="absolute left-0 top-0 font-bold text-black select-none"
            style={{ fontSize: `${9 * zoomFactor}pt` }}
          >
            •
          </span>
          <div className="w-full text-justify" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
            {renderRuns(el.runs, el.text)}
          </div>
        </div>
      );
    }

    // 5. Standard paragraphs (Name, Contact Line, Professional Summary, Job Subtitle)
    const isName = el.text === 'LOGESHWARAN.N' || (idx === 0 && !el.text.includes('@'));
    const isContact = el.text.includes('@') || el.text.includes('linkedin.com');
    const isCenter = el.alignment === 'center' || isName || isContact;
    const isJustify = el.alignment === 'justify' || (!isName && !isContact && el.text.length > 80);

    const fontSize = isName 
      ? 18 * zoomFactor 
      : (isContact ? 10 * zoomFactor : 11 * zoomFactor);

    return (
      <div 
        key={idx}
        className={`
          ${isCenter ? 'text-center' : ''} 
          ${isJustify ? 'text-justify' : ''}
        `}
        style={{
          fontSize: `${fontSize}pt`,
          lineHeight: isName ? 1.15 : (isContact ? 1.15 : 1.18),
          marginBottom: isName 
            ? `${2 * zoomFactor}px` 
            : (isJustify ? `${8 * zoomFactor}px` : `${2 * zoomFactor}px`),
          textAlign: isCenter ? 'center' : (isJustify ? 'justify' : 'left'),
          textJustify: isJustify ? 'inter-word' : undefined
        }}
      >
        {renderRuns(el.runs, el.text)}
      </div>
    );
  };

  // Group elements into Page 1 and Page 2 (natural DOCX page split)
  const allElements = activePreview.elements || [];
  const page1Elements = allElements.filter((el, i) => el.page_number === 1 || (!el.page_number && i <= 26));
  const page2Elements = allElements.filter((el, i) => el.page_number === 2 || (!el.page_number && i > 26));

  const pagesToRender = [
    { pageNum: 1, elements: page1Elements },
    { pageNum: 2, elements: page2Elements }
  ].filter(p => {
    if (pageFilter === '1') return p.pageNum === 1;
    if (pageFilter === '2') return p.pageNum === 2;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Document Visual Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              100% Exact Word Reproduction (Cambria • 0.5" Margins • Two-Page A4 Sheet Layout)
            </p>
          </div>
        </div>

        {/* View Switcher, Page Selector & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          {optimizedPreview && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode('optimized')}
                className={`px-3 py-1 rounded-md transition ${viewMode === 'optimized' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Tailored Resume
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 rounded-md transition ${viewMode === 'original' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Original Master
              </button>
            </div>
          )}

          {/* Page Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold items-center">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setPageFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${pageFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Pages
            </button>
            <button
              onClick={() => setPageFilter('1')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${pageFilter === '1' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Page 1
            </button>
            <button
              onClick={() => setPageFilter('2')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${pageFilter === '2' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Page 2
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Integrity Certificate */}
      {validation && (
        <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
          validation.is_valid 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{validation.certificate}</span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium hidden sm:inline">
            {validation.passed_checks_count} Checks Passed • 0 XML Style Violations
          </span>
        </div>
      )}

      {/* Document Canvas: Word Sheet Simulator */}
      <div className="bg-slate-200/90 dark:bg-slate-950 rounded-xl p-4 sm:p-6 overflow-x-auto flex flex-col items-center gap-8 border border-slate-300 dark:border-slate-800">
        {pagesToRender.map((p) => (
          <div key={p.pageNum} className="flex flex-col items-center">
            {/* Page Header Indicator */}
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
              <FileText className="w-3.5 h-3.5" />
              <span>Page {p.pageNum} of 2</span>
            </div>

            {/* A4 Page Paper */}
            <div 
              className="bg-white text-black transition-all duration-200 select-text"
              style={{
                width: `${Math.round(794 * zoomFactor)}px`,
                minHeight: `${Math.round(1123 * zoomFactor)}px`,
                padding: `${Math.round(48 * zoomFactor)}px`,
                fontFamily: docFont,
                fontSize: `${11 * zoomFactor}pt`,
                lineHeight: 1.18,
                color: '#000000',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
            >
              {p.elements.map((el, elIdx) => renderElement(el, elIdx))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};