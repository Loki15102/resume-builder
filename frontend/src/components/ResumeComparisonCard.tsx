import React, { useState } from 'react';
import { 
  GitCompare, 
  Check, 
  X, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { ModificationProposal } from '../types';

interface ResumeComparisonCardProps {
  proposals: ModificationProposal[];
  onToggleAccept: (id: string) => void;
  onUpdateProposalText: (id: string, newText: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyAndGenerate: () => void;
  isGenerating: boolean;
}

export const ResumeComparisonCard: React.FC<ResumeComparisonCardProps> = ({
  proposals,
  onToggleAccept,
  onUpdateProposalText,
  onAcceptAll,
  onRejectAll,
  onApplyAndGenerate,
  isGenerating,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  const startEditing = (p: ModificationProposal) => {
    setEditingId(p.id);
    setEditText(p.replacement_text);
  };

  const saveEdit = (id: string) => {
    onUpdateProposalText(id, editText);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (!proposals || proposals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <GitCompare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Side-by-Side Content Comparison
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          When you optimize for a job description, proposed paragraph-level changes will appear here with full control to accept, reject, or manually edit each change.
        </p>
      </div>
    );
  }

  // Get unique sections
  const sections = Array.from(new Set(proposals.map(p => p.section)));
  const filteredProposals = activeSectionFilter === 'all' 
    ? proposals 
    : proposals.filter(p => p.section === activeSectionFilter);

  const acceptedCount = proposals.filter(p => p.accepted !== false).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Review Proposed Modifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {acceptedCount} of {proposals.length} approved • Edit, accept, or reject individual changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAcceptAll}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition"
          >
            Accept All
          </button>
          <button
            onClick={onRejectAll}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Reject All
          </button>
          <button
            onClick={onApplyAndGenerate}
            disabled={isGenerating || acceptedCount === 0}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
          >
            {isGenerating ? 'Building DOCX...' : `Apply & Build DOCX (${acceptedCount})`}
          </button>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 text-xs font-medium border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveSectionFilter('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeSectionFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          All Sections ({proposals.length})
        </button>
        {sections.map(sec => (
          <button
            key={sec}
            onClick={() => setActiveSectionFilter(sec)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeSectionFilter === sec ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {sec} ({proposals.filter(p => p.section === sec).length})
          </button>
        ))}
      </div>

      {/* Comparison List */}
      <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
        {filteredProposals.map((item) => {
          const isAccepted = item.accepted !== false;
          const isEditing = editingId === item.id;
          const isExpandedWarning = item.length_diff_percent > 18;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all p-4 ${
                isAccepted 
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 shadow-xs' 
                  : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              {/* Card Title & Section */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.section}
                  </span>
                  {item.reason && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {item.reason}
                    </span>
                  )}
                </div>

                {/* Individual Action Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleAccept(item.id)}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                      isAccepted 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title={isAccepted ? 'Reject modification' : 'Accept modification'}
                  >
                    {isAccepted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isAccepted ? 'Accepted' : 'Rejected'}</span>
                  </button>

                  {!isEditing && isAccepted && (
                    <button
                      onClick={() => startEditing(item)}
                      className="p-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      title="Edit proposed text manually"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Diff Grid: Original vs Optimized */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Original */}
                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                    Original Template Content
                  </div>
                  <div className="text-slate-800 dark:text-slate-300 font-sans leading-relaxed">
                    {item.original_text}
                  </div>
                </div>

                {/* Optimized */}
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
                    <span>ATS Optimized Content</span>
                    {isExpandedWarning && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> +{item.length_diff_percent}% length
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full p-2 text-xs font-sans rounded-md border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5 mt-2">
                        <button
                          onClick={cancelEdit}
                          className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="px-2.5 py-1 text-xs rounded bg-blue-600 text-white flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed font-medium">
                      {item.replacement_text}
                    </div>
                  )}
                </div>
              </div>

              {/* Added Keywords & Details */}
              {item.keywords_added && item.keywords_added.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Keywords Injected:
                  </span>
                  {item.keywords_added.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.2 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
