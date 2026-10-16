// Labelled inputs with inline error messages.
// Each input is linked to its label (htmlFor/id) and to its error/hint text
// (aria-describedby), and marked aria-invalid when there's an error, so screen
// readers announce everything correctly.
import { useId } from "react";

const controlClass = (hasError) =>
  `block w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:outline-none focus:ring-2 disabled:bg-navy-50 ${
    hasError
      ? "border-expense-text focus:border-expense-text focus:ring-expense-text/20"
      : "border-line focus:border-accent-600 focus:ring-accent-600/20"
  }`;

function Field({ id, label, error, hint, required, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-expense-text" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-expense-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({ label, error, hint, className, inputClassName = "", trailing, ...props }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={props.required} className={className}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`h-10 ${controlClass(Boolean(error))} ${trailing ? "pr-11" : ""} ${inputClassName}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
    </Field>
  );
}

export function SelectField({ label, error, hint, className, options, placeholder, ...props }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={props.required} className={className}>
      <select
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`h-10 ${controlClass(Boolean(error))}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function TextAreaField({ label, error, hint, className, ...props }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={props.required} className={className}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`resize-none py-2 ${controlClass(Boolean(error))}`}
        {...props}
      />
    </Field>
  );
}
