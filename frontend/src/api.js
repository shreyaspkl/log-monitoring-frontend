// src/api.js
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

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

// response interceptor
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // clear invalid token, but do NOT reload (prevents reload loops)
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

// ========== Logs API ==========
export const getLogs = (params) => API.get("/logs", { params });
export const addLog = (data) => API.post("/logs", data);
export const getCountByLevel = () => API.get("/logs/countByLevel");
export const getDistinctValues = () => API.get("/logs/distinctValues");
export const getProjects = () => API.get("/projects");
export const getProjectsByAccess = (requiredRole) =>
  API.get("/projects", { params: { requiredRole } });
export const getRequestableProjects = () => API.get("/projects/requestable");
export const getProjectScopes = () => API.get("/projects/scopes");

// ========== Auth API ==========
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (payload) => API.post("/auth/register", payload);
export const me = () => API.get("/auth/me");
export const logout = () => {
  localStorage.removeItem("token");
  return Promise.resolve();
};

// ========== Access Admin API ==========
export const assignAccess = (payload) => API.post("/access/assign", payload);
export const revokeAccess = (payload) => API.delete("/access/revoke", { data: payload });
export const listAccess = (projectId, environment) =>
  API.get("/access/list", { params: { projectId, environment } });

// ========== Access Requests API ==========
export const createAccessRequest = (payload) => API.post("/access-requests", payload);
export const getMyAccessRequests = () => API.get("/access-requests/mine");
export const getPendingAccessRequests = () => API.get("/access-requests/pending");
export const approveAccessRequest = (requestId, payload) =>
  API.post(`/access-requests/${requestId}/approve`, payload || {});
export const rejectAccessRequest = (requestId, payload) =>
  API.post(`/access-requests/${requestId}/reject`, payload || {});

export default API;
