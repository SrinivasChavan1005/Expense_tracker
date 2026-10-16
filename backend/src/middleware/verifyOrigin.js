// CSRF protection for state-changing requests (POST, PUT, PATCH, DELETE).
//
// Because the login cookie is sent automatically by the browser, another
// website could try to trick a logged-in user's browser into calling our API
// (cross-site request forgery). Three layers stop that:
//   1. The cookie is SameSite=Lax, so browsers don't attach it to cross-site
//      POST/PUT/DELETE requests.
//   2. This middleware rejects requests whose Origin header is not one of our
//      own frontends. (SameSite alone treats every localhost port as the same
//      "site", so this check matters during development too.)
//   3. Requests with a body must be JSON. A plain HTML form cannot send JSON,
//      and a cross-origin script that tries needs a CORS preflight, which our
//      CORS policy refuses for unknown origins.
import { env } from "../config/env.js";
import { forbidden } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  // Browsers always send Origin on these methods. Tools like curl or our
  // automated tests may omit it; they are not victims of CSRF (CSRF needs a
  // victim's browser), so they are allowed through.
  if (origin && !env.clientOrigins.includes(origin)) {
    return next(forbidden("Request origin is not allowed."));
  }

  const hasBody = Number(req.get("content-length") || 0) > 0 || req.get("transfer-encoding");
  if (hasBody && !req.is("application/json")) {
    return next(forbidden("Requests must be sent as JSON."));
  }

  return next();
}
