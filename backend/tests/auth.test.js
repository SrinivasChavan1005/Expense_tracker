// API tests for registration, login, logout and session checks.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app, resetDatabase, createLoggedInUser } from "./helpers.js";
import { pool, query } from "../src/config/db.js";
import { env } from "../src/config/env.js";

beforeEach(resetDatabase);
afterAll(() => pool.end());

const newUser = {
  name: "Priya Sharma",
  email: "priya@example.com",
  password: "SecurePass1",
};

describe("POST /api/auth/register", () => {
  it("creates a user, stores a bcrypt hash and sets an HttpOnly cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: "Priya Sharma", email: "priya@example.com" });
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(res.body)).not.toContain("SecurePass1");

    const cookie = res.headers["set-cookie"][0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const [row] = await query("SELECT password_hash FROM users WHERE email = ?", [newUser.email]);
    expect(row.password_hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost 12
    expect(row.password_hash).not.toContain(newUser.password);
  });

  it("rejects a duplicate email (case-insensitive) with 409", async () => {
    await request(app).post("/api/auth/register").send(newUser);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...newUser, email: "PRIYA@example.com" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("returns field-level errors for invalid input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "", email: "nope", password: "short" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details).sort()).toEqual(["email", "name", "password"]);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(newUser);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "Priya@Example.com", password: newUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("priya@example.com");
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a wrong password with a generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: "WrongPass1" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password.");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("gives the same answer for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Whatever1" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password.");
  });
});

describe("session handling", () => {
  it("GET /api/auth/me returns the user for a valid cookie", async () => {
    const { agent, user } = await createLoggedInUser();
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it("rejects requests with no cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const { user } = await createLoggedInUser();
    const expired = jwt.sign(
      { sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 60 },
      env.jwtSecret
    );
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/expired/i);
  });

  it("rejects a token signed with a different secret", async () => {
    const { user } = await createLoggedInUser();
    const forged = jwt.sign({ sub: String(user.id) }, "attacker-secret-that-is-long-enough-123");
    const res = await request(app).get("/api/auth/me").set("Cookie", `token=${forged}`);
    expect(res.status).toBe(401);
  });

  it("logout clears the cookie so the next request is rejected", async () => {
    const { agent } = await createLoggedInUser();
    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"][0]).toMatch(/token=;/);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
