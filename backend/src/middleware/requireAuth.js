// Protects routes: only requests carrying a valid, unexpired JWT cookie get
// through. On success it sets `req.userId`, which every controller then uses to
// scope its database queries to that user.
import { AUTH_COOKIE_NAME, verifyToken } from "../utils/authToken.js";
import { unauthorized } from "../utils/AppError.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return next(unauthorized());

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) throw new Error("Bad subject");
    req.userId = userId;
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Please log in to continue.";
    return next(unauthorized(message));
  }
}
