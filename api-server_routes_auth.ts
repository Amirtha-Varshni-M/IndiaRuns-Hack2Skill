import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken, requireAuth } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, fullName, company } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    fullName,
    company,
    role: "user",
  }).returning();
  const token = generateToken(user.id, user.email);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, company: user.company, role: user.role, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = generateToken(user.id, user.email);
  res.json({
    token,
    user: { id: user.id, email: user.email, fullName: user.fullName, company: user.company, role: user.role, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, fullName: user.fullName, company: user.company, role: user.role, createdAt: user.createdAt.toISOString() });
});

export default router;
