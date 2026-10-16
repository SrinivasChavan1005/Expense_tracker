# Architecture

This document explains how the pieces fit together, in plain language, so you can describe the project confidently.

## The big picture

```
 Browser (React app)                Express API (Node.js)                 MySQL
 ───────────────────               ─────────────────────                ───────
 Page component                     routes/index.js
   │ calls                            │ picks the handler
 api/transactionsApi.js               ▼
   │ uses                           middleware: helmet → cors → json → cookies
 api/client.js (Axios)               → verifyOrigin (CSRF) → requireAuth
   │  GET /api/transactions?...       │  sets req.userId from the JWT cookie
   │  (cookie sent automatically)     ▼
   ▼                                controllers/transaction.controller.js
 Vite dev proxy ── /api ──────────▶   │ validates input (utils/validation.js)
 (localhost:5173 → :5000)             ▼
                                    services/transaction.service.js ────▶  SELECT … WHERE user_id = ?
                                      │ parameterized SQL                   users / transactions
   ◀──────────── JSON ─────────────  ◀┘
 setState → React re-renders
```

### The life of one request: "show my expenses"

1. **React.** The Expenses page renders `TransactionsView` with `type="expense"`. Its `useApiData` hook runs an effect that calls `getTransactions({ type: "expense", page: 1, … })`.
2. **Axios.** `api/client.js` sends `GET /api/transactions?type=expense&page=1`. The browser attaches the `token` cookie automatically because of `withCredentials: true`.
3. **Vite proxy.** In development, the Vite dev server forwards `/api/*` to `http://localhost:5000`. The browser only ever talks to one origin, which keeps the cookie simple.
4. **Express middleware**, in order:
   - `helmet` adds security headers.
   - `cors` allows only our frontend.
   - `express.json` parses the body, up to 10 KB.
   - `cookieParser` reads the cookie.
   - `verifyOrigin` handles CSRF.
   - `requireAuth` verifies the JWT and sets `req.userId`.
5. **Controller.** `transaction.controller.list` validates and normalizes the query string. Bad input becomes a 400 response with per-field messages.
6. **Service.** `listTransactions` builds `WHERE user_id = ? AND type = ? …` with `?` placeholders, so MySQL receives the values separately from the SQL text.
7. **Response.** `{ success, data, meta }` comes back. The hook stores it in state, React re-renders the table, and the loading spinner disappears.
8. **Errors.** Anything thrown anywhere goes to `middleware/errorHandler.js`. Express 5 catches rejected promises automatically, so there's no `try/catch` in every controller. The handler returns a consistent JSON error and never leaks stack traces in production.

## Backend layers

| Layer | Responsibility | Rule of thumb |
|---|---|---|
| `routes/` | Map URL + method to middleware + controller | No logic |
| `middleware/` | Cross-cutting checks (auth, CSRF, errors) | Runs for many routes |
| `controllers/` | Validate input, call a service, shape the response | No SQL |
| `services/` | All database access and financial maths | No `req`/`res` |
| `utils/` | Pure helpers (validation, dates, CSV, JWT) | Easy to unit-test |

**Why separate controllers and services?** Each layer can be understood and tested on its own, and the same service can be reused. For example, the dashboard and the reports both call `summary.service.js`, so a total can't be calculated two different ways.

## Database design

- **`users`**: `email` has a `UNIQUE` index. Its case-insensitive collation means `A@x.com` and `a@x.com` collide. `password_hash` stores the bcrypt hash only.
- **`transactions`**:
  - `user_id` is a foreign key to `users.id` (`ON DELETE CASCADE`), so every row belongs to exactly one user.
  - `type` is an `ENUM('income','expense')`.
  - `amount` is `DECIMAL(12,2)` with a `CHECK (amount > 0)`.
  - Composite indexes `(user_id, transaction_date)` and `(user_id, type, transaction_date)` match how every query filters.
- **Why `DECIMAL` for money?** `FLOAT`/`DOUBLE` are binary approximations: `0.1 + 0.2` isn't exactly `0.3`. `DECIMAL` is exact. All sums are done by MySQL (`SUM`, `CASE WHEN`), and values only become JavaScript numbers when the response is built.
- **Categories** are a validated column rather than a separate table. Categories are a fixed list in this version, so a lookup table would add joins without adding value. If users could create their own categories, a `categories` table with a foreign key would be the right next step.
- **Dates**: `transaction_date` is a `DATE`, and mysql2 is configured with `dateStrings: true` so `2026-03-01` never shifts to `2026-02-28` through time-zone conversion.

## Authentication flow

```
Sign up / log in ──▶ server checks password (bcrypt.compare)
                 ──▶ server signs JWT { sub: userId, exp } with JWT_SECRET
                 ──▶ Set-Cookie: token=…; HttpOnly; SameSite=Lax; Max-Age=86400
Later requests   ──▶ browser sends cookie automatically
                 ──▶ requireAuth: jwt.verify (signature + expiry) → req.userId
App start        ──▶ GET /api/auth/me decides whether the user is logged in
Log out          ──▶ server clears the cookie
```

### Why an HttpOnly cookie instead of localStorage?

| | localStorage + `Authorization` header | HttpOnly cookie (this project) |
|---|---|---|
| Readable by JavaScript? | Yes, so any XSS bug can steal the token | No |
| Sent automatically? | No, the code adds it | Yes, which creates a CSRF risk that must be handled |
| CSRF protection needed? | No | Yes: SameSite=Lax + Origin check + JSON-only |

Neither option is "fully secure". This project picks the cookie and mitigates CSRF explicitly.

## Security: what is implemented

- **Password hashing:** bcrypt, cost 12. Passwords are never logged or returned.
- **Login responses** use the same message whether the email or the password is wrong. A dummy hash is compared when the email is unknown, so response time doesn't reveal which emails exist.
- **JWT:** signed with HS256 using the secret from the environment, with the algorithm pinned on verification and an expiry set (`SESSION_HOURS`). The server refuses to start with a missing or short secret.
- **Authorization:** every transaction query includes `user_id = ?` from the token, never from the request. Other users' rows return 404, not 403, so their ids aren't confirmed.
- **SQL injection:** every value is a parameter. Sort columns, which can't be parameters, go through a whitelist.
- **CSRF:** the `SameSite=Lax` cookie, an `Origin` header check against `CLIENT_ORIGIN` for POST/PUT/DELETE, and JSON-only bodies.
- **CORS:** only `CLIENT_ORIGIN` is allowed, with credentials.
- **Input validation** on the server for every body and query string, and request bodies are limited to 10 KB.
- **Rate limiting:** 20 login/register attempts per 15 minutes per IP.
- **Security headers** via `helmet`, and `X-Powered-By` is removed.
- **CSV injection:** cells starting with `= + - @` are prefixed with `'` so spreadsheets don't execute them.
- **Secrets** live only in `.env`, which `.gitignore` excludes. Only `.env.example` files with placeholders are committed.

## Known limitations (be honest about these)

- **No token revocation.** Logging out deletes the cookie, but a copied token stays valid until it expires (24 hours by default). Fixes: shorter sessions plus refresh tokens, or a server-side session or deny-list table.
- **Sign-up reveals whether an email is registered** (the 409 response). This is a common usability trade-off.
- **No email verification or password reset.**
- **The rate limiter is in memory**, so it resets on restart and isn't shared between servers. Production would use Redis.
- **HTTPS isn't set up locally.** In production the `Secure` flag turns on automatically (`NODE_ENV=production`), but you must deploy behind HTTPS.
- **No Content-Security-Policy is tuned for the frontend.** Helmet's CSP covers API responses only.
- **No automated frontend unit tests.** The UI was verified with a scripted browser run and the manual checklist (see TESTING.md).

## Frontend concepts used

- **Components and props.** `TransactionsView` receives `type="income"` or `"expense"`. One component serves both pages.
- **State (`useState`).** Form values, filters, the open modal and the transaction being deleted. Changing state re-renders the component.
- **Effects (`useEffect`).** `useApiData` runs a request when its inputs change and aborts the previous one if the inputs change again (no stale responses).
- **Context.** `AuthProvider` shares `user`, `login`, `logout` and so on with every component without passing props down manually.
- **Custom hooks.** `useAuth`, `useApiData` and `useDebouncedValue` package reusable logic.
- **Routing.**
  - React Router nested routes put every protected page inside `<ProtectedRoute>` and then `<DashboardLayout>`, with `<Outlet>` marking where the child page renders.
  - `ProtectedRoute` waits for the `/me` check, then either renders the page or redirects to `/login`, remembering where you were going.
  - Pages are lazy-loaded, so the login page doesn't download the charting library.
- **Controlled forms.** Inputs take their `value` from state. Errors appear inline, linked to inputs with `aria-describedby`.
- **Single source of truth.** After any create, update or delete, the page re-fetches from the API instead of patching numbers locally, so the screen always matches the database.
