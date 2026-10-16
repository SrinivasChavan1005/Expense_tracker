// Authentication API calls. Each returns plain data, not the Axios response.
import api from "./client";
import { API_PATHS } from "../utils/apiPaths";

export async function registerUser({ name, email, password }) {
  const { data } = await api.post(API_PATHS.AUTH.REGISTER, { name, email, password });
  return data.data.user;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post(API_PATHS.AUTH.LOGIN, { email, password });
  return data.data.user;
}

export async function logoutUser() {
  await api.post(API_PATHS.AUTH.LOGOUT);
}

export async function fetchCurrentUser() {
  const { data } = await api.get(API_PATHS.AUTH.ME);
  return data.data.user;
}
