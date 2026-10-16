// Consistent empty and error states.
import { LuInbox, LuTriangleAlert } from "react-icons/lu";
import Button from "./Button";

export function EmptyState({ icon: Icon = LuInbox, title, message, action, className = "py-12" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${className}`}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-2">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className = "py-12" }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center px-4 text-center ${className}`}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-expense-soft text-expense-text">
        <LuTriangleAlert className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-ink">Couldn't load this section</p>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
