# API reference

Base URL: `http://localhost:5000/api`. During development the frontend calls `/api`, and Vite forwards it there.

## Conventions

**Success**

```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

**Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": { "amount": "Amount must be greater than zero." }
  }
}
```

| Status | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Invalid input (`details` has per-field messages) or malformed JSON |
| 401 | Not logged in, or the session expired or is invalid |
| 403 | Request came from a disallowed origin, or wasn't JSON (CSRF protection) |
| 404 | Not found, including transactions that belong to another user |
| 409 | Email already registered |
| 413 | Request body over 10 KB |
| 429 | Too many login/register attempts (20 per 15 minutes per IP) |
| 500 | Server error (no internal details are exposed in production) |

**Authentication:** a successful login or registration sets a `token` cookie (`HttpOnly`, `SameSite=Lax`, and `Secure` in production). Browsers send it automatically. All endpoints except register, login, logout and health require it.

**Money and dates:** amounts are numbers in JSON (`1250.5`) and are stored as `DECIMAL(12,2)`. Dates are `YYYY-MM-DD` strings.

---

## Auth

### `POST /auth/register`

```json
{ "name": "Priya Sharma", "email": "priya@example.com", "password": "SecurePass1" }
```

Password rules: 8–72 characters, with at least one letter and one number. The email is stored in lowercase.
Returns **201** `{ data: { user: { id, name, email, createdAt } } }` and sets the cookie. Returns **409** if the email is taken.

### `POST /auth/login`

```json
{ "email": "priya@example.com", "password": "SecurePass1" }
```

Returns **200** `{ data: { user } }` and sets the cookie. Returns **401** `"Invalid email or password."` for any wrong combination.

### `POST /auth/logout`

Clears the cookie. Returns **200**.

### `GET /auth/me`

Returns **200** `{ data: { user } }` for a valid session, otherwise **401**.

---

## Transactions

A transaction object:

```json
{
  "id": 42,
  "type": "expense",
  "amount": 250.75,
  "category": "Food",
  "description": "Lunch",
  "transactionDate": "2026-03-15",
  "createdAt": "2026-03-15 12:01:22",
  "updatedAt": "2026-03-15 12:01:22"
}
```

Categories:

- **income:** Salary, Freelance, Business, Investments, Gifts, Other income
- **expense:** Food, Travel, Shopping, Bills, Rent, Education, Healthcare, Entertainment, Other expense

### `GET /transactions`

| Query param | Example | Notes |
|---|---|---|
| `type` | `expense` | `income` or `expense` |
| `category` | `Food` | |
| `from`, `to` | `2026-01-01` | Inclusive |
| `minAmount`, `maxAmount` | `100` | |
| `search` | `rent` | Searches description and category |
| `sort` | `date` | `date`, `amount`, `category` or `created` |
| `order` | `desc` | `asc` or `desc` |
| `page`, `limit` | `1`, `10` | `limit` can be at most 100 |

```json
{
  "success": true,
  "data": [ /* transactions */ ],
  "meta": {
    "pagination": { "page": 1, "limit": 10, "total": 39, "totalPages": 4 },
    "totalAmount": 190702
  }
}
```

`totalAmount` is the sum across **all** matching rows, not just the current page.

### `GET /transactions/:id`

Returns **200**, or **404** if the transaction doesn't exist or isn't yours.

### `POST /transactions`

```json
{ "type": "expense", "amount": "250.75", "category": "Food", "transactionDate": "2026-03-15", "description": "Lunch" }
```

`description` is optional (max 255 characters). `amount` must be positive with at most 2 decimals. Returns **201**. Any `userId` in the body is ignored; the owner always comes from the session.

### `PUT /transactions/:id`

Takes the same body as POST and replaces the transaction. Returns **200** or **404**.

### `DELETE /transactions/:id`

Returns **200** `{ data: { id } }` or **404**.

### `GET /transactions/export`

Takes the same filters as the list (no paging), up to 10,000 rows. Returns `text/csv` as a file download.

---

## Dashboard and reports

### `GET /dashboard/summary?from=&to=`

The range defaults to the current calendar month.

```json
{
  "period": { "from": "2026-10-01", "to": "2026-10-31" },
  "totals": { "income": 79740, "expense": 29300, "net": 50440, "count": 6 },
  "allTime": { "income": 439320, "expense": 190702, "balance": 248618 },
  "expenseByCategory": [ { "category": "Rent", "total": 18720, "count": 1, "percentage": 63.9 } ],
  "monthlyTrend": { "from": "2026-05-01", "to": "2026-10-31", "months": [ { "month": "2026-05", "income": 0, "expense": 0, "net": 0 } ] },
  "recentTransactions": [ /* latest 5 overall */ ]
}
```

- `totals`: the selected period only.
- `allTime`: every transaction the user has ever recorded.
- `monthlyTrend`: always the 6 months ending with the period's last month.

### `GET /reports/monthly?from=&to=`

The range defaults to the last 12 months and can be at most 10 years. Every month in the range is included, and empty months are zero.

```json
{ "period": {...}, "months": [ { "month": "2026-01", "income": 50000, "expense": 12000.3, "net": 37999.7 } ], "totals": { "income": ..., "expense": ..., "net": ..., "count": ... } }
```

### `GET /reports/categories?from=&to=&type=expense`

```json
{ "period": {...}, "type": "expense", "total": 16000.3, "categories": [ { "category": "Rent", "total": 12000.1, "count": 1, "percentage": 75 } ] }
```

---

## Health

`GET /health` returns `{ "success": true, "data": { "status": "ok" } }`. No login is needed.
