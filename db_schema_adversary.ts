import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adversaryConfigTable = pgTable("adversary_config", {
  id: serial("id").primaryKey(),
  numVariants: integer("num_variants").notNull().default(5),
  intensity: text("intensity").notNull().default("medium"),
  enabledPerturbations: json("enabled_perturbations").$type<string[]>().notNull().default([
    "skill_swap", "experience_fluff", "keyword_stuffing",
    "irrelevant_skills", "experience_reduction", "skill_removal"
  ]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdversaryConfigSchema = createInsertSchema(adversaryConfigTable).omit({ id: true, updatedAt: true });
export type InsertAdversaryConfig = z.infer<typeof insertAdversaryConfigSchema>;
export type AdversaryConfig = typeof adversaryConfigTable.$inferSelect;
