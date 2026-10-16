// API tests for transaction CRUD, filtering and ownership isolation.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app, resetDatabase, createLoggedInUser, sampleTransaction } from "./helpers.js";
import { pool } from "../src/config/db.js";

beforeEach(resetDatabase);
afterAll(() => pool.end());

describe("authentication is required", () => {
  it.each([
    ["get", "/api/transactions"],
    ["post", "/api/transactions"],
    ["get", "/api/transactions/1"],
    ["put", "/api/transactions/1"],
    ["delete", "/api/transactions/1"],
    ["get", "/api/dashboard/summary"],
    ["get", "/api/reports/monthly"],
    ["get", "/api/reports/categories"],
    ["get", "/api/transactions/export"],
  ])("%s %s returns 401 without a login", async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});

describe("CRUD", () => {
  it("creates, reads, updates and deletes a transaction", async () => {
    const { agent } = await createLoggedInUser();

    const created = await agent.post("/api/transactions").send(sampleTransaction());
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      type: "expense",
      amount: 250.75,
      category: "Food",
      description: "Lunch",
      transactionDate: "2026-03-15",
    });
    const { id } = created.body.data;

    const fetched = await agent.get(`/api/transactions/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const updated = await agent
      .put(`/api/transactions/${id}`)
      .send(sampleTransaction({ amount: 300, description: "Team lunch" }));
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ amount: 300, description: "Team lunch" });

    const deleted = await agent.delete(`/api/transactions/${id}`);
    expect(deleted.status).toBe(200);

    const afterDelete = await agent.get(`/api/transactions/${id}`);
    expect(afterDelete.status).toBe(404);
  });

  it("rejects invalid payloads with 400 and field details", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent
      .post("/api/transactions")
      .send({ type: "income", amount: -5, category: "Food", transactionDate: "2026-02-30" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details).sort()).toEqual([
      "amount",
      "category",
      "transactionDate",
    ]);
  });

  it("ignores a user_id sent in the body", async () => {
    const { agent, user } = await createLoggedInUser();
    const res = await agent
      .post("/api/transactions")
      .send(sampleTransaction({ userId: 999999, user_id: 999999 }));
    expect(res.status).toBe(201);
    const list = await agent.get("/api/transactions");
    expect(list.body.data).toHaveLength(1);
    expect(user.id).not.toBe(999999);
  });
});

describe("ownership isolation", () => {
  it("one user cannot read, edit or delete another user's transaction", async () => {
    const alice = await createLoggedInUser();
    const bob = await createLoggedInUser();

    const created = await alice.agent.post("/api/transactions").send(sampleTransaction());
    const { id } = created.body.data;

    expect((await bob.agent.get(`/api/transactions/${id}`)).status).toBe(404);
    expect((await bob.agent.put(`/api/transactions/${id}`).send(sampleTransaction({ amount: 1 }))).status).toBe(404);
    expect((await bob.agent.delete(`/api/transactions/${id}`)).status).toBe(404);

    const bobList = await bob.agent.get("/api/transactions");
    expect(bobList.body.data).toHaveLength(0);

    // Alice's row is untouched.
    const aliceView = await alice.agent.get(`/api/transactions/${id}`);
    expect(aliceView.body.data.amount).toBe(250.75);
  });
});

describe("listing, filters and sorting", () => {
  async function seed(agent) {
    const rows = [
      sampleTransaction({ amount: "100", category: "Food", description: "Groceries", transactionDate: "2026-01-10" }),
      sampleTransaction({ amount: "2500", category: "Travel", description: "Flight to Pune", transactionDate: "2026-02-05" }),
      sampleTransaction({ amount: "40", category: "Food", description: "Coffee 50% off", transactionDate: "2026-02-20" }),
      sampleTransaction({ type: "income", amount: "50000", category: "Salary", description: "Salary", transactionDate: "2026-02-01" }),
    ];
    for (const row of rows) await agent.post("/api/transactions").send(row);
  }

  it("filters by type, category, date range and amount", async () => {
    const { agent } = await createLoggedInUser();
    await seed(agent);

    const expenses = await agent.get("/api/transactions?type=expense");
    expect(expenses.body.meta.pagination.total).toBe(3);
    expect(expenses.body.meta.totalAmount).toBe(2640);

    const food = await agent.get("/api/transactions?type=expense&category=Food");
    expect(food.body.data.map((t) => t.amount).sort((a, b) => a - b)).toEqual([40, 100]);

    const feb = await agent.get("/api/transactions?type=expense&from=2026-02-01&to=2026-02-28");
    expect(feb.body.data).toHaveLength(2);

    const big = await agent.get("/api/transactions?type=expense&minAmount=50&maxAmount=1000");
    expect(big.body.data.map((t) => t.amount)).toEqual([100]);
  });

  it("searches descriptions, treating % as a literal character", async () => {
    const { agent } = await createLoggedInUser();
    await seed(agent);
    const res = await agent.get("/api/transactions?search=50%25");
    expect(res.body.data.map((t) => t.description)).toEqual(["Coffee 50% off"]);
  });

  it("sorts and paginates", async () => {
    const { agent } = await createLoggedInUser();
    await seed(agent);
    const page1 = await agent.get("/api/transactions?type=expense&sort=amount&order=asc&limit=2&page=1");
    const page2 = await agent.get("/api/transactions?type=expense&sort=amount&order=asc&limit=2&page=2");
    expect(page1.body.data.map((t) => t.amount)).toEqual([40, 100]);
    expect(page2.body.data.map((t) => t.amount)).toEqual([2500]);
    expect(page1.body.meta.pagination).toMatchObject({ total: 3, totalPages: 2 });
  });

  it("rejects an unknown sort column", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get("/api/transactions?sort=password_hash");
    expect(res.status).toBe(400);
  });

  it("exports the user's filtered transactions as CSV", async () => {
    const { agent } = await createLoggedInUser();
    await seed(agent);
    const res = await agent.get("/api/transactions/export?type=income");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    const lines = res.text.replace(/^﻿/, "").split("\r\n");
    expect(lines).toEqual([
      '"Date","Type","Category","Description","Amount"',
      '"2026-02-01","income","Salary","Salary","50000.00"',
    ]);
  });
});

describe("CSRF protection", () => {
  it("rejects state-changing requests from an unknown origin", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent
      .post("/api/transactions")
      .set("Origin", "https://evil.example")
      .send(sampleTransaction());
    expect(res.status).toBe(403);
  });

  it("accepts requests from the configured frontend origin", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent
      .post("/api/transactions")
      .set("Origin", "http://localhost:5173")
      .send(sampleTransaction());
    expect(res.status).toBe(201);
  });

  it("rejects form-encoded bodies (what a malicious HTML form would send)", async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent
      .post("/api/transactions")
      .type("form")
      .send("type=expense&amount=10&category=Food&transactionDate=2026-01-01");
    expect(res.status).toBe(403);
  });
});
