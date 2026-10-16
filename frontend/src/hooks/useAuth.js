import { useContext } from "react";
import { AuthContext } from "../context/authContextObject";

// Shortcut so components can write `const { user, logout } = useAuth();`
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
