import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";

const SECRET = process.env["SESSION_SECRET"] ?? "acrs-secret-key";

function hashPassword(password: string): string {
  return createHmac("sha256", SECRET).update(password).digest("hex");
}

async function seed() {
  const email = "demo@acrs.io";
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    console.log("Demo user already exists:", email);
    process.exit(0);
  }
  await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword("demo1234"),
    fullName: "Demo User",
    company: "ACRS Demo",
    role: "admin",
  });
  console.log("Seeded demo user:", email, "/ demo1234");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
