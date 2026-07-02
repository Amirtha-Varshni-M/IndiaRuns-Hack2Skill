import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const jobDescriptionsTable = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  department: text("department"),
  experienceRequired: integer("experience_required"),
  skillsRequired: json("skills_required").$type<string[]>().notNull().default([]),
  rawText: text("raw_text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobDescriptionsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobDescription = typeof jobDescriptionsTable.$inferSelect;
