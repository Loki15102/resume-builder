import type {
  TemplateInfo,
  JobDescriptionData,
  AtsAnalysis,
  ModificationProposal,
  GenerateResumeResult,
  HistoryItem,
  AppSettings
} from '../types';

const API_BASE = '/api';

export async function fetchTemplateInfo(): Promise<TemplateInfo> {
  const res = await fetch(`${API_BASE}/template/info`);
  if (!res.ok) throw new Error(`Failed to load master template: ${res.statusText}`);
  return res.json();
}

export async function uploadMasterTemplate(file: File): Promise<{ status: string; message: string; file_name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/template/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload master template');
  }
  return res.json();
}

export async function parseJobDescription(jobDescription: string): Promise<JobDescriptionData> {
  const res = await fetch(`${API_BASE}/job/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_description: jobDescription })
  });
  if (!res.ok) throw new Error('Failed to parse job description');
  const data = await res.json();
  return data.data;
}

export async function analyzeResume(jobDescription: string): Promise<AtsAnalysis> {
  const res = await fetch(`${API_BASE}/resume/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_description: jobDescription })
  });
  if (!res.ok) throw new Error('Failed to analyze ATS compatibility');
  const data = await res.json();
  return data.analysis;
}

export async function optimizeResume(
  jobDescription: string,
  jobData?: JobDescriptionData
): Promise<{
  job_data: JobDescriptionData;
  original_ats_score: number;
  original_analysis: AtsAnalysis;
  proposals: ModificationProposal[];
}> {
  const res = await fetch(`${API_BASE}/resume/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_description: jobDescription, job_data: jobData })
  });
  if (!res.ok) throw new Error('Failed to generate resume optimization proposals');
  return res.json();
}

export async function generateResume(payload: {
  job_description: string;
  company_name: string;
  job_title: string;
  candidate_name?: string;
  approved_modifications: ModificationProposal[];
}): Promise<GenerateResumeResult> {
  const res = await fetch(`${API_BASE}/resume/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate tailored resume');
  }
  return res.json();
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to load resume history');
  const data = await res.json();
  return data.history;
}

export async function fetchHistoryDetail(historyId: string): Promise<HistoryItem> {
  const res = await fetch(`${API_BASE}/history/${historyId}`);
  if (!res.ok) throw new Error('Failed to load history details');
  const data = await res.json();
  return data.item;
}

export async function deleteHistoryItem(historyId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${historyId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete resume history item');
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to load application settings');
  return res.json();
}

export async function updateSettings(settingsData: Partial<AppSettings> & {
  gemini_api_key?: string;
  openai_api_key?: string;
}): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  if (!res.ok) throw new Error('Failed to update application settings');
  const data = await res.json();
  return data.settings;
}
