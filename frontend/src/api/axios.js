import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api-portal.lorettocentralschool.edu.in";

const api = axios.create({
  baseURL: `${API_URL}/api`
});

let authToken = localStorage.getItem("token");

export const setAuthToken = token => {
  authToken = token;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.clear();
};

api.interceptors.request.use(cfg => {
  if (authToken) cfg.headers.Authorization = `Bearer ${authToken}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginRequest = err.config?.url?.includes("/auth/login");
    if (err.response?.status === 401 && !isLoginRequest) {
      clearAuthToken();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;
