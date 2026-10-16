// Route guards. They decide what to render from the AuthContext, whose user
// comes from the server's /api/auth/me answer, not from anything stored in
// the browser. (Hiding pages is only UX; the API enforces the real security.)
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingBlock } from "../ui/Spinner";
import { ErrorState } from "../ui/States";

function FullPageLoader() {
  return <LoadingBlock label="Checking your session…" className="min-h-screen" />;
}

// Shown when the session check failed for a reason other than "not logged in".
function ConnectionError() {
  const { retry } = useAuth();
  return (
    <ErrorState
      className="min-h-screen"
      message="Can't reach the server. Make sure the backend is running, then try again."
      onRetry={retry}
    />
  );
}

// Only logged-in users. Others go to /login, remembering where they wanted
// to go so we can send them back after logging in.
export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "checking") return <FullPageLoader />;
  if (status === "error") return <ConnectionError />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Only logged-OUT users (login/sign-up). Logged-in users go to the dashboard.
export function PublicOnlyRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "checking") return <FullPageLoader />;
  if (status === "error") return <ConnectionError />;
  if (isAuthenticated) {
    const destination = location.state?.from?.pathname ?? "/dashboard";
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}

export function RootRedirect() {
  const { status, isAuthenticated } = useAuth();
  if (status === "checking") return <FullPageLoader />;
  if (status === "error") return <ConnectionError />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
