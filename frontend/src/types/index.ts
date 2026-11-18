export interface CandidateInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

export interface DocumentRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  color: string | null;
  size_pt?: number | null;
  font_name?: string | null;
}

export interface DocumentElement {
  type: 'heading' | 'bullet' | 'paragraph' | 'divider' | 'tabbed_row';
  text: string;
  tab_left?: string;
  tab_right?: string;
  tab_left_bold?: boolean;
  tab_right_bold?: boolean;
  tab_left_size?: number;
  tab_right_size?: number;
  has_bottom_border?: boolean;
  border_color?: string;
  heading_color?: string;
  runs: DocumentRun[];
  alignment: string;
  space_before_pt?: number;
  space_after_pt?: number;
  page_number?: number;
}

export interface DocumentPreview {
  candidate: CandidateInfo;
  doc_font?: string;
  sections: Record<string, SectionItem[]>;
  elements: DocumentElement[];
}

export interface SectionItem {
  id: string;
  text: string;
  is_bullet: boolean;
  is_heading: boolean;
  length: number;
  word_count: number;
}

export interface TemplateInfo {
  status: string;
  file_name: string;
  file_size_bytes: number;
  last_modified: string;
  candidate: CandidateInfo;
  sections_count: number;
  sections: Record<string, SectionItem[]>;
  preview: DocumentPreview;
  formatting_rules: {
    font_family: string;
    margins: string;
    accent_color: string;
    template_protection: string;
  };
}

export interface KeywordItem {
  keyword: string;
  frequency: number;
  matched: boolean;
  importance?: 'High' | 'Medium' | 'Low';
}

export interface AtsAnalysis {
  score: number;
  matched_keywords_count: number;
  missing_keywords_count: number;
  total_target_keywords: number;
  matched_keywords: KeywordItem[];
  missing_keywords: KeywordItem[];
  required_skills_match_percent: number;
  experience_relevance_score: number;
  action_verb_density_score: number;
  section_scores: {
    skills: number;
    experience: number;
    summary: number;
  };
  improvement_suggestions: string[];
  disclaimer: string;
}

export interface JobDescriptionData {
  job_title: string;
  company_name: string;
  required_experience: string;
  required_skills: string[];
  preferred_skills: string[];
  roles_and_responsibilities: string[];
  qualifications: string[];
  ats_keywords: string[];
  source?: string;
}

export interface ModificationProposal {
  id: string;
  section: string;
  original_text: string;
  replacement_text: string;
  reason?: string;
  keywords_added?: string[];
  length_diff_chars: number;
  length_diff_percent: number;
  accepted?: boolean;
  is_editing?: boolean;
  edited_text?: string;
}

export interface LayoutMetrics {
  total_modifications_requested: number;
  total_modifications_applied: number;
  original_characters: number;
  optimized_characters: number;
  character_delta: number;
  net_expansion_percent: number;
  layout_overflow_risk: 'Low' | 'Medium' | 'High';
}

export interface FormattingValidation {
  is_valid: boolean;
  passed_checks_count: number;
  passed_checks: string[];
  violations_count: number;
  violations: string[];
  certificate: string;
}

export interface GenerateResumeResult {
  status: string;
  history_id: string;
  filename: string;
  pdf_available: boolean;
  pdf_message: string | null;
  applied_modifications_count: number;
  warnings: Array<{
    section: string;
    type: string;
    message: string;
    original_text: string;
    replacement_text: string;
  }>;
  layout_metrics: LayoutMetrics;
  formatting_validation: FormattingValidation;
  ats_scores: {
    original_score: number;
    optimized_score: number;
    score_delta: number;
    matched_keywords_count: number;
    missing_keywords_count: number;
    original_analysis: AtsAnalysis;
    optimized_analysis: AtsAnalysis;
  };
  optimized_preview: DocumentPreview;
  download_urls: {
    docx: string;
    pdf: string | null;
  };
}

export interface HistoryItem {
  id: string;
  created_at: string;
  company_name: string;
  job_title: string;
  candidate_name: string;
  job_description_preview: string;
  original_ats_score: number;
  optimized_ats_score: number;
  docx_filename: string;
  pdf_filename: string | null;
  has_pdf: boolean;
  matched_keywords: KeywordItem[];
  missing_keywords: KeywordItem[];
  changes_applied: ModificationProposal[];
  ats_analysis: AtsAnalysis;
}

export interface AppSettings {
  ai_provider: string;
  gemini_api_key_configured: boolean;
  openai_api_key_configured: boolean;
  gemini_model: string;
  openai_model: string;
  max_expansion_threshold: number;
  default_template_name: string;
}
