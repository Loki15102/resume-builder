import React from 'react';
import { 
  Download, 
  FileText, 
  FileCode2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { GenerateResumeResult } from '../types';

interface DownloadCenterCardProps {
  generationResult: GenerateResumeResult | null;
}

export const DownloadCenterCard: React.FC<DownloadCenterCardProps> = ({ generationResult }) => {
  if (!generationResult) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[220px]">
        <Download className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Download Center
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Once modifications are applied, your tailored DOCX (primary) and PDF documents will be ready for direct download.
        </p>
      </div>
    );
  }

  const { filename, download_urls, pdf_available, pdf_message, layout_metrics, formatting_validation } = generationResult;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Export Customized Resume
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready for ATS submission
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </span>
        </div>

        {/* Filename Display */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
          <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-1">
            Standard ATS Filename
          </div>
          <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 break-all select-all">
            {filename}
          </div>
        </div>

        {/* Layout Metrics Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Modifications Applied</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {layout_metrics.total_modifications_applied} paragraphs
            </span>
          </div>
          <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Layout Overflow Risk</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {layout_metrics.layout_overflow_risk} ({layout_metrics.net_expansion_percent > 0 ? `+${layout_metrics.net_expansion_percent}%` : `${layout_metrics.net_expansion_percent}%`})
            </span>
          </div>
        </div>

        {/* Warning if PDF isn't supported in current environment */}
        {!pdf_available && pdf_message && (
          <div className="mb-4 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>{pdf_message}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary DOCX Download */}
        <a
          href={download_urls.docx}
          download={filename}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
        >
          <FileText className="w-4 h-4" />
          <span>Download DOCX (Primary Format)</span>
        </a>

        {/* PDF Download if available */}
        {pdf_available && download_urls.pdf && (
          <a
            href={download_urls.pdf}
            download={filename.replace('.docx', '.pdf')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PDF (Direct Print)</span>
          </a>
        )}
      </div>
    </div>
  );
};
