// Unit tests for the validation rules (no database needed).
import { describe, it, expect } from "vitest";
import {
  isValidDateString,
  validateRegistration,
  validateTransaction,
  parseTransactionFilters,
} from "../src/utils/validation.js";
import { monthsBetween, lastNMonthsRange } from "../src/utils/dates.js";
import { toCsv } from "../src/utils/csv.js";

const fieldErrors = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    return error.details;
  }
};

describe("dates", () => {
  it("accepts real calendar dates and rejects impossible ones", () => {
    expect(isValidDateString("2024-02-29")).toBe(true); // leap year
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("15/03/2026")).toBe(false);
  });

  it("lists every month in a range, including year boundaries", () => {
    expect(monthsBetween("2025-11-20", "2026-02-03")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(lastNMonthsRange(6, "2026-02")).toEqual({ from: "2025-09-01", to: "2026-02-28" });
  });
});

describe("validateRegistration", () => {
  it("normalizes email and trims the name", () => {
    const result = validateRegistration({ name: "  Asha ", email: " Asha@Example.COM ", password: "abcdefg1" });
    expect(result).toEqual({ name: "Asha", email: "asha@example.com", password: "abcdefg1" });
  });

  it("rejects weak passwords and bad emails", () => {
    const errors = fieldErrors(() =>
      validateRegistration({ name: "", email: "not-an-email", password: "password" })
    );
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "password"]);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    const errors = fieldErrors(() =>
      validateRegistration({ name: "A", email: "a@b.co", password: `a1${"x".repeat(80)}` })
    );
    expect(errors.password).toBeDefined();
  });
});

describe("validateTransaction", () => {
  const valid = { type: "expense", amount: 99.5, category: "Food", transactionDate: "2026-01-31" };

  it("returns the amount as an exact 2-decimal string", () => {
    expect(validateTransaction(valid).amount).toBe("99.50");
  });

  it.each([["0"], ["-10"], ["12.345"], ["abc"], [""]])("rejects amount %s", (amount) => {
    expect(fieldErrors(() => validateTransaction({ ...valid, amount })).amount).toBeDefined();
  });

  it("rejects a category that belongs to the other type", () => {
    const errors = fieldErrors(() => validateTransaction({ ...valid, category: "Salary" }));
    expect(errors.category).toBeDefined();
  });

  it("rejects unknown types", () => {
    expect(fieldErrors(() => validateTransaction({ ...valid, type: "transfer" })).type).toBeDefined();
  });
});

describe("parseTransactionFilters", () => {
  it("applies sensible defaults", () => {
    expect(parseTransactionFilters({})).toMatchObject({ sort: "date", order: "desc", page: 1, limit: 10 });
  });

  it("only allows whitelisted sort columns (blocks SQL injection via ORDER BY)", () => {
    const errors = fieldErrors(() => parseTransactionFilters({ sort: "amount; DROP TABLE users" }));
    expect(errors.sort).toBeDefined();
  });

  it("rejects an inverted date range", () => {
    const errors = fieldErrors(() => parseTransactionFilters({ from: "2026-05-01", to: "2026-04-01" }));
    expect(errors.to).toBeDefined();
  });
});

describe("toCsv", () => {
  it("quotes cells and neutralizes spreadsheet formulas", () => {
    const csv = toCsv(["A", "B"], [['He said "hi", ok', "=SUM(A1:A9)"]]);
    expect(csv).toBe('"A","B"\r\n"He said ""hi"", ok","\'=SUM(A1:A9)"');
  });
});
