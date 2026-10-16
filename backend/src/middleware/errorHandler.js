// Centralized error handling. Controllers never build error responses
// themselves; they throw, and Express 5 automatically forwards errors (including
// rejected promises from async handlers) to this middleware.
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found.` },
  });
}

// Express recognizes error middleware by its four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Malformed JSON body sent by the client.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON." },
    });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Anything else is a bug or an infrastructure problem (e.g. MySQL is down).
  // Log the details on the server, but never send stack traces, SQL or
  // credentials to the client.
  if (!env.isTest) console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our side. Please try again.",
      ...(env.isProduction ? {} : { debug: err.message }),
    },
  });
}
