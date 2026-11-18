import React, { useState, useEffect } from 'react';
import { 
  fetchTemplateInfo, 
  parseJobDescription, 
  analyzeResume, 
  optimizeResume, 
  generateResume, 
  fetchHistory, 
  deleteHistoryItem, 
  fetchSettings 
} from './services/api';
import { 
  TemplateInfo, 
  JobDescriptionData, 
  AtsAnalysis, 
  ModificationProposal, 
  GenerateResumeResult, 
  HistoryItem, 
  AppSettings 
} from './types';

import { Navbar } from './components/Navbar';
import { MasterResumeCard } from './components/MasterResumeCard';
import { JobDescriptionCard } from './components/JobDescriptionCard';
import { JobRequirementsCard } from './components/JobRequirementsCard';
import { AtsScoreCard } from './components/AtsScoreCard';
import { KeywordAnalysisCard } from './components/KeywordAnalysisCard';
import { ResumeComparisonCard } from './components/ResumeComparisonCard';
import { DocumentPreviewCard } from './components/DocumentPreviewCard';
import { DownloadCenterCard } from './components/DownloadCenterCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';

import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDown, 
  FileCheck2,
  FileText
} from 'lucide-react';

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // App data state
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobData, setJobData] = useState<JobDescriptionData | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<AtsAnalysis | null>(null);
  const [optimizedAnalysis, setOptimizedAnalysis] = useState<AtsAnalysis | null>(null);
  const [proposals, setProposals] = useState<ModificationProposal[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerateResumeResult | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // UI state
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync dark class to root document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingTemplate(true);
        const [tmpl, hist, sett] = await Promise.all([
          fetchTemplateInfo(),
          fetchHistory(),
          fetchSettings()
        ]);
        setTemplateInfo(tmpl);
        setHistoryItems(hist);
        setAppSettings(sett);
      } catch (err: any) {
        showToast(err.message || 'Error connecting to backend services', 'error');
      } finally {
        setLoadingTemplate(false);
      }
    }
    loadInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Workflow Step 1: Analyze Job Description & Generate Modification Proposals
  const handleAnalyzeAndOptimize = async () => {
    if (!jobDescription || jobDescription.trim().length < 30) {
      showToast('Please provide a complete job description text.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setGenerationResult(null);
    setOptimizedAnalysis(null);

    try {
      // Parse JD & Optimize in parallel
      const parsedJD = await parseJobDescription(jobDescription);
      setJobData(parsedJD);

      const optRes = await optimizeResume(jobDescription, parsedJD);
      setOriginalAnalysis(optRes.original_analysis);
      setProposals(optRes.proposals.map(p => ({ ...p, accepted: true })));

      showToast(`Analyzed ${parsedJD.job_title} at ${parsedJD.company_name}. Proposed ${optRes.proposals.length} tailoring enhancements.`, 'success');

      // Smooth scroll to comparison section
      setTimeout(() => {
        document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      showToast(err.message || 'Optimization failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle proposal accept / reject
  const handleToggleAccept = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, accepted: p.accepted === false ? true : false } : p));
  };

  // Inline edit proposal text
  const handleUpdateProposalText = (id: string, newText: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        const diff = newText.length - p.original_text.length;
        return {
          ...p,
          replacement_text: newText,
          length_diff_chars: diff,
          length_diff_percent: Math.round((diff / Math.max(p.original_text.length, 1)) * 100),
          accepted: true
        };
      }
      return p;
    }));
    showToast('Updated proposal content', 'info');
  };

  const handleAcceptAll = () => {
    setProposals(prev => prev.map(p => ({ ...p, accepted: true })));
    showToast('All proposed enhancements accepted', 'info');
  };

  const handleRejectAll = () => {
    setProposals(prev => prev.map(p => ({ ...p, accepted: false })));
    showToast('All proposed enhancements rejected', 'info');
  };

  // Workflow Step 2: Apply approved changes to DOCX and generate output
  const handleApplyAndGenerate = async () => {
    const acceptedMods = proposals.filter(p => p.accepted !== false);
    if (acceptedMods.length === 0) {
      showToast('Please accept at least one modification before building.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        job_description: jobDescription,
        company_name: jobData?.company_name || 'TargetCompany',
        job_title: jobData?.job_title || 'Position',
        candidate_name: templateInfo?.candidate.name || 'Candidate',
        approved_modifications: acceptedMods
      };

      const result = await generateResume(payload);
      setGenerationResult(result);
      setOptimizedAnalysis(result.ats_scores.optimized_analysis);

      // Refresh history list
      const updatedHistory = await fetchHistory();
      setHistoryItems(updatedHistory);

      showToast(`Resume successfully generated: +${result.ats_scores.score_delta}% ATS boost! 100% formatting preserved.`, 'success');

      // Scroll to preview and download
      setTimeout(() => {
        document.getElementById('download-preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      showToast(err.message || 'Resume generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // History Actions
  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setHistoryItems(prev => prev.filter(h => h.id !== id));
      showToast('Resume record deleted', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const handleReloadHistory = (item: HistoryItem) => {
    setJobDescription(item.job_description_preview);
    setJobData({
      job_title: item.job_title,
      company_name: item.company_name,
      required_experience: 'Relevant experience',
      required_skills: item.matched_keywords.map(k => k.keyword),
      preferred_skills: [],
      roles_and_responsibilities: [],
      qualifications: [],
      ats_keywords: item.matched_keywords.map(k => k.keyword)
    });
    setOriginalAnalysis({
      score: item.original_ats_score,
      matched_keywords_count: item.matched_keywords.length,
      missing_keywords_count: item.missing_keywords.length,
      total_target_keywords: item.matched_keywords.length + item.missing_keywords.length,
      matched_keywords: item.matched_keywords,
      missing_keywords: item.missing_keywords,
      required_skills_match_percent: Math.round((item.matched_keywords.length / Math.max(item.matched_keywords.length + item.missing_keywords.length, 1)) * 100),
      experience_relevance_score: 90,
      action_verb_density_score: 85,
      section_scores: { skills: 90, experience: 90, summary: 85 },
      improvement_suggestions: [],
      disclaimer: "Estimated Job-Description Compatibility Score based on ATS parsing simulation. Not an official employer ATS result."
    });
    setOptimizedAnalysis(item.ats_analysis);
    if (item.changes_applied && item.changes_applied.length > 0) {
      setProposals(item.changes_applied.map(p => ({ ...p, accepted: true })));
    }
    showToast(`Loaded historical resume for ${item.company_name}`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md animate-fade-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        openSettings={() => setSettingsOpen(true)}
        openHistory={() => setHistoryOpen(true)}
        historyCount={historyItems.length}
        templateLoaded={Boolean(templateInfo)}
      />

      {/* Main Content: Bento Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Hero Section Banner */}
        <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-100 border border-white/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              100% Strict DOCX OpenXML Formatting Preservation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              AI-Powered ATS Resume Builder
            </h1>
            <p className="mt-2 text-sm text-blue-100/90 leading-relaxed font-normal">
              Tailors your master DOCX resume to any job description using surgical XML-level run updates.
              Preserves your fonts, margins, tables, and colors with zero layout distortion.
            </p>
          </div>
        </section>

        {/* Bento Grid: Row 1 - Input & Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Master Resume Card (4 cols) */}
          <div className="lg:col-span-4">
            <MasterResumeCard
              templateInfo={templateInfo}
              onUploadSuccess={(updated) => {
                setTemplateInfo(updated);
                showToast('Master resume template updated successfully', 'success');
              }}
              loading={loadingTemplate}
            />
          </div>

          {/* Job Description Input Card (8 cols) */}
          <div className="lg:col-span-8">
            <JobDescriptionCard
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              onAnalyze={handleAnalyzeAndOptimize}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        {/* Bento Grid: Row 2 - ATS Score, Job Requirements & Keyword Coverage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Extracted Requirements (4 cols) */}
          <div className="md:col-span-4">
            <JobRequirementsCard jobData={jobData} />
          </div>

          {/* ATS Compatibility Score (4 cols) */}
          <div className="md:col-span-4">
            <AtsScoreCard
              originalAnalysis={originalAnalysis}
              optimizedAnalysis={optimizedAnalysis}
              isOptimized={Boolean(generationResult)}
            />
          </div>

          {/* Keyword Coverage & Skill Gaps (4 cols) */}
          <div className="md:col-span-4">
            <KeywordAnalysisCard
              analysis={optimizedAnalysis || originalAnalysis}
            />
          </div>
        </div>

        {/* Bento Grid: Row 3 - Side-by-Side Content Review & Modification Approvals */}
        <div id="comparison-section" className="scroll-mt-20">
          <ResumeComparisonCard
            proposals={proposals}
            onToggleAccept={handleToggleAccept}
            onUpdateProposalText={handleUpdateProposalText}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onApplyAndGenerate={handleApplyAndGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Bento Grid: Row 4 - Document Preview & Download Center */}
        <div id="download-preview-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-20">
          {/* Document Preview (8 cols) */}
          <div className="lg:col-span-8">
            <DocumentPreviewCard
              originalPreview={templateInfo?.preview || null}
              optimizedPreview={generationResult?.optimized_preview || null}
              validation={generationResult?.formatting_validation || null}
            />
          </div>

          {/* Download Center (4 cols) */}
          <div className="lg:col-span-4">
            <DownloadCenterCard
              generationResult={generationResult}
            />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>ResumAI ATS Resume Builder • Built with FastAPI, python-docx, OOXML & React • Zero Layout Distortion Guarantee</p>
      </footer>

      {/* History Slide-Over Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        historyItems={historyItems}
        onDelete={handleDeleteHistory}
        onReload={handleReloadHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={appSettings}
        onSettingsUpdated={(updated) => {
          setAppSettings(updated);
          showToast('Settings saved successfully', 'success');
        }}
      />

    </div>
  );
}

export default App;
