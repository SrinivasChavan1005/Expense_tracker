import { LuEye, LuEyeOff } from "react-icons/lu";

// Show/hide button that sits inside a password field.
export default function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md p-2 text-ink-3 hover:bg-navy-50 hover:text-ink"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
    >
      {visible ? <LuEyeOff className="size-4" aria-hidden="true" /> : <LuEye className="size-4" aria-hidden="true" />}
    </button>
  );
}
