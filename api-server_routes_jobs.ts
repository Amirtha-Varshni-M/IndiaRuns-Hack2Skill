import { Router } from "express";
import { db } from "@workspace/db";
import { jobDescriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateJobBody, UpdateJobBody } from "@workspace/api-zod";

const router = Router();

router.get("/jobs", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const jobs = await db.select().from(jobDescriptionsTable).where(eq(jobDescriptionsTable.userId, user.id));
  res.json(jobs.map(j => ({
    id: j.id, title: j.title, department: j.department,
    experienceRequired: j.experienceRequired, skillsRequired: j.skillsRequired,
    rawText: j.rawText, createdAt: j.createdAt.toISOString(),
  })));
});

router.post("/jobs", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { title, department, experienceRequired, skillsRequired, rawText } = parsed.data;
  const [job] = await db.insert(jobDescriptionsTable).values({
    userId: user.id, title, department: department ?? null,
    experienceRequired: experienceRequired ?? null,
    skillsRequired: skillsRequired ?? [],
    rawText,
  }).returning();
  res.status(201).json({
    id: job.id, title: job.title, department: job.department,
    experienceRequired: job.experienceRequired, skillsRequired: job.skillsRequired,
    rawText: job.rawText, createdAt: job.createdAt.toISOString(),
  });
});

router.get("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [job] = await db.select().from(jobDescriptionsTable).where(eq(jobDescriptionsTable.id, id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: job.id, title: job.title, department: job.department, experienceRequired: job.experienceRequired, skillsRequired: job.skillsRequired, rawText: job.rawText, createdAt: job.createdAt.toISOString() });
});

router.put("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [job] = await db.update(jobDescriptionsTable).set(parsed.data).where(eq(jobDescriptionsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: job.id, title: job.title, department: job.department, experienceRequired: job.experienceRequired, skillsRequired: job.skillsRequired, rawText: job.rawText, createdAt: job.createdAt.toISOString() });
});

router.delete("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  await db.delete(jobDescriptionsTable).where(eq(jobDescriptionsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
