import re
from typing import Dict, Any, List, Set, Tuple

COMMON_TECH_KEYWORDS = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "golang", "go", "c++", "c#", "ruby", "rust", "sql", "html", "css", "bash", "shell",
    # Frontend
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "redux", "tailwind css", "tailwind", "webpack", "vite", "sass", "responsive design", "graphql", "rest", "restful api",
    # Backend
    "fastapi", "django", "flask", "node.js", "nodejs", "express", "express.js", "spring boot", "microservices", "grpc", "celery", "rabbitmq", "kafka", "event-driven",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "continuous integration", "github actions", "jenkins", "ansible", "helm", "ecs", "ec2", "s3", "lambda",
    # Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "sqlite", "nosql", "query optimization", "indexing",
    # Testing & Tools
    "pytest", "jest", "unit testing", "tdd", "git", "linux", "jira", "agile", "scrum", "system design", "distributed systems", "concurrency",
    # AI & Data
    "machine learning", "deep learning", "llm", "generative ai", "nlp", "pandas", "numpy", "pytorch", "tensorflow"
}

ACTION_VERBS = {
    "architected", "spearheaded", "engineered", "developed", "designed", "deployed", "implemented", "optimized",
    "scaled", "led", "mentored", "orchestrated", "automated", "streamlined", "built", "delivered", "enhanced",
    "reduced", "increased", "boosted", "accelerated", "integrated", "refactored", "resolved", "maintained"
}

class AtsScorer:
    """
    Simulates modern ATS parser keyword matching, section scoring,
    and semantic relevance against target job descriptions.
    """

    @classmethod
    def clean_text(cls, text: str) -> str:
        return text.lower().replace("\n", " ")

    @classmethod
    def extract_keywords_from_jd(cls, jd_text: str) -> Dict[str, Any]:
        """Extract all candidate technical skills, frameworks, and qualifications from the JD."""
        text_lower = cls.clean_text(jd_text)
        words = set(re.findall(r'\b[a-zA-Z0-9_\-\.\#\+]+\b', text_lower))

        found_keywords: Set[str] = set()

        # Check multi-word technical keywords first
        for kw in sorted(COMMON_TECH_KEYWORDS, key=lambda x: -len(x)):
            if f" {kw} " in f" {text_lower} " or kw in text_lower:
                found_keywords.add(kw)

        # Detect experience requirements
        exp_match = re.search(r'(\d+)\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', text_lower)
        required_years = int(exp_match.group(1)) if exp_match else None

        # Check seniority words
        seniority = "Mid-Level"
        if any(w in text_lower for w in ["senior", "lead", "principal", "staff", "head of", "director"]):
            seniority = "Senior"
        elif any(w in text_lower for w in ["junior", "entry-level", "associate", "intern", "fresh"]):
            seniority = "Junior"

        return {
            "keywords": sorted(list(found_keywords)),
            "required_years": required_years,
            "seniority": seniority
        }

    @classmethod
    def analyze(cls, resume_text: str, jd_text: str, sections_data: Dict[str, List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Calculate ATS compatibility score and provide actionable gap analysis.
        """
        resume_clean = cls.clean_text(resume_text)
        jd_clean = cls.clean_text(jd_text)

        jd_info = cls.extract_keywords_from_jd(jd_text)
        target_keywords = jd_info["keywords"]

        if not target_keywords:
            # Fallback if JD is short or generic
            words = set(re.findall(r'\b[a-zA-Z]{4,}\b', jd_clean))
            target_keywords = sorted(list(words))[:15]

        matched_kws = []
        missing_kws = []

        for kw in target_keywords:
            count = len(re.findall(rf'\b{re.escape(kw)}\b', resume_clean))
            if count > 0:
                matched_kws.append({
                    "keyword": kw.title() if len(kw) > 3 else kw.upper(),
                    "frequency": count,
                    "matched": True
                })
            else:
                missing_kws.append({
                    "keyword": kw.title() if len(kw) > 3 else kw.upper(),
                    "frequency": 0,
                    "matched": False,
                    "importance": "High" if kw in ["python", "react", "fastapi", "aws", "docker", "sql", "typescript"] else "Medium"
                })

        total_kw = max(len(target_keywords), 1)
        keyword_match_ratio = len(matched_kws) / total_kw

        # Experience relevance: Check seniority alignment
        exp_relevance = 85.0
        if jd_info["seniority"] == "Senior" and "senior" in resume_clean:
            exp_relevance = 95.0
        elif jd_info["seniority"] == "Senior" and "senior" not in resume_clean:
            exp_relevance = 70.0

        # Action-verb density check
        action_verb_count = 0
        for verb in ACTION_VERBS:
            action_verb_count += len(re.findall(rf'\b{verb}\b', resume_clean))
        action_density_score = min(100.0, (action_verb_count / 12.0) * 100.0)

        # Section-specific weighting
        skills_match_score = 0.0
        exp_match_score = 0.0
        summary_match_score = 0.0

        if sections_data:
            def section_text(sec_name: str) -> str:
                return " ".join(item["text"] for item in sections_data.get(sec_name, [])).lower()

            # Find matching sections flexibly
            for sec, items in sections_data.items():
                s_lower = sec.lower()
                text = " ".join(i["text"] for i in items).lower()
                if "skill" in s_lower:
                    m = sum(1 for kw in target_keywords if kw in text)
                    skills_match_score = (m / total_kw) * 100
                elif "experience" in s_lower or "work" in s_lower:
                    m = sum(1 for kw in target_keywords if kw in text)
                    exp_match_score = (m / total_kw) * 100
                elif "summary" in s_lower or "objective" in s_lower:
                    m = sum(1 for kw in target_keywords if kw in text)
                    summary_match_score = (m / total_kw) * 100
        else:
            skills_match_score = keyword_match_ratio * 90.0
            exp_match_score = keyword_match_ratio * 85.0
            summary_match_score = keyword_match_ratio * 80.0

        # Weighted final ATS compatibility score
        # 45% Keyword Match + 25% Experience Relevance + 15% Action Verb Impact + 15% Section Density
        overall_score = (
            (keyword_match_ratio * 100 * 0.45) +
            (exp_relevance * 0.25) +
            (action_density_score * 0.15) +
            (min(100.0, (skills_match_score + exp_match_score) / 2) * 0.15)
        )
        overall_score = max(10.0, min(99.0, overall_score))

        # Actionable improvement suggestions
        suggestions = []
        if missing_kws:
            top_missing = [m["keyword"] for m in missing_kws[:4]]
            suggestions.append(f"Consider integrating relevant experience with {', '.join(top_missing)} if you have practical familiarity with them.")
        if action_density_score < 75.0:
            suggestions.append("Strengthen work experience bullets with measurable metrics and high-impact action verbs (e.g., 'Spearheaded', 'Optimized throughput by 30%').")
        if summary_match_score < 50.0:
            suggestions.append("Tailor your Professional Summary to explicitly highlight core domain keywords found in the job description.")
        if len(suggestions) == 0:
            suggestions.append("Outstanding alignment with target job requirements. All primary ATS keywords are represented.")

        return {
            "score": round(overall_score, 1),
            "matched_keywords_count": len(matched_kws),
            "missing_keywords_count": len(missing_kws),
            "total_target_keywords": len(target_keywords),
            "matched_keywords": matched_kws,
            "missing_keywords": missing_kws,
            "required_skills_match_percent": round(keyword_match_ratio * 100, 1),
            "experience_relevance_score": round(exp_relevance, 1),
            "action_verb_density_score": round(action_density_score, 1),
            "section_scores": {
                "skills": round(min(100.0, skills_match_score), 1),
                "experience": round(min(100.0, exp_match_score), 1),
                "summary": round(min(100.0, summary_match_score), 1)
            },
            "improvement_suggestions": suggestions,
            "disclaimer": "Estimated Job-Description Compatibility Score based on ATS parsing simulation. Not an official employer ATS result."
        }
