import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateCandidateBody } from "@workspace/api-zod";

const router = Router();

router.get("/candidates", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
  res.json(candidates.map(c => ({
    id: c.id, name: c.name, email: c.email, skills: c.skills,
    experienceYears: c.experienceYears, education: c.education,
    rawText: c.rawText, createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/candidates", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateCandidateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { name, email, skills, experienceYears, education, rawText } = parsed.data;
  const [candidate] = await db.insert(candidatesTable).values({
    userId: user.id, name, email: email ?? null,
    skills: skills ?? [], experienceYears: experienceYears ?? null,
    education: education ?? null, rawText,
  }).returning();
  res.status(201).json({
    id: candidate.id, name: candidate.name, email: candidate.email,
    skills: candidate.skills, experienceYears: candidate.experienceYears,
    education: candidate.education, rawText: candidate.rawText,
    createdAt: candidate.createdAt.toISOString(),
  });
});

router.get("/candidates/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [c] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: c.id, name: c.name, email: c.email, skills: c.skills, experienceYears: c.experienceYears, education: c.education, rawText: c.rawText, createdAt: c.createdAt.toISOString() });
});

router.delete("/candidates/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  await db.delete(candidatesTable).where(eq(candidatesTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
