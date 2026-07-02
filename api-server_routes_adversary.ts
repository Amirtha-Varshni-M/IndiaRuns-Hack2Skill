import { Router } from "express";
import { db } from "@workspace/db";
import { adversaryConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpdateAdversaryConfigBody } from "@workspace/api-zod";

const router = Router();

const PERTURBATION_TYPES = [
  { key: "skill_swap", label: "Skill Swap", description: "Replace 1-3 key skills with irrelevant ones" },
  { key: "experience_fluff", label: "Experience Fluff", description: "Inflate experience by 2-10 years" },
  { key: "education_downgrade", label: "Education Downgrade", description: "Lower education level by 1-2 steps" },
  { key: "keyword_stuffing", label: "Keyword Stuffing", description: "Add 5-15 repetitions of key skills" },
  { key: "irrelevant_skills", label: "Irrelevant Skills", description: "Add 2-5 random irrelevant skills" },
  { key: "experience_reduction", label: "Experience Reduction", description: "Reduce experience by 2-7 years" },
  { key: "skill_removal", label: "Skill Removal", description: "Remove 1-3 important skills" },
  { key: "education_upgrade", label: "Education Upgrade", description: "Raise education level artificially" },
  { key: "company_reputation_change", label: "Company Reputation Change", description: "Change company prestige level" },
  { key: "award_exaggeration", label: "Award Exaggeration", description: "Add fake awards and certifications" },
  { key: "publication_falsification", label: "Publication Falsification", description: "Add fake publications and research" },
];

async function getOrCreateConfig() {
  const [existing] = await db.select().from(adversaryConfigTable);
  if (existing) return existing;
  const [created] = await db.insert(adversaryConfigTable).values({
    numVariants: 5,
    intensity: "medium",
    enabledPerturbations: ["skill_swap", "experience_fluff", "keyword_stuffing", "irrelevant_skills", "experience_reduction", "skill_removal"],
  }).returning();
  return created!;
}

router.get("/adversary/config", requireAuth, async (_req, res) => {
  const config = await getOrCreateConfig();
  res.json({
    id: config.id,
    numVariants: config.numVariants,
    intensity: config.intensity,
    enabledPerturbations: config.enabledPerturbations,
  });
});

router.post("/adversary/config", requireAuth, async (req, res) => {
  const parsed = UpdateAdversaryConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const config = await getOrCreateConfig();
  const [updated] = await db
    .update(adversaryConfigTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(adversaryConfigTable.id, config.id))
    .returning();
  res.json({
    id: updated!.id,
    numVariants: updated!.numVariants,
    intensity: updated!.intensity,
    enabledPerturbations: updated!.enabledPerturbations,
  });
});

router.get("/adversary/perturbation-types", requireAuth, (_req, res) => {
  res.json(PERTURBATION_TYPES);
});

export default router;
