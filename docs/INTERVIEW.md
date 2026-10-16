# Interview preparation

Every answer below describes code that exists in this project, with file names you can point to.

## 30-second project pitch

> "I built a full-stack expense tracker with React, Node/Express and MySQL. Users register and log in, record income and expenses, and get a dashboard and reports. Authentication uses bcrypt-hashed passwords and a JWT stored in an HttpOnly cookie, with CSRF protection. Every database query is scoped to the logged-in user, and I have automated tests proving one user can't see another's data. All financial totals are calculated in SQL using DECIMAL columns, so the numbers are exact, and the dashboard and reports share the same service functions. The backend has 56 automated tests using Vitest and Supertest against a separate test database."

## Resume bullet points (accurate to what's built and tested)

- Built a full-stack expense tracker (React 19, Express 5, MySQL 8) with income/expense CRUD, filtering, sorting, pagination, CSV export, and dashboard and report views using Recharts.
- Implemented authentication with bcrypt password hashing and JWTs in HttpOnly, SameSite cookies, plus Origin-header CSRF checks, rate-limited login and protected routes on both client and server.
- Enforced per-user data isolation by scoping every SQL query to the authenticated user's id, using parameterized queries and a whitelisted ORDER BY to prevent SQL injection.
- Designed a normalized MySQL schema with foreign keys, CHECK constraints, DECIMAL money columns and composite indexes, and moved all financial aggregation into SQL for exact results.
- Wrote 56 automated API and unit tests (Vitest, Supertest) covering auth, cross-user access, validation, CSRF and report accuracy.
- Built a responsive, accessible UI with Tailwind CSS: a sidebar/drawer layout, accessible native `<dialog>` modals, inline form validation, and loading, empty and error states.

## Questions and model answers

### Architecture

**Q: Walk me through what happens when a user adds an expense.**
A: The form in `TransactionForm.jsx` validates input in the browser, then calls `createTransaction()` in `api/transactionsApi.js`, which POSTs JSON through our single Axios client. The browser attaches the HttpOnly cookie automatically. On the server:
- Express runs `verifyOrigin` (CSRF) and `requireAuth`, which verifies the JWT and sets `req.userId`.
- The controller validates the body again, because client validation can be bypassed.
- The service runs a parameterized `INSERT` with `user_id` taken from the token, not the body.

The API returns 201 with the saved row. The page shows a toast and re-fetches the list, so the UI reflects the database.

**Q: Why separate routes, controllers and services?**
A: Each layer has one job:
- Routes map URLs to handlers.
- Controllers deal with HTTP: input and status codes.
- Services deal with data and SQL.

This keeps files small and testable, and lets the dashboard and reports reuse the same `summary.service.js` functions, so totals are never computed two different ways.

**Q: Why does the frontend re-fetch after saving instead of updating state locally?**
A: The database is the source of truth. Re-fetching guarantees the list, the totals (calculated by SQL across all pages) and the pagination are correct. With this data size the extra request is cheap. At larger scale I'd consider optimistic updates or a cache library like TanStack Query.

### Authentication and security

**Q: How do you store passwords?**
A: As bcrypt hashes with cost factor 12 (`auth.controller.js`). bcrypt is deliberately slow and salts every hash, so identical passwords produce different hashes and brute-forcing a leaked database is expensive. The plain password is never stored or logged, and the hash column is never selected except during login.

**Q: Why put the JWT in an HttpOnly cookie instead of localStorage?**
A: JavaScript can't read an HttpOnly cookie, so an XSS bug can't steal the token. My browser test confirms `document.cookie` is empty. The trade-off is that browsers send cookies automatically, which creates a CSRF risk, so I added three defences:
- `SameSite=Lax`.
- An Origin-header check in `verifyOrigin.js`.
- Requiring JSON bodies, which a plain HTML form can't send.

**Q: Is your app secure because it uses JWT?**
A: No. JWT is just a signed token format. The security comes from several measures together:
- Hashing passwords.
- Verifying the signature and expiry on every protected request, with the algorithm pinned.
- Scoping every query to the user.
- Parameterized SQL.
- Server-side validation, CSRF protection, rate limiting and not leaking errors.

Known gaps: logout can't revoke an already-copied token before it expires, and there's no email verification or password reset.

**Q: How do you stop one user reading another's transactions?**
A: The user id comes only from the verified JWT (`req.userId`), and every query in `transaction.service.js` includes `WHERE user_id = ?`. For another user's row, the update/delete `affectedRows` is 0, so we return 404. We return 404 rather than 403 so we don't confirm the id exists. `transactions.test.js` has a test where user B tries to GET, PUT and DELETE user A's transaction.

**Q: How do you prevent SQL injection?**
A: Every value goes through mysql2 `?` placeholders, so MySQL receives it as data, never as SQL. Column names in `ORDER BY` can't be placeholders, so the client picks from a whitelist (`SORT_COLUMNS`), and anything else is rejected with 400. A test sends `sort=amount; DROP TABLE users` to check this. LIKE wildcards in searches are escaped too.

**Q: What does the login endpoint do to avoid leaking which emails exist?**
A: It returns the same "Invalid email or password." for both cases. When the email doesn't exist, it still runs `bcrypt.compare` against a dummy hash, so the response time is similar. (Registration does say "email already exists", which is a deliberate usability trade-off.)

### Database

**Q: Why DECIMAL instead of FLOAT for money?**
A: FLOAT is a binary approximation: `0.1 + 0.2 = 0.30000000000000004`. DECIMAL(12,2) stores exact values. I also do all sums in SQL, and the mysql2 driver returns DECIMALs as strings, so nothing is rounded until the final JSON. `reports.test.js` checks that `50000.00 + 0.10 − 16000.30 = 33999.80` exactly.

**Q: Explain your indexes.**
A: Almost every query filters by user and a date range, so there are composite indexes on `(user_id, transaction_date)` and `(user_id, type, transaction_date)`. Column order matters: MySQL can use the leftmost columns for equality and then range-scan the date. There's also a UNIQUE index on `users.email`, which is the real guarantee against duplicate accounts, even if two sign-ups race.

**Q: How do you show months with no transactions on the report?**
A: SQL `GROUP BY` only returns months that have rows. `getMonthlyTotals` builds the full list of months in the range (`monthsBetween`) and fills missing months with zeros. A test checks that an empty February appears as zeros.

### React

**Q: What are props and state?**
A: Props are inputs passed from a parent: `TransactionsView` receives `type="expense"`. State is data a component owns and changes over time, such as form values, filters or which modal is open. Changing state makes React re-render that component.

**Q: Explain your `useApiData` hook.**
A: It wraps a fetch in `useEffect`, tracks `loading`/`success`/`error`, and re-runs when its dependencies change (for example the selected period). It passes an `AbortController` signal and aborts in the cleanup, so if the user changes filters quickly, an older slow response can't overwrite newer data. It also exposes `reload()` for the "Try again" buttons and for refreshing after saves.

**Q: How do protected routes work?**
A: `AuthProvider` calls `GET /api/auth/me` on startup. `ProtectedRoute` shows a loader while that's pending, redirects to `/login` (remembering the original URL) if there's no user, and otherwise renders the nested route through `<Outlet>`. It's only a UX layer: the real protection is the API returning 401. If `/me` fails because the server is down rather than with a 401, it shows a retry screen instead of wrongly logging the user out.

**Q: Why use Context for auth?**
A: Many components need the current user and logout (sidebar, guards, pages). Context provides them anywhere without passing props through every level.

**Q: Why debounce the search box?**
A: Without it, every keystroke would send a request. `useDebouncedValue` waits until typing pauses for 350 ms.

### Testing

**Q: How did you test it?**
A: The backend has 56 Vitest tests:
- Unit tests for validation, dates and CSV.
- API tests with Supertest that call the real Express app against a separate `_test` MySQL database. They cover auth, expired and forged tokens, CRUD, cross-user isolation, CSRF, filters and report maths against hand-calculated values.

I also ran a scripted browser test with Playwright for the full user journey and mobile layouts, and I keep a manual checklist in `docs/TESTING.md`.

**Q: How do you keep tests from wiping real data?**
A: Tests load `.env.test`, which points to `expense_tracker_test`, and the reset helper refuses to delete anything unless the database name ends in `_test`.

### Improvements you'd make next

- Refresh tokens or server-side sessions so logout revokes access immediately.
- Email verification and password reset.
- Frontend component tests (React Testing Library) and E2E tests in CI.
- User-defined categories (a `categories` table with a foreign key), budgets and recurring transactions.
- Deployment: serve over HTTPS, set `NODE_ENV=production`, and use a managed MySQL instance.
