import axios from "axios";

// Replace with your Render backend URL
const API = axios.create({
  baseURL: "https://logs-monitoring.onrender.com/api",
});

export const getLogs = () => API.get("/logs");
export const addLog = (data) => API.post("/logs", data);
export const getCountByLevel = () => API.get("/logs/countByLevel");
