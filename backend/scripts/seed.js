// OPTIONAL: creates a demo account with clearly marked SAMPLE transactions,
// so you can explore the dashboard and reports without typing data by hand.
//
// Usage: set SEED_DEMO_PASSWORD in backend/.env, then run `npm run db:seed`.
// - The password is read from your .env; it is never written in this file.
// - Every sample description starts with "[Sample]".
// - If the demo account already exists, nothing is changed.
import bcrypt from "bcryptjs";
import { pool, query } from "../src/config/db.js";
import { validateRegistration } from "../src/utils/validation.js";
import { addMonths, lastDayOfMonth, toDateString } from "../src/utils/dates.js";

const DEMO_EMAIL = "demo@example.com";

// [day of month, type, category, amount, description]
const MONTHLY_PATTERN = [
  [1, "income", "Salary", 65000, "Monthly salary"],
  [2, "expense", "Rent", 18000, "Apartment rent"],
  [5, "expense", "Bills", 2400, "Electricity and internet"],
  [8, "expense", "Food", 5200, "Groceries"],
  [12, "expense", "Travel", 1800, "Metro card and cabs"],
  [15, "income", "Freelance", 12000, "Website project"],
  [18, "expense", "Shopping", 3500, "Clothes"],
  [22, "expense", "Food", 2600, "Eating out"],
  [26, "expense", "Entertainment", 900, "Movie tickets"],
];

async function main() {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) {
    throw new Error("Set SEED_DEMO_PASSWORD in backend/.env before running the seed script.");
  }
  // Same password rules as the real sign-up form.
  validateRegistration({ name: "Demo User", email: DEMO_EMAIL, password });

  const existing = await query("SELECT id FROM users WHERE email = ?", [DEMO_EMAIL]);
  if (existing.length > 0) {
    console.log(`ℹ Demo account ${DEMO_EMAIL} already exists; nothing changed.`);
    return;
  }

  const connection = await pool.getConnection();
  try {
    // A transaction makes the seed all-or-nothing.
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      ["Demo User", DEMO_EMAIL, await bcrypt.hash(password, 12)]
    );
    const userId = userResult.insertId;

    const today = toDateString(new Date());
    const currentMonth = today.slice(0, 7);
    let count = 0;

    // Six months of history ending with the current month.
    for (let offset = -5; offset <= 0; offset += 1) {
      const monthKey = addMonths(currentMonth, offset);
      const [year, month] = monthKey.split("-").map(Number);
      for (const [day, type, category, amount, description] of MONTHLY_PATTERN) {
        const safeDay = Math.min(day, lastDayOfMonth(year, month));
        const date = `${monthKey}-${String(safeDay).padStart(2, "0")}`;
        if (date > today) continue; // no future-dated sample data
        // Vary amounts a little so the charts aren't flat.
        const variation = 1 + ((offset * 7 + day) % 9) / 50;
        await connection.execute(
          `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, type, (amount * variation).toFixed(2), category, `[Sample] ${description}`, date]
        );
        count += 1;
      }
    }

    await connection.commit();
    console.log(`✔ Created demo account ${DEMO_EMAIL} with ${count} sample transactions.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main()
  .catch((error) => {
    console.error("✖ Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
