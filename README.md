# Expense Tracker

A full-stack personal finance app. Users sign up, record income and expenses, and see dashboards and reports calculated from their own data in MySQL.

**Stack:** React 19 · Vite · Tailwind CSS v4 · Recharts · Node.js · Express 5 · MySQL 8 · JWT in an HttpOnly cookie · bcrypt · Vitest + Supertest

## Features

- **Accounts.** Sign up, log in and log out. Passwords are hashed with bcrypt, and the session is a JWT stored in an HttpOnly cookie. Protected pages and API endpoints require a valid session.
- **Income and expenses.** Add, edit and delete transactions, with a confirmation before deleting. Lists support search, category, date and amount filters, sorting, pagination and CSV export.
- **Dashboard.** Shows income, expenses and net balance for a chosen period, plus the all-time balance (labelled separately). It also includes a 6-month income-vs-expense chart, spending by category, the latest transactions and quick actions.
- **Reports.** Any date range, with a monthly chart or table (empty months shown as zero), a category breakdown for income or expenses, summary totals and CSV export.
- **Data isolation.** Every query is scoped to the logged-in user, so one user can never read or change another user's data. This is covered by automated tests.
- **Responsive and accessible.** Sidebar on desktop, slide-in drawer on mobile, and tables that become stacked lists on phones. Forms have labels, inline errors, visible keyboard focus and accessible dialogs.

## Project structure

```
expense_tracker/
├── backend/                 Express REST API
│   ├── database/schema.sql  MySQL tables, keys, indexes, constraints
│   ├── scripts/             db:init (create tables) and db:seed (demo data)
│   ├── src/
│   │   ├── config/          env loading/validation, MySQL pool
│   │   ├── routes/          URL → middleware → controller map
│   │   ├── middleware/      requireAuth, verifyOrigin (CSRF), errorHandler
│   │   ├── controllers/     thin request handlers
│   │   ├── services/        all SQL (users, transactions, summaries)
│   │   └── utils/           validation, categories, JWT/cookie, CSV, dates
│   └── tests/               56 automated API + unit tests
├── frontend/                React app (see frontend/README.md)
└── docs/                    API reference, architecture, testing, interview prep
```

## Setup (Windows)

You need **Node.js 20+** (you have 24) and **MySQL Server 8.0**. Run the commands in PowerShell from the `expense_tracker` folder.

### 1. Create a MySQL user and grant it the two databases

Open **MySQL Workbench** (or the MySQL command line: `mysql -u root -p`) as root and run the following. Pick your own password:

```sql
CREATE USER 'expense_app'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON `expense_tracker`.*      TO 'expense_app'@'localhost';
GRANT ALL PRIVILEGES ON `expense_tracker_test`.* TO 'expense_app'@'localhost';
FLUSH PRIVILEGES;
```

The app uses its own user instead of `root`, so a leaked `.env` file can't touch your other databases. `expense_tracker_test` is a separate database used only by the automated tests.

### 2. Configure and start the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
Copy-Item .env.test.example .env.test
```

Edit `backend/.env`:

- Set `DB_PASSWORD` to the password you chose.
- Set `JWT_SECRET` to a long random string. Generate one with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Optionally, set `SEED_DEMO_PASSWORD` (for example `DemoPass123`) to create a demo account.

Put the same `DB_PASSWORD` in `backend/.env.test`.

Then run:

```powershell
npm run db:init        # creates the expense_tracker database and tables
npm run db:init:test   # creates the test database
npm run db:seed        # optional: demo@example.com with 6 months of [Sample] data
npm run dev            # starts the API on http://localhost:5000
```

You should see `✔ Connected to MySQL` and `✔ API listening`.

### 3. Start the frontend (in a second terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### 4. Run the tests

```powershell
cd backend
npm test
```

The tests use `expense_tracker_test` only. The test helper refuses to clear any database whose name doesn't end in `_test`.

## Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Starts the API and restarts it when files change |
| backend | `npm start` | Starts the API |
| backend | `npm run db:init` / `db:init:test` | Creates the database and tables (safe to re-run; never drops data) |
| backend | `npm run db:seed` | Creates the demo account with sample data (skipped if it exists) |
| backend | `npm test` | Runs all automated tests |
| frontend | `npm run dev` | Starts the dev server with `/api` proxied to the backend |
| frontend | `npm run build` | Creates a production build |
| frontend | `npm run lint` | Lints the code |

## Environment variables

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `3306`, … | MySQL connection |
| `JWT_SECRET` | 96 random hex chars | Signs login tokens. At least 32 chars; the server refuses to start otherwise |
| `SESSION_HOURS` | `24` | How long a login lasts |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed browser origin(s) for CORS and CSRF checks |
| `SEED_DEMO_PASSWORD` | – | Password for the optional demo account |

Frontend (optional, `frontend/.env`): `VITE_PROXY_TARGET` (default `http://localhost:5000`) and `VITE_API_URL` (default `/api`). Don't put secrets in frontend env files: anything starting with `VITE_` ends up in the public JavaScript.

## Further documentation

- [API reference](docs/API.md)
- [Architecture and security](docs/ARCHITECTURE.md)
- [Testing: automated tests and manual checklist](docs/TESTING.md)
- [Interview preparation](docs/INTERVIEW.md)

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required environment variable` | You haven't created `backend/.env` yet (step 2). |
| `Could not connect to MySQL: Access denied` | `DB_USER`/`DB_PASSWORD` don't match the user from step 1. |
| `Unknown database 'expense_tracker'` | Run `npm run db:init`. |
| The frontend says "Can't reach the server" | The backend isn't running. Start it with `npm run dev` in `backend/`. |
| `mysql` isn't recognized in PowerShell | Use MySQL Workbench, or `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p`. |
