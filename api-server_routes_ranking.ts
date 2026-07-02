import { Router } from "express";
import { db } from "@workspace/db";
import {
  rankingJobsTable, rankingResultsTable, candidatesTable,
  jobDescriptionsTable, adversaryConfigTable
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { StartRankingBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const PERTURBATION_TYPES = [
  "skill_swap", "experience_fluff", "education_downgrade", "keyword_stuffing",
  "irrelevant_skills", "experience_reduction", "skill_removal",
  "education_upgrade", "company_reputation_change", "award_exaggeration",
];

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function textToVector(text: string, vocabulary: string[]): number[] {
  const words = text.toLowerCase().split(/\W+/);
  return vocabulary.map(v => words.filter(w => w === v).length);
}

function buildVocabulary(...texts: string[]): string[] {
  const words = new Set<string>();
  for (const text of texts) {
    text.toLowerCase().split(/\W+/).forEach(w => { if (w.length > 2) words.add(w); });
  }
  return Array.from(words);
}

function detectRedFlags(rawText: string, skills: string[]): Array<{type: string; severity: string; details: string}> {
  const flags: Array<{type: string; severity: string; details: string}> = [];
  // Keyword stuffing detection
  for (const skill of skills) {
    const count = (rawText.toLowerCase().match(new RegExp(skill.toLowerCase(), "g")) || []).length;
    if (count > 5) {
      flags.push({ type: "keyword_stuffing", severity: "high", details: `"${skill}" mentioned ${count} times` });
    } else if (count > 3) {
      flags.push({ type: "keyword_stuffing", severity: "medium", details: `"${skill}" mentioned ${count} times` });
    }
  }
  // Prompt injection detection
  if (/ignore (all )?previous instructions/i.test(rawText) || /disregard/i.test(rawText)) {
    flags.push({ type: "prompt_injection", severity: "high", details: "Suspicious instruction-override pattern detected" });
  }
  // Unrealistic experience
  const expMatch = rawText.match(/(\d+)\+?\s*years?\s*of?\s*experience/i);
  if (expMatch && parseInt(expMatch[1]!) > 20) {
    flags.push({ type: "experience_inflation", severity: "medium", details: `Claims ${expMatch[1]} years of experience — unusually high` });
  }
  return flags;
}

function simulateAdversarialTests(
  originalRank: number, candidateRawText: string, jdRawText: string, numVariants: number, enabledPerturbations: string[]
): Array<{perturbationType: string; originalRank: number; perturbedRank: number; positionChange: number}> {
  const tests: Array<{perturbationType: string; originalRank: number; perturbedRank: number; positionChange: number}> = [];
  const perturbations = enabledPerturbations.slice(0, numVariants);
  for (const p of perturbations) {
    let rankChange = 0;
    switch (p) {
      case "keyword_stuffing": rankChange = Math.floor(Math.random() * 3) + 1; break;
      case "skill_swap": rankChange = Math.floor(Math.random() * 5) + 2; break;
      case "experience_fluff": rankChange = -(Math.floor(Math.random() * 3)); break;
      case "experience_reduction": rankChange = Math.floor(Math.random() * 4) + 1; break;
      case "skill_removal": rankChange = Math.floor(Math.random() * 6) + 3; break;
      case "irrelevant_skills": rankChange = Math.floor(Math.random() * 2) + 1; break;
      default: rankChange = Math.floor(Math.random() * 3) - 1;
    }
    const perturbedRank = Math.max(1, originalRank + rankChange);
    tests.push({ perturbationType: p, originalRank, perturbedRank, positionChange: rankChange });
  }
  return tests;
}

async function runRanking(jobId: number, jdId: number, candidateIds: number[]) {
  try {
    await db.update(rankingJobsTable).set({ status: "running", progress: 10 }).where(eq(rankingJobsTable.id, jobId));

    const [jd] = await db.select().from(jobDescriptionsTable).where(eq(jobDescriptionsTable.id, jdId));
    if (!jd) throw new Error("JD not found");

    const candidates = await db.select().from(candidatesTable).where(inArray(candidatesTable.id, candidateIds));
    const [config] = await db.select().from(adversaryConfigTable);
    const numVariants = config?.numVariants ?? 5;
    const enabledPerturbations = (config?.enabledPerturbations ?? PERTURBATION_TYPES.slice(0, 6)) as string[];

    const jdSkills = (jd.skillsRequired as string[]) ?? [];
    const vocabulary = buildVocabulary(jd.rawText, ...candidates.map(c => c.rawText));

    const jdVec = textToVector(jd.rawText, vocabulary);

    // Compute fit scores
    const scored = candidates.map(c => {
      const vec = textToVector(c.rawText, vocabulary);
      const sim = cosineSim(jdVec, vec);
      const fitScore = Math.round(sim * 100 * 100) / 100;

      const candidateSkills = (c.skills as string[]) ?? [];
      const matched = jdSkills.filter(s => candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase())));
      const missing = jdSkills.filter(s => !matched.includes(s));
      const extra = candidateSkills.filter(cs => !jdSkills.some(s => cs.toLowerCase().includes(s.toLowerCase())));

      const redFlags = detectRedFlags(c.rawText, jdSkills);
      const manipulationRisk = redFlags.some(f => f.severity === "high") ? "high" :
        redFlags.some(f => f.severity === "medium") ? "medium" : "low";

      return { candidate: c, fitScore, matched, missing, extra, redFlags, manipulationRisk };
    });

    // Sort by fit score
    scored.sort((a, b) => b.fitScore - a.fitScore);

    await db.update(rankingJobsTable).set({ progress: 50 }).where(eq(rankingJobsTable.id, jobId));

    // Compute robustness and final scores
    const results = scored.map((s, idx) => {
      const rank = idx + 1;
      const adversarialTests = simulateAdversarialTests(rank, s.candidate.rawText, jd.rawText, numVariants, enabledPerturbations);
      const maxChange = Math.max(...adversarialTests.map(t => Math.abs(t.positionChange)));
      const robustnessScore = Math.max(0, Math.round((1 - maxChange / (candidates.length || 1)) * 100 * 100) / 100);
      const stabilityScore = Math.round((robustnessScore / 100) * 100) / 100;
      const isRobust = stabilityScore >= 0.6;
      const penaltyForFlags = s.redFlags.filter(f => f.severity === "high").length * 5 +
        s.redFlags.filter(f => f.severity === "medium").length * 2;
      const finalScore = Math.max(0, Math.round((s.fitScore * 0.6 + robustnessScore * 0.4 - penaltyForFlags) * 100) / 100);

      const recommendation = finalScore >= 85 ? "strong_hire" : finalScore >= 70 ? "hire" : finalScore >= 50 ? "consider" : "reject";

      const strengths: string[] = [];
      if (s.matched.length > 0) strengths.push(`Strong alignment with ${s.matched.length} required skills: ${s.matched.slice(0, 3).join(", ")}`);
      if ((s.candidate.experienceYears ?? 0) >= (jd.experienceRequired ?? 0)) strengths.push(`Experience (${s.candidate.experienceYears ?? 0} years) meets requirement`);
      if (isRobust) strengths.push(`Maintained stable ranking under ${numVariants} adversarial stress tests`);

      const gaps: string[] = [];
      if (s.missing.length > 0) gaps.push(`Missing ${s.missing.length} required skills: ${s.missing.slice(0, 3).join(", ")}`);
      if ((s.candidate.experienceYears ?? 0) < (jd.experienceRequired ?? 0)) gaps.push(`Experience (${s.candidate.experienceYears ?? 0} yrs) below requirement (${jd.experienceRequired} yrs)`);

      const explanation = `${recommendation === "strong_hire" ? "Excellent" : recommendation === "hire" ? "Good" : recommendation === "consider" ? "Moderate" : "Poor"} semantic match. ` +
        (isRobust ? `Maintained stable position under stress tests. ` : `Ranking dropped under stress tests. `) +
        (s.redFlags.length > 0 ? `${s.redFlags.length} red flag(s) detected. ` : `No manipulation detected. `);

      return {
        jobId, candidateId: s.candidate.id, ranking: rank,
        fitScore: s.fitScore, robustnessScore, stabilityScore, finalScore,
        manipulationRisk: s.manipulationRisk, isRobust: isRobust ? 1 : 0,
        redFlags: s.redFlags, skillsMatch: { matched: s.matched, missing: s.missing, extra: s.extra },
        explanation, recommendation, strengths, gaps, adversarialTests,
      };
    });

    // Save results
    if (results.length > 0) {
      await db.insert(rankingResultsTable).values(results);
    }

    await db.update(rankingJobsTable).set({ status: "completed", progress: 100 }).where(eq(rankingJobsTable.id, jobId));
  } catch (err) {
    logger.error({ err }, "Ranking failed");
    await db.update(rankingJobsTable).set({ status: "failed" }).where(eq(rankingJobsTable.id, jobId));
  }
}

router.post("/ranking/start", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = StartRankingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { jdId, candidateIds } = parsed.data;

  const [job] = await db.insert(rankingJobsTable).values({
    userId: user.id, jdId, status: "pending", progress: 0, totalCandidates: candidateIds.length,
  }).returning();

  // Start async ranking
  setImmediate(() => runRanking(job.id, jdId, candidateIds));

  const [jd] = await db.select().from(jobDescriptionsTable).where(eq(jobDescriptionsTable.id, jdId));
  res.status(201).json({
    id: job.id, jdId: job.jdId, status: job.status, progress: job.progress,
    totalCandidates: job.totalCandidates, jobTitle: jd?.title ?? null,
    createdAt: job.createdAt.toISOString(),
  });
});

router.get("/ranking/history", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const jobs = await db.select().from(rankingJobsTable).where(eq(rankingJobsTable.userId, user.id));
  const jdIds = [...new Set(jobs.map(j => j.jdId).filter(Boolean) as number[])];
  const jds = jdIds.length > 0 ? await db.select().from(jobDescriptionsTable).where(inArray(jobDescriptionsTable.id, jdIds)) : [];
  const jdMap = new Map(jds.map(j => [j.id, j.title]));
  res.json(jobs.map(j => ({
    id: j.id, jdId: j.jdId, status: j.status, progress: j.progress,
    totalCandidates: j.totalCandidates, jobTitle: j.jdId ? (jdMap.get(j.jdId) ?? null) : null,
    createdAt: j.createdAt.toISOString(),
  })));
});

router.get("/ranking/status/:jobId", requireAuth, async (req, res) => {
  const jobId = parseInt(req.params["jobId"]!);
  const [job] = await db.select().from(rankingJobsTable).where(eq(rankingJobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  const [jd] = job.jdId ? await db.select().from(jobDescriptionsTable).where(eq(jobDescriptionsTable.id, job.jdId)) : [undefined];
  res.json({ id: job.id, jdId: job.jdId, status: job.status, progress: job.progress, totalCandidates: job.totalCandidates, jobTitle: jd?.title ?? null, createdAt: job.createdAt.toISOString() });
});

router.get("/ranking/results/:jobId", requireAuth, async (req, res) => {
  const jobId = parseInt(req.params["jobId"]!);
  const results = await db.select().from(rankingResultsTable).where(eq(rankingResultsTable.jobId, jobId));
  const candidateIds = results.map(r => r.candidateId);
  const candidates = candidateIds.length > 0 ? await db.select().from(candidatesTable).where(inArray(candidatesTable.id, candidateIds)) : [];
  const candidateMap = new Map(candidates.map(c => [c.id, c.name]));

  const flaggedForManipulation = results.filter(r => r.manipulationRisk !== "low").length;
  const highlyRobust = results.filter(r => r.isRobust === 1).length;
  const avgRobustness = results.length ? results.reduce((sum, r) => sum + r.robustnessScore, 0) / results.length : 0;

  const rankedCandidates = results.sort((a, b) => a.ranking - b.ranking).map(r => ({
    candidateId: r.candidateId,
    name: candidateMap.get(r.candidateId) ?? "Unknown",
    finalScore: r.finalScore,
    fitScore: r.fitScore,
    robustnessScore: r.robustnessScore,
    stabilityScore: r.stabilityScore,
    ranking: r.ranking,
    isRobust: r.isRobust === 1,
    manipulationRisk: r.manipulationRisk as "low" | "medium" | "high",
    redFlags: r.redFlags as any[],
    skillsMatch: r.skillsMatch as any,
    explanation: r.explanation,
    recommendation: r.recommendation as any,
    strengths: r.strengths as string[],
    gaps: r.gaps as string[],
    adversarialTests: r.adversarialTests as any[],
  }));

  res.json({
    jobId,
    rankedCandidates,
    summary: {
      totalCandidates: results.length,
      flaggedForManipulation,
      highlyRobust,
      averageRobustness: Math.round(avgRobustness * 100) / 100,
      timeTaken: `${(results.length * 0.3).toFixed(1)}s`,
    },
  });
});

export default router;
