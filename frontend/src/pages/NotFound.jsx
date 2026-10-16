import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo";

const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
    <Logo />
    <p className="mt-6 text-sm font-semibold text-accent-700">404</p>
    <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
    <p className="text-sm text-ink-2">The page you're looking for doesn't exist or has moved.</p>
    <Link to="/" className="mt-2 inline-flex h-10 items-center rounded-lg bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800">
      Go to dashboard
    </Link>
  </main>
);

export default NotFound;
