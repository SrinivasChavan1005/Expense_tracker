// Add/edit form used for BOTH income and expenses. The `type` prop decides
// which categories are offered; everything else is identical.
import { useState } from "react";
import { SelectField, TextAreaField, TextField } from "../ui/FormField";
import Button from "../ui/Button";
import { CATEGORIES, TYPE_LABELS } from "../../utils/data";
import { validateTransactionForm } from "../../utils/validation";
import { getErrorMessage, getFieldErrors, toDateInputValue } from "../../utils/helper";

function toFormValues(type, transaction) {
  return {
    type,
    amount: transaction ? String(transaction.amount) : "",
    category: transaction?.category ?? "",
    transactionDate: transaction?.transactionDate ?? toDateInputValue(),
    description: transaction?.description ?? "",
  };
}

export default function TransactionForm({ type, transaction, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(type, transaction));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const labels = TYPE_LABELS[type];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const validationErrors = validateTransactionForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        amount: values.amount.trim(),
        description: values.description.trim(),
      });
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error, `Couldn't save this ${labels.noun}.`));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <div role="alert" className="rounded-lg border border-expense-text/20 bg-expense-soft px-3.5 py-2.5 text-sm text-expense-text">
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Amount (₹)"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={values.amount}
          onChange={handleChange}
          error={errors.amount}
          required
          autoFocus
          inputClassName="tabular"
        />
        <TextField
          label="Date"
          name="transactionDate"
          type="date"
          value={values.transactionDate}
          onChange={handleChange}
          error={errors.transactionDate}
          required
        />
      </div>

      <SelectField
        label="Category"
        name="category"
        value={values.category}
        onChange={handleChange}
        error={errors.category}
        options={CATEGORIES[type]}
        placeholder="Select a category"
        required
      />

      <TextAreaField
        label="Description"
        name="description"
        maxLength={255}
        placeholder={type === "income" ? "e.g. October salary" : "e.g. Weekly groceries"}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        hint="Optional"
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {transaction ? "Save changes" : `Add ${labels.noun}`}
        </Button>
      </div>
    </form>
  );
}
