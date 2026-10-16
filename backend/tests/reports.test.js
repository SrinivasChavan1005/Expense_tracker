// Checks that dashboard and report figures exactly match known data.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDatabase, createLoggedInUser, sampleTransaction } from "./helpers.js";
import { pool } from "../src/config/db.js";

beforeEach(resetDatabase);
afterAll(() => pool.end());

async function seedKnownData(agent) {
  const rows = [
    // January 2026
    { type: "income", amount: "50000.00", category: "Salary", transactionDate: "2026-01-01" },
    { type: "expense", amount: "12000.10", category: "Rent", transactionDate: "2026-01-02" },
    { type: "expense", amount: "0.20", category: "Food", transactionDate: "2026-01-15" },
    // February 2026: nothing (an empty month)
    // March 2026
    { type: "income", amount: "0.10", category: "Gifts", transactionDate: "2026-03-03" },
    { type: "expense", amount: "3000.00", category: "Food", transactionDate: "2026-03-10" },
    { type: "expense", amount: "1000.00", category: "Travel", transactionDate: "2026-03-31" },
  ];
  for (const row of rows) {
    const res = await agent.post("/api/transactions").send(sampleTransaction(row));
    expect(res.status).toBe(201);
  }
}

describe("GET /api/dashboard/summary", () => {
  it("separates period totals from the all-time balance", async () => {
    const { agent } = await createLoggedInUser();
    await seedKnownData(agent);

    const res = await agent.get("/api/dashboard/summary?from=2026-03-01&to=2026-03-31");
    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.totals).toEqual({ income: 0.1, expense: 4000, net: -3999.9, count: 3 });
    // All time: 50000.10 income - 16000.30 expense (exact decimal arithmetic).
    expect(data.allTime).toEqual({ income: 50000.1, expense: 16000.3, balance: 33999.8 });
    expect(data.expenseByCategory).toEqual([
      { category: "Food", total: 3000, count: 1, percentage: 75 },
      { category: "Travel", total: 1000, count: 1, percentage: 25 },
    ]);
    expect(data.monthlyTrend.months.map((m) => m.month)).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(data.recentTransactions).toHaveLength(5);
    expect(data.recentTransactions[0].transactionDate).toBe("2026-03-31");
  });

  it("returns zeros, not errors, for a user with no data", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get("/api/dashboard/summary");
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({ income: 0, expense: 0, net: 0, count: 0 });
    expect(res.body.data.expenseByCategory).toEqual([]);
    expect(res.body.data.recentTransactions).toEqual([]);
  });

  it("does not include other users' money", async () => {
    const alice = await createLoggedInUser();
    const bob = await createLoggedInUser();
    await seedKnownData(alice.agent);
    const res = await bob.agent.get("/api/dashboard/summary?from=2026-01-01&to=2026-12-31");
    expect(res.body.data.totals.count).toBe(0);
    expect(res.body.data.allTime.balance).toBe(0);
  });
});

describe("GET /api/reports/monthly", () => {
  it("fills empty months with zeros and totals the range", async () => {
    const { agent } = await createLoggedInUser();
    await seedKnownData(agent);

    const res = await agent.get("/api/reports/monthly?from=2026-01-01&to=2026-03-31");
    expect(res.status).toBe(200);
    expect(res.body.data.months).toEqual([
      { month: "2026-01", income: 50000, expense: 12000.3, net: 37999.7 },
      { month: "2026-02", income: 0, expense: 0, net: 0 },
      { month: "2026-03", income: 0.1, expense: 4000, net: -3999.9 },
    ]);
    expect(res.body.data.totals).toEqual({ income: 50000.1, expense: 16000.3, net: 33999.8, count: 6 });
  });

  it("validates the date range", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get("/api/reports/monthly?from=2026-05-01&to=2026-01-01");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/reports/categories", () => {
  it("breaks down income or expenses by category", async () => {
    const { agent } = await createLoggedInUser();
    await seedKnownData(agent);

    const expenses = await agent.get("/api/reports/categories?from=2026-01-01&to=2026-03-31");
    expect(expenses.body.data.total).toBe(16000.3);
    expect(expenses.body.data.categories.map((c) => [c.category, c.total])).toEqual([
      ["Rent", 12000.1],
      ["Food", 3000.2],
      ["Travel", 1000],
    ]);

    const income = await agent.get("/api/reports/categories?type=income&from=2026-01-01&to=2026-03-31");
    expect(income.body.data.categories.map((c) => c.category)).toEqual(["Salary", "Gifts"]);
  });

  it("rejects an invalid type", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get("/api/reports/categories?type=transfer");
    expect(res.status).toBe(400);
  });
});
