// Two-column layout for the login and sign-up pages:
// the form on the left, a brand panel with a product preview on the right
// (the right panel is hidden on small screens).
import Logo from "../ui/Logo";
import AuthPreview from "../auth/AuthPreview";

const CURRENT_YEAR = new Date().getFullYear();

const AuthLayouts = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col px-6 py-8 sm:px-12 md:w-[55vw] lg:px-20">
        <Logo />
        <main className="flex flex-1 items-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <p className="text-xs text-ink-3">© {CURRENT_YEAR} Expense Tracker</p>
      </div>

      <aside className="relative hidden flex-col justify-center overflow-hidden bg-navy-900 px-10 md:flex md:w-[45vw] lg:px-16">
        {/* Soft decorative shapes */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-navy-800" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-navy-950/60" />

        <div className="relative">
          <h2 className="max-w-sm text-2xl font-semibold leading-snug text-white lg:text-3xl">
            Know where every rupee goes.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy-100">
            Record income and expenses, then see monthly trends and category breakdowns in one place.
          </p>
          <div className="mt-10">
            <AuthPreview />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuthLayouts;
