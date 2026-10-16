# Expense Tracker — Frontend

React 19 + Vite + Tailwind CSS v4 single-page app.

See the [project README](../README.md) for full setup instructions.

```bash
npm install
npm run dev      # http://localhost:5173 (API calls are proxied to http://localhost:5000)
npm run build    # production build in dist/
npm run lint     # oxlint
```

## Folder guide

| Folder | What lives there |
|---|---|
| `src/api/` | The single Axios client and one function per API call |
| `src/context/` | `AuthProvider`: who is logged in |
| `src/hooks/` | `useAuth`, `useApiData` (loading/error/data), `useDebouncedValue` |
| `src/components/ui/` | Buttons, form fields, modal, cards, empty/error states |
| `src/components/layouts/` | Auth layout and the sidebar dashboard layout |
| `src/components/routing/` | Protected / public-only route guards |
| `src/components/transactions/` | Shared income/expense screen, form, table, filters |
| `src/components/charts/` | Monthly bar chart and category breakdown |
| `src/pages/` | One file per route |
| `src/utils/` | Formatting, validation, categories, API paths, date presets |
