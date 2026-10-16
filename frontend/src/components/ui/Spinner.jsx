const SIZES = { sm: "size-4 border-2", md: "size-6 border-2", lg: "size-9 border-[3px]" };

export default function Spinner({ size = "md", className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-current border-r-transparent ${SIZES[size]} ${className}`}
    />
  );
}

// Centered spinner with a screen-reader message, for whole sections or pages.
export function LoadingBlock({ label = "Loading…", className = "py-16" }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 text-ink-3 ${className}`}>
      <Spinner size="lg" className="text-navy-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
