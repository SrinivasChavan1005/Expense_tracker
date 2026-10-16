// Client-side validation gives instant feedback while typing. It mirrors the
// backend rules, but it is only a convenience: the server validates again,
// because anything in the browser can be bypassed.
import { CATEGORIES } from "./data";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const PASSWORD_HINT = "At least 8 characters, including a letter and a number.";

export const isValidEmail = (email) => EMAIL_PATTERN.test(email.trim());

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateSignUpForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  else if (name.trim().length > 100) errors.name = "Name must be 100 characters or fewer.";

  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = PASSWORD_HINT;

  if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export function validateTransactionForm({ type, amount, category, transactionDate, description }) {
  const errors = {};
  const trimmed = String(amount).trim();
  if (!trimmed) errors.amount = "Amount is required.";
  else if (!AMOUNT_PATTERN.test(trimmed)) errors.amount = "Use a positive number with up to 2 decimals.";
  else if (Number(trimmed) <= 0) errors.amount = "Amount must be greater than zero.";

  if (!category) errors.category = "Choose a category.";
  else if (!CATEGORIES[type].includes(category)) errors.category = "Choose a valid category.";

  if (!transactionDate) errors.transactionDate = "Date is required.";
  if (description.length > 255) errors.description = "Keep the description under 255 characters.";
  return errors;
}
