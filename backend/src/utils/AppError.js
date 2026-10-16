// An error we throw on purpose, carrying the HTTP status the client should get.
// The central error handler turns it into a consistent JSON response.
export class AppError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) =>
  new AppError(400, message, { code: "VALIDATION_ERROR", details });

export const unauthorized = (message = "Please log in to continue.") =>
  new AppError(401, message, { code: "UNAUTHORIZED" });

export const forbidden = (message = "You are not allowed to do that.") =>
  new AppError(403, message, { code: "FORBIDDEN" });

export const notFound = (message = "Not found.") =>
  new AppError(404, message, { code: "NOT_FOUND" });

export const conflict = (message) =>
  new AppError(409, message, { code: "CONFLICT" });
