import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-700/60",
  secondary: "bg-white text-ink border border-line hover:bg-navy-50 disabled:text-ink-3",
  danger: "bg-expense-text text-white hover:bg-[#9a1d13] disabled:opacity-60",
  ghost: "text-ink-2 hover:bg-navy-50 hover:text-ink",
};

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

// One button style for the whole app. `loading` shows a spinner and disables
// the button so a form can't be submitted twice.
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon: Icon,
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}
