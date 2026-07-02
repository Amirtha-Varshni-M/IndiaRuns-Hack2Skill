import { pgTable, serial, text, integer, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobDescriptionsTable } from "./jobs";
import { candidatesTable } from "./candidates";

export const rankingJobsTable = pgTable("ranking_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  jdId: integer("jd_id").references(() => jobDescriptionsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  totalCandidates: integer("total_candidates").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rankingResultsTable = pgTable("ranking_results", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => rankingJobsTable.id, { onDelete: "cascade" }).notNull(),
  candidateId: integer("candidate_id").references(() => candidatesTable.id, { onDelete: "cascade" }).notNull(),
  ranking: integer("ranking").notNull(),
  fitScore: real("fit_score").notNull().default(0),
  robustnessScore: real("robustness_score").notNull().default(0),
  stabilityScore: real("stability_score").notNull().default(0),
  finalScore: real("final_score").notNull().default(0),
  manipulationRisk: text("manipulation_risk").notNull().default("low"),
  isRobust: integer("is_robust").notNull().default(0),
  redFlags: json("red_flags").$type<Array<{type: string; severity: string; details: string}>>().notNull().default([]),
  skillsMatch: json("skills_match").$type<{matched: string[]; missing: string[]; extra: string[]}>().notNull().default({ matched: [], missing: [], extra: [] }),
  explanation: text("explanation").notNull().default(""),
  recommendation: text("recommendation").notNull().default("consider"),
  strengths: json("strengths").$type<string[]>().notNull().default([]),
  gaps: json("gaps").$type<string[]>().notNull().default([]),
  adversarialTests: json("adversarial_tests").$type<Array<{perturbationType: string; originalRank: number; perturbedRank: number; positionChange: number}>>().notNull().default([]),
});

export const insertRankingJobSchema = createInsertSchema(rankingJobsTable).omit({ id: true, createdAt: true });
export type InsertRankingJob = z.infer<typeof insertRankingJobSchema>;
export type RankingJob = typeof rankingJobsTable.$inferSelect;
export type RankingResult = typeof rankingResultsTable.$inferSelect;
