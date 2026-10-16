// The ONE Axios instance the whole app uses.
import axios from "axios";
import { API_PATHS } from "../utils/apiPaths";

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  // Send the HttpOnly auth cookie with every request. The frontend never
  // reads or stores the token itself; the browser handles it.
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// If any protected request comes back 401 (e.g. the session expired while the
// app was open), tell the AuthContext so it can send the user to the login page.
// Login/register/me 401s are expected and handled where they're called.
const AUTH_ENDPOINTS = [API_PATHS.AUTH.LOGIN, API_PATHS.AUTH.REGISTER, API_PATHS.AUTH.ME];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.some((path) => url.endsWith(path))) {
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, { detail: error.response.data?.error?.message })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
