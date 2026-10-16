// All API routes in one readable map.
// Order matters: middleware listed in a route runs left to right.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as auth from "../controllers/auth.controller.js";
import * as transactions from "../controllers/transaction.controller.js";
import * as summary from "../controllers/summary.controller.js";

// Slows down password guessing: at most 20 login/register attempts per
// 15 minutes from one IP address. Disabled in automated tests.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes and try again." },
  },
});

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));

// --- Authentication ---
apiRouter.post("/auth/register", authLimiter, auth.register);
apiRouter.post("/auth/login", authLimiter, auth.login);
apiRouter.post("/auth/logout", auth.logout);
apiRouter.get("/auth/me", requireAuth, auth.me);

// --- Everything below requires a logged-in user ---
const protectedRouter = Router();
protectedRouter.use(requireAuth);

// "/export" must come before "/:id", otherwise "export" would be read as an id.
protectedRouter.get("/transactions/export", transactions.exportCsv);
protectedRouter.get("/transactions", transactions.list);
protectedRouter.post("/transactions", transactions.create);
protectedRouter.get("/transactions/:id", transactions.getOne);
protectedRouter.put("/transactions/:id", transactions.update);
protectedRouter.delete("/transactions/:id", transactions.remove);

protectedRouter.get("/dashboard/summary", summary.dashboardSummary);
protectedRouter.get("/reports/monthly", summary.monthlyReport);
protectedRouter.get("/reports/categories", summary.categoryReport);

apiRouter.use(protectedRouter);
