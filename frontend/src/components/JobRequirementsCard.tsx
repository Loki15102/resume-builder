import React from 'react';
import { 
  Building2, 
  Target, 
  Calendar, 
  Cpu, 
  CheckCircle, 
  Hash, 
  ListOrdered 
} from 'lucide-react';
import { JobDescriptionData } from '../types';

interface JobRequirementsCardProps {
  jobData: JobDescriptionData | null;
}

export const JobRequirementsCard: React.FC<JobRequirementsCardProps> = ({ jobData }) => {
  if (!jobData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center min-h-[220px]">
        <Target className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Job Requirements Analysis
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Paste a job description on the left and click "Optimize Resume" to automatically extract target roles, skills, and ATS criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-lg text-purple-600 dark:text-purple-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Extracted Job Target
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI-parsed role specification
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {jobData.source || 'ATS Parser'}
        </span>
      </div>

      {/* Role & Company Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Target Company</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {jobData.company_name}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>Target Role</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {jobData.job_title}
          </div>
        </div>
      </div>

      {/* Required Skills Badges */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-500" />
          <span>Core Required Technical Skills ({jobData.required_skills?.length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {jobData.required_skills?.map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Preferred & Keywords */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-indigo-500" />
          <span>ATS Indexing Keywords ({jobData.ats_keywords?.length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {jobData.ats_keywords?.slice(0, 12).map((kw, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
