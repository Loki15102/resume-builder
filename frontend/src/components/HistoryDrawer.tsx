import React from 'react';
import { 
  X, 
  History, 
  FileText, 
  Download, 
  Trash2, 
  RotateCcw, 
  Building2, 
  TrendingUp, 
  Calendar,
  ExternalLink
} from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onDelete: (id: string) => void;
  onReload: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
  onDelete,
  onReload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Resume History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {historyItems.length} customized version{historyItems.length === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Resumes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {historyItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No Resumes Generated Yet</p>
              <p className="text-xs mt-1">Paste a job description and generate your first tailored resume.</p>
            </div>
          ) : (
            historyItems.map((item) => {
              const delta = Math.round((item.optimized_ats_score - item.original_ats_score) * 10) / 10;
              const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Recently';

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-600 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.job_title}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.company_name}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <TrendingUp className="w-3 h-3" />
                        {item.optimized_ats_score}%
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        +{delta}% boost
                      </div>
                    </div>
                  </div>

                  {/* Date & Filename */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mb-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                    <span className="font-mono text-[10px] truncate max-w-[170px]" title={item.docx_filename}>
                      {item.docx_filename}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`/api/resume/download/${item.id}/docx`}
                      download={item.docx_filename}
                      className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOCX</span>
                    </a>

                    {item.has_pdf && (
                      <a
                        href={`/api/resume/download/${item.id}/pdf`}
                        download={item.pdf_filename || `${item.docx_filename.replace('.docx', '.pdf')}`}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 hover:bg-slate-300 transition"
                      >
                        <span>PDF</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        onReload(item);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Load into workspace to regenerate or view"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Delete resume history item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
