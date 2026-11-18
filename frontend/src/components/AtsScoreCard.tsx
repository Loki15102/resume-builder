import React from 'react';
import { 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Sparkles,
  BarChart3,
  Gauge
} from 'lucide-react';
import { AtsAnalysis } from '../types';

interface AtsScoreCardProps {
  originalAnalysis: AtsAnalysis | null;
  optimizedAnalysis: AtsAnalysis | null;
  isOptimized: boolean;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({
  originalAnalysis,
  optimizedAnalysis,
  isOptimized,
}) => {
  const currentAnalysis = isOptimized && optimizedAnalysis ? optimizedAnalysis : originalAnalysis;
  const origScore = originalAnalysis?.score || 0;
  const optScore = optimizedAnalysis?.score || origScore;
  const delta = Math.round((optScore - origScore) * 10) / 10;

  if (!currentAnalysis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[220px]">
        <Gauge className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          ATS Compatibility Score
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Analyze a job description to calculate pre-optimization and post-optimization ATS match scores.
        </p>
      </div>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 55) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80';
    if (score >= 70) return 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80';
    if (score >= 55) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80';
    return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                ATS Match Score
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Job compatibility simulation
              </p>
            </div>
          </div>

          {isOptimized && delta > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
              <TrendingUp className="w-3.5 h-3.5" />
              +{delta}% Boost
            </span>
          )}
        </div>

        {/* Dual Score Cards Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Original Resume Score */}
          <div className={`p-3.5 rounded-xl border text-center ${scoreBg(origScore)}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Master Resume
            </span>
            <div className={`text-3xl font-extrabold my-1 ${scoreColor(origScore)}`}>
              {origScore}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Pre-Optimization
            </span>
          </div>

          {/* Optimized Resume Score */}
          <div className={`p-3.5 rounded-xl border text-center ${isOptimized ? scoreBg(optScore) : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Optimized Resume
            </span>
            <div className={`text-3xl font-extrabold my-1 ${isOptimized ? scoreColor(optScore) : 'text-slate-400'}`}>
              {isOptimized ? `${optScore}%` : 'Pending'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {isOptimized ? 'Post-Optimization' : 'Awaiting Generation'}
            </span>
          </div>
        </div>

        {/* Dimension Breakdown Progress Bars */}
        <div className="space-y-2 mb-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>Required Skills Alignment</span>
              <span className="font-semibold">{currentAnalysis.required_skills_match_percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${currentAnalysis.required_skills_match_percent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>Experience Relevance</span>
              <span className="font-semibold">{currentAnalysis.experience_relevance_score}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${currentAnalysis.experience_relevance_score}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>STAR Action-Verb Density</span>
              <span className="font-semibold">{currentAnalysis.action_verb_density_score}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${currentAnalysis.action_verb_density_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Improvement Suggestions */}
        {currentAnalysis.improvement_suggestions?.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ATS Improvement Recommendations</span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
              {currentAnalysis.improvement_suggestions.slice(0, 2).map((s, idx) => (
                <li key={idx} className="leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mandatory ATS Disclaimer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>{currentAnalysis.disclaimer}</span>
      </div>
    </div>
  );
};
