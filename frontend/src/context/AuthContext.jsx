// Holds "who is logged in" for the whole app.
//
// The login token lives in an HttpOnly cookie that JavaScript cannot read, so
// the app never inspects a token. On startup it simply asks the server
// (GET /api/auth/me). If the server accepts the cookie, we have a user.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";
import { UNAUTHORIZED_EVENT } from "../api/client";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" until the first /me call finishes, so protected pages don't
  // flash the login screen for an already-logged-in user.
  const [status, setStatus] = useState("checking");
  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Ask the server who we are. 401 simply means "not logged in"; any other
  // failure (server down, network error) is shown as an error with a retry,
  // instead of wrongly sending a logged-in user to the login page.
  const checkSession = useCallback(() => {
    return fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setStatus("ready");
      })
      .catch((error) => {
        setUser(null);
        setStatus(error.response?.status === 401 ? "ready" : "error");
      });
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const retry = useCallback(() => {
    setStatus("checking");
    checkSession();
  }, [checkSession]);

  // A protected API call returned 401: the session ended on the server.
  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (!userRef.current) return;
      toast.error(event.detail || "Your session has ended. Please log in again.", { id: "session" });
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedIn = await loginUser(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    const created = await registerUser(details);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Even if the request fails, forget the user locally.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: Boolean(user), login, register, logout, retry }),
    [user, status, login, register, logout, retry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
