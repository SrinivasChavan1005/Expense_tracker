// Creating and reading the JWT, and the settings for the cookie that carries it.
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "token";
const SESSION_SECONDS = Math.round(env.sessionHours * 60 * 60);

export function signToken(userId) {
  // `sub` (subject) is the standard JWT claim for "who this token is about".
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: SESSION_SECONDS,
    algorithm: "HS256",
  });
}

// Throws if the token is missing, tampered with or expired.
export function verifyToken(token) {
  // Pinning the algorithm stops an attacker from choosing a weaker one.
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
}

// Cookie settings:
// - httpOnly: JavaScript in the page cannot read it, so an XSS bug cannot steal it.
// - sameSite "lax": the browser will not send it on cross-site POST/PUT/DELETE.
// - secure: only sent over HTTPS (enabled in production; local dev uses http).
const baseCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
});

export function authCookieOptions() {
  return { ...baseCookieOptions(), maxAge: SESSION_SECONDS * 1000 };
}

// clearCookie must use the same options (minus maxAge) to match the cookie.
export function clearAuthCookieOptions() {
  return baseCookieOptions();
}
