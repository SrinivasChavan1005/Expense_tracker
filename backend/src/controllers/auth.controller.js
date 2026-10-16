// Handles sign-up, login, logout and "who am I?".
// Controllers stay thin: validate input -> call a service -> send a response.
import bcrypt from "bcryptjs";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import { conflict, unauthorized } from "../utils/AppError.js";
import {
  AUTH_COOKIE_NAME,
  signToken,
  authCookieOptions,
  clearAuthCookieOptions,
} from "../utils/authToken.js";
import {
  createUser,
  findUserById,
  findUserWithPasswordByEmail,
} from "../services/user.service.js";

// Cost factor 12 = 2^12 hashing rounds: slow enough to make brute-forcing a
// stolen hash expensive, fast enough (~250 ms) for a login request.
const BCRYPT_ROUNDS = 12;

// Used when the email doesn't exist so the response takes about as long as a
// real password check. Otherwise response timing would reveal which emails
// are registered.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

function startSession(res, userId) {
  res.cookie(AUTH_COOKIE_NAME, signToken(userId), authCookieOptions());
}

export async function register(req, res) {
  const { name, email, password } = validateRegistration(req.body);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await createUser({ name, email, passwordHash });
  } catch (error) {
    // The UNIQUE index on users.email is the real guarantee against
    // duplicates, even if two sign-ups race each other.
    if (error.code === "ER_DUP_ENTRY") {
      throw conflict("An account with this email already exists.");
    }
    throw error;
  }

  startSession(res, user.id);
  res.status(201).json({ success: true, data: { user } });
}

export async function login(req, res) {
  const { email, password } = validateLogin(req.body);
  const record = await findUserWithPasswordByEmail(email);

  const passwordMatches = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
  if (!record || !passwordMatches) {
    // Same message for "no such email" and "wrong password".
    throw unauthorized("Invalid email or password.");
  }

  const { passwordHash, ...user } = record;
  startSession(res, user.id);
  res.json({ success: true, data: { user } });
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions());
  res.json({ success: true, data: { message: "Logged out." } });
}

export async function me(req, res) {
  const user = await findUserById(req.userId);
  if (!user) {
    // Valid token, but the account no longer exists.
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions());
    throw unauthorized();
  }
  res.json({ success: true, data: { user } });
}
