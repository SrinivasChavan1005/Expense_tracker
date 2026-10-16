// The frame around every logged-in page: a fixed sidebar on desktop, a top
// header, and a slide-in navigation drawer on mobile.
import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";
import { NAV_ITEMS } from "../../utils/data";
import { getInitials } from "../../utils/helper";
import Logo from "../ui/Logo";
import { LoadingBlock } from "../ui/Spinner";

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("You've been logged out.");
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo inverted />
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-accent-400)]"
                      : "text-navy-100/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-600 text-sm font-semibold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-navy-100/70">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-100/80 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          <LuLogOut className="size-[18px]" aria-hidden="true" />
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  // Close the mobile drawer with Escape, and stop the page behind it scrolling.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/50"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-navy-900 shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              autoFocus
              className="absolute right-3 top-5 rounded-lg p-1.5 text-navy-100 hover:bg-white/10"
              aria-label="Close navigation"
            >
              <LuX className="size-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-16 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-lg p-2 text-ink-2 hover:bg-navy-50 lg:hidden"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <LuMenu className="size-5" aria-hidden="true" />
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>
          <p className="hidden text-sm font-medium text-ink-2 lg:block">{current?.label}</p>
        </header>

        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<LoadingBlock label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
