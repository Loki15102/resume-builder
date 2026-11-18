import React, { useRef, useState } from 'react';
import { 
  FileCheck2, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  FileLock2, 
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { TemplateInfo } from '../types';
import { uploadMasterTemplate, fetchTemplateInfo } from '../services/api';

interface MasterResumeCardProps {
  templateInfo: TemplateInfo | null;
  onUploadSuccess: (info: TemplateInfo) => void;
  loading: boolean;
}

export const MasterResumeCard: React.FC<MasterResumeCardProps> = ({
  templateInfo,
  onUploadSuccess,
  loading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setUploadError('Only .docx files are accepted as the master resume.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadMasterTemplate(file);
      const updated = await fetchTemplateInfo();
      onUploadSuccess(updated);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cand = templateInfo?.candidate;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Master Resume Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single source of truth (DOCX)
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Protected
          </span>
        </div>

        {/* Candidate Profile Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 mb-4 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {cand?.name || 'Logeshwaran N'}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {cand?.title || 'Front-End Developer / Full-Stack Software Engineer'}
              </p>
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{templateInfo?.sections_count || 7} Sections</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{cand?.email || 'logesh15102@gmail.com'}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{cand?.location || 'Chennai, India'}</span>
            </div>
          </div>
        </div>

        {/* Formatting Protection Specs */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500">Document Font</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">Cambria (Header 18pt / Body 11pt)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500">Page Margins</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">0.5 in (A4 Standard)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Engine Protocol</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <FileLock2 className="w-3 h-3" /> In-Place XML Run Replacement
            </span>
          </div>
        </div>

        {uploadError && (
          <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Upload Master Button */}
      <div>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".docx" 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>{isUploading ? 'Validating & Uploading...' : 'Replace Master Resume (DOCX)'}</span>
        </button>
      </div>
    </div>
  );
};
