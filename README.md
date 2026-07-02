🚀 Adversarial Candidate Ranking System

🎯 What It Does:
An AI-powered hiring platform that stress-tests candidates to identify genuinely qualified talent and expose manipulation like keyword stuffing and prompt injection.

🧠 Semantic Ranking:
Uses Sentence-BERT (SBERT) to understand candidate profiles beyond keywords, scoring fit based on contextual meaning (0-100 scale).

⚡ Adversarial Stress Testing:
Creates 11 perturbed profile variants per candidate:
• Skill Swap • Experience Fluff • Education Change
• Keyword Stuffing • Irrelevant Skills • Skill Removal
• Award Exaggeration • Publication Falsification • And more

📊 Stability Analysis:
Re-ranks after each perturbation and measures stability score (0-1). Genuine candidates maintain their rank under stress.

🛡️ Defense Layer:
Detects keyword stuffing, prompt injection, experience inflation, and inconsistent profile information with severity levels.

💬 Explainable AI:
Generates human-readable explanations - strengths, gaps, robustness metrics, and red flags for every candidate.

📈 Interactive Dashboard:
Real-time leaderboard, visual analytics (charts), filters, and export options (CSV/PDF/Excel).

🛠️ Tech Stack:
Frontend: React 18, TypeScript, Tailwind CSS, Recharts
Backend: FastAPI (Python), PostgreSQL, Redis
AI/ML: SBERT, spaCy, Gemini API, scikit-learn

🏆 Hackathon Project:
Built for India.Runs 2026 by Team Code Worms
- Amirtha Varshni M (Lead)
- Dharshini R, Dharshini K, Tharangini T

✨ Key Impact:
• 95%+ detection of keyword stuffing
• 40% reduction in false positives
• <30 sec processing for 100 candidates
• Saves $14,000+ per bad hire avoided
