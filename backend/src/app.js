// Builds the Express application (without starting it). Keeping this separate
// from server.js lets the automated tests import the app and send requests to
// it directly, without opening a real network port.
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { verifyOrigin } from "./middleware/verifyOrigin.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  // Hide the "X-Powered-By: Express" header and add standard security headers.
  app.disable("x-powered-by");
  app.use(helmet());

  // CORS: only our own frontend origin(s) may call the API from a browser,
  // and `credentials: true` allows the auth cookie to be sent along.
  // (In development the Vite proxy makes requests same-origin anyway.)
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

  app.use(express.json({ limit: "10kb" })); // parse JSON bodies, reject huge ones
  app.use(cookieParser()); // fills req.cookies
  app.use(verifyOrigin); // CSRF protection for state-changing requests

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
