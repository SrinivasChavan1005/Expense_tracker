// Shared helpers for the API tests.
import request from "supertest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { query } from "../src/config/db.js";

export const app = createApp();

// Safety net: refuse to wipe anything that isn't clearly a test database.
export async function resetDatabase() {
  if (!env.isTest || !env.db.database.endsWith("_test")) {
    throw new Error(`Refusing to clear "${env.db.database}": not a *_test database.`);
  }
  await query("DELETE FROM transactions");
  await query("DELETE FROM users");
}

let counter = 0;

// Registers a fresh user and returns a supertest "agent", which keeps the
// login cookie between requests just like a browser does.
export async function createLoggedInUser(overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const credentials = {
    name: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: "Password123",
    ...overrides,
  };
  const res = await agent.post("/api/auth/register").send(credentials);
  if (res.status !== 201) throw new Error(`Register failed: ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.data.user, credentials };
}

export function sampleTransaction(overrides = {}) {
  return {
    type: "expense",
    amount: "250.75",
    category: "Food",
    description: "Lunch",
    transactionDate: "2026-03-15",
    ...overrides,
  };
}
