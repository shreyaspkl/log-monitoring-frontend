import axios from "axios";

// Replace with your Render backend URL
const API = axios.create({
  baseURL: "https://logs-monitoring.onrender.com/api",
});

export const getLogs = (params) => API.get("/logs", { params });
export const addLog = (data) => API.post("/logs", data);
export const getCountByLevel = () => API.get("/logs/countByLevel");
export const getDistinctValues = () => API.get("/logs/distinctValues");
export const getMyProjects = () => API.get("/auth/projects");

