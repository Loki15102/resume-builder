import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { AtsAnalysis, KeywordItem } from '../types';

interface KeywordAnalysisCardProps {
  analysis: AtsAnalysis | null;
}

export const KeywordAnalysisCard: React.FC<KeywordAnalysisCardProps> = ({ analysis }) => {
  const [filter, setFilter] = useState<'all' | 'matched' | 'missing'>('all');

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[220px]">
        <Key className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Keyword & Skill Match Analysis
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Displays matched ATS keywords and highlights skill gaps for transparent optimization.
        </p>
      </div>
    );
  }

  const matched = analysis.matched_keywords || [];
  const missing = analysis.missing_keywords || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                ATS Keyword Coverage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Matched: {matched.length} | Gaps: {missing.length}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All ({matched.length + missing.length})
            </button>
            <button
              onClick={() => setFilter('matched')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'matched' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Matched ({matched.length})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'missing' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Missing ({missing.length})
            </button>
          </div>
        </div>

        {/* Keywords Container */}
        <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
          {/* Matched Keywords */}
          {(filter === 'all' || filter === 'matched') && matched.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Found in Resume</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80"
                  >
                    <span>{item.keyword}</span>
                    <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 px-1 rounded-full font-bold">
                      {item.frequency}x
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {(filter === 'all' || filter === 'missing') && missing.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing from Resume (Gaps)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80"
                  >
                    <span>{item.keyword}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      Gap
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authenticity Guard Notice */}
      <div className="mt-4 p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong>Authenticity Protection:</strong> ResumAI will never fabricate unverified skills or jobs. Missing keywords are highlighted above so you can incorporate them only if you possess genuine hands-on experience.
        </div>
      </div>
    </div>
  );
};
