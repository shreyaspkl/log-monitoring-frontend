// src/api.js
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "https://logs-monitoring.onrender.com/api";

export const API = axios.create({
  baseURL: BASE,
});

// request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor: handle 401 globally (optional)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token expired or unauthorized: remove token and reload / redirect to login
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// ========== Logs API ==========
export const getLogs = (params) => API.get("/logs", { params });
export const addLog = (data) => API.post("/logs", data);
export const getCountByLevel = () => API.get("/logs/countByLevel");
export const getDistinctValues = () => API.get("/logs/distinctValues");

// ========== Auth API ==========
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (payload) => API.post("/auth/register", payload);
export const me = () => API.get("/auth/me");
export const logout = () => {
  localStorage.removeItem("token");
  return Promise.resolve();
};

// default export
export default API;
