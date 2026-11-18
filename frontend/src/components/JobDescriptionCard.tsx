import React from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  RotateCw,
  SearchCode
} from 'lucide-react';

interface JobDescriptionCardProps {
  jobDescription: string;
  setJobDescription: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const PRESET_JDS = [
  {
    name: 'Stripe • Senior Full Stack',
    jd: `Job Title: Senior Full Stack Engineer
Company: Stripe
Location: San Francisco, CA

About the Role:
We are seeking an experienced Senior Full Stack Software Engineer to build and scale our high-throughput global payment processing infrastructure. You will work across modern distributed services and high-performance frontend interfaces.

Required Technical Skills:
- 5+ years of software engineering experience building scalable web platforms
- Expertise in Python (FastAPI, Django) and TypeScript (React, Next.js)
- Deep practical experience with Docker, Kubernetes, and AWS cloud infrastructure
- Mastery of relational database schemas (PostgreSQL) and caching (Redis)
- Strong track record of CI/CD pipeline automation (GitHub Actions)
- Solid foundation in distributed systems, asynchronous queues (Kafka/Celery), and RESTful/GraphQL APIs

Responsibilities:
- Architect reliable, resilient microservices processing billions in transactions
- Optimize database queries and API response latencies for mission-critical endpoints
- Champion clean architecture, automated testing (PyTest, Jest), and agile engineering standards`
  },
  {
    name: 'Datadog • Cloud Backend Architect',
    jd: `Job Title: Staff / Senior Backend Engineer
Company: Datadog
Location: New York, NY (Hybrid)

Role Overview:
Join our real-time telemetry and metrics ingestion pipeline team. You will build high-volume data streaming infrastructure handling petabytes of daily monitoring events.

Required Skills & Experience:
- 6+ years of distributed backend systems experience
- Proficiency in Python, Go, or Java with deep microservices architecture expertise
- Hands-on experience with Kafka, Redis, Elasticsearch, and PostgreSQL
- Strong cloud background with AWS or GCP, Kubernetes, and Terraform
- Track record of performance tuning, concurrency optimization, and fault-tolerant system design

Responsibilities:
- Design low-latency ingestion pipelines processing over 100,000 metrics per second
- Refactor legacy services into containerized microservices with zero downtime
- Lead cross-functional engineering initiatives and mentor mid-level software engineers`
  },
  {
    name: 'Netflix • Senior UI/Fullstack Engineer',
    jd: `Job Title: Senior Fullstack UI Engineer
Company: Netflix
Location: Los Gatos, CA

The Opportunity:
We are looking for a Senior Fullstack Engineer to develop next-generation content management and studio workflow applications used by creators worldwide.

Core Requirements:
- 5+ years of hands-on fullstack experience with React, TypeScript, and modern CSS
- Strong backend experience with Python (FastAPI) or Node.js microservices
- Experience with GraphQL APIs, state management (Redux Toolkit), and responsive UI design
- Experience deploying cloud services on AWS (ECS, Lambda, S3) using Docker and CI/CD
- Passion for performance optimization, accessibility, and high UX fidelity`
  }
];

export const JobDescriptionCard: React.FC<JobDescriptionCardProps> = ({
  jobDescription,
  setJobDescription,
  onAnalyze,
  isAnalyzing,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jobDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Target Job Description
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste from LinkedIn, Indeed, Naukri, or Career Sites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {jobDescription && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
                  title="Copy text"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setJobDescription('')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition"
                  title="Clear text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400">Try Sample:</span>
          {PRESET_JDS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setJobDescription(p.jd)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={7}
            placeholder="Paste job description here... (e.g. Job Title, Company, Required technical skills, experience requirements, responsibilities)..."
            className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition resize-y"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
            <span>Supported platforms: LinkedIn, Indeed, Naukri, Foundit, Portals</span>
            <span>{jobDescription.length} characters</span>
          </div>
        </div>
      </div>

      {/* CTA Action */}
      <div className="mt-4">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || jobDescription.trim().length < 30}
          className="w-full py-3 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {isAnalyzing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Job Requirements & Simulating ATS...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Optimize Resume for This Job</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
