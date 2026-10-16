# Testing

## Automated tests (backend)

```powershell
cd backend
npm test
```

**56 tests in 4 files.** They use Vitest as the test runner and Supertest to send HTTP requests straight to the Express app, against the separate `expense_tracker_test` database.

| File | What it proves |
|---|---|
| `tests/validation.test.js` | Date validation (leap years, impossible dates), month ranges, registration and transaction rules, the sort-column whitelist (blocks `ORDER BY` injection), CSV quoting and formula neutralizing |
| `tests/auth.test.js` | Register stores a bcrypt hash (cost 12), never returns the hash or password, and sets an HttpOnly + SameSite cookie. Duplicate email (case-insensitive) gives 409, bad input gives field errors. Login works; wrong password and unknown email give the same 401 message. `/me` works with a cookie and rejects a missing, **expired** or **forged** token. Logout ends the session. |
| `tests/transactions.test.js` | Every protected endpoint returns 401 without a login. Full CRUD works, invalid payloads give 400, and a `userId` in the body is ignored. **User B can't read, edit or delete user A's transaction** (404) and sees none of it. Filters, LIKE-wildcard escaping, sorting, pagination and CSV export work. CSRF: a foreign Origin gives 403, our origin is allowed, and form-encoded bodies give 403. |
| `tests/reports.test.js` | Dashboard totals vs all-time balance using exact decimals (`0.10 + 50000.00`, and so on), category percentages, 6-month trend labels, a zero state for new users, isolation between users, monthly report **empty months filled with zero**, category report for both types, and invalid ranges and types rejected |

## Results observed during development

These were actually run, in a Linux workspace with MySQL 8.0.46 (the same version as yours):

- `npm test` (backend): **56/56 passed**.
- `npm run build` (frontend): succeeded with no warnings.
- `npm run lint` (frontend): 0 warnings, 0 errors.
- **Scripted browser run** (Playwright + Chromium, against the real API and MySQL): **25/25 checks passed**:
  - Redirects: a protected page redirects to login, and after login you return to the page you asked for.
  - Sign-up: validation errors appear inline, and registration logs you in.
  - Cookie security: the cookie is HttpOnly and `document.cookie` can't see it.
  - Forms: income is added through the modal, and a negative amount is rejected.
  - Expenses: add, edit and delete (with confirmation), search and category filter.
  - Database match: the dashboard's income, expense and net match `SUM()` queries run directly in MySQL.
  - Sessions: logout ends the session, and a wrong password is rejected.
  - CSV: the export downloads.
  - Mobile (390 px wide): no horizontal scroll on the dashboard, expenses or reports pages, and the mobile drawer works.
  - Backend stopped: opening the app shows a "Can't reach the server" screen; after restarting the backend, "Try again" recovers.
- **Browser console:** no JavaScript errors. The only messages were:
  - `401` responses from the expected "am I logged in?" check while logged out and the deliberate wrong-password attempt.
  - Google Fonts failing to load, because that sandbox blocks external sites.

**Not verified yet:** running on your Windows machine with your MySQL install. Use the checklist below to confirm.

## Manual test checklist

Run through this on your own machine after setup.

**Setup**
- [ ] `npm run dev` in `backend` prints "Connected to MySQL" and "API listening"
- [ ] `npm run dev` in `frontend` opens at http://localhost:5173 with no errors in the browser console (F12)
- [ ] `npm test` in `backend` shows 56 passed

**Authentication**
- [ ] Visiting `/dashboard` while logged out redirects to `/login`
- [ ] Sign-up with empty fields shows an error under each field
- [ ] Sign-up with a password like `password` shows the password rule
- [ ] Mismatched passwords show "Passwords do not match."
- [ ] Signing up with an email that's already used shows "An account with this email already exists."
- [ ] Successful sign-up lands on the dashboard with a welcome message
- [ ] In DevTools → Application → Cookies, `token` shows **HttpOnly ✓**
- [ ] In MySQL, `SELECT password_hash FROM users;` shows `$2b$12$…`, not your password
- [ ] Refreshing the page keeps you logged in
- [ ] Log out, then use the browser Back button: you can't see the dashboard
- [ ] A wrong password shows "Invalid email or password."

**Transactions** (repeat on Income and Expenses)
- [ ] The empty list shows the "No … recorded yet" message with an Add button
- [ ] Adding with amount `0`, `-5` or `12.345` shows an amount error
- [ ] Adding a valid entry shows a toast, and the row and total update
- [ ] Editing changes the row
- [ ] Delete asks for confirmation; Cancel keeps the row, Delete removes it
- [ ] Search, category, date and amount filters narrow the list; Clear resets them
- [ ] Clicking the Date and Amount column headers sorts the list
- [ ] With more than 10 entries, Next/Previous pagination works
- [ ] Export CSV downloads a file that opens in Excel

**Dashboard and reports**
- [ ] Dashboard totals match `SELECT type, SUM(amount) FROM transactions WHERE user_id = ? AND transaction_date BETWEEN ? AND ? GROUP BY type;`
- [ ] Changing the period changes the period cards but **not** the all-time balance
- [ ] Quick action "Add expense" opens the add form on the Expenses page
- [ ] Reports → Table shows every month in the range, including zero months
- [ ] The category breakdown switches between Expenses and Income

**Isolation**
- [ ] Create a second account in a private window. It sees none of the first account's data.

**Responsive** (DevTools → device toolbar → iPhone)
- [ ] The hamburger menu opens the drawer, and Escape or a tap outside closes it
- [ ] Transaction lists show as stacked rows, with no sideways scrolling
- [ ] Modals fit on screen

**Failure handling**
- [ ] Stop the backend and reload the page: you get a "Can't reach the server" screen with Try again, not a blank page. Start the backend, click Try again, and the app recovers.
- [ ] While logged in, stop the backend and change the dashboard period: the section shows "Couldn't load this section" with Try again
