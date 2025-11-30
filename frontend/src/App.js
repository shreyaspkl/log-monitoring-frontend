import {  getMyProjects } from "./api"; // ensure getMyProjects is imported at top of file
import React, { useEffect, useState } from "react";
import { getLogs, getDistinctValues } from "./api";
import "./App.css";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  const [filters, setFilters] = useState({
    projectName: "",
    appName: "",
    microservice: "",
    level: "",
    fromTs: "",
    toTs: "",
  });

  const [options, setOptions] = useState({
    projects: [],
    apps: [],
    microservices: [],
    levels: [],
  });

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchData();      // load logs (no filters)
    fetchOptions();   // populate dropdowns
  }, []);

const fetchData = async (params = {}) => {
  try {
    setLoadingLogs(true);
    const logsRes = await getLogs(params);

    const data = logsRes.data;
    setLogs(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("API Error:", err);
  } finally {
    setLoadingLogs(false);
  }
};

const fetchOptions = async () => {
  try {
    setLoadingOptions(true);

    const token = localStorage.getItem("token");

    if (token) {
      // If authenticated, prefer server-side list of projects the user can view
      try {
        const myRes = await getMyProjects();
        const myProjects = (myRes?.data?.projects) || [];

        if (Array.isArray(myProjects) && myProjects.length > 0) {
          // We have an explicit permitted list from server — use it for projects
          // But still fetch other fields (apps/microservices/levels) from distinctValues
          const distinctRes = await getDistinctValues();
          const d = distinctRes.data || {};
          setOptions({
            projects: myProjects,
            apps: Array.isArray(d.apps) ? d.apps : (d.apps ? Object.values(d.apps) : []),
            microservices: Array.isArray(d.microservices) ? d.microservices : (d.microservices ? Object.values(d.microservices) : []),
            levels: Array.isArray(d.levels) ? d.levels : (d.levels ? Object.values(d.levels) : []),
          });
          return;
        } else {
          // Authenticated but server returned empty permitted list:
          // Could mean user is admin (we let them see all), or they have no explicit project permissions.
          // Fall back to distinctValues to populate full dropdowns; backend will enforce access when fetching logs.
          const distinctRes = await getDistinctValues();
          const d = distinctRes.data || {};
          setOptions({
            projects: Array.isArray(d.projects) ? d.projects : (d.projects ? Object.values(d.projects) : []),
            apps: Array.isArray(d.apps) ? d.apps : (d.apps ? Object.values(d.apps) : []),
            microservices: Array.isArray(d.microservices) ? d.microservices : (d.microservices ? Object.values(d.microservices) : []),
            levels: Array.isArray(d.levels) ? d.levels : (d.levels ? Object.values(d.levels) : []),
          });
          return;
        }
      } catch (err) {
        console.warn("Couldn't fetch my projects or fallback failed:", err);
        // If any error, fallback to distinctValues
        const distinctRes = await getDistinctValues();
        const d = distinctRes.data || {};
        setOptions({
          projects: Array.isArray(d.projects) ? d.projects : (d.projects ? Object.values(d.projects) : []),
          apps: Array.isArray(d.apps) ? d.apps : (d.apps ? Object.values(d.apps) : []),
          microservices: Array.isArray(d.microservices) ? d.microservices : (d.microservices ? Object.values(d.microservices) : []),
          levels: Array.isArray(d.levels) ? d.levels : (d.levels ? Object.values(d.levels) : []),
        });
        return;
      }
    }

    // Not authenticated -> load global distinct values
    const res = await getDistinctValues();
    const d = res.data || {};
    setOptions({
      projects: Array.isArray(d.projects) ? d.projects : (d.projects ? Object.values(d.projects) : []),
      apps: Array.isArray(d.apps) ? d.apps : (d.apps ? Object.values(d.apps) : []),
      microservices: Array.isArray(d.microservices) ? d.microservices : (d.microservices ? Object.values(d.microservices) : []),
      levels: Array.isArray(d.levels) ? d.levels : (d.levels ? Object.values(d.levels) : []),
    });
  } catch (err) {
    console.error("Failed to load filter options", err);
    setOptions({ projects: [], apps: [], microservices: [], levels: [] });
  } finally {
    setLoadingOptions(false);
  }
};

  const toggleExpand = (logId) => {
    setExpandedRows((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

const applyFilters = async () => {
  const params = {};
  if (filters.projectName) params.projectName = filters.projectName;
  if (filters.appName) params.appName = filters.appName;
  if (filters.microservice) params.microservice = filters.microservice;
  if (filters.level) params.level = filters.level;
  if (filters.fromTs) {
    params.fromTs = filters.fromTs.length === 16 ? filters.fromTs + ":00" : filters.fromTs;
  }
  if (filters.toTs) {
    params.toTs = filters.toTs.length === 16 ? filters.toTs + ":00" : filters.toTs;
  }

  try {
    setLoadingLogs(true);
    await fetchData(params);
  } catch (err) {
    // handle authorization error from backend
    if (err?.response?.status === 403) {
      // friendly UI message
      alert(err.response.data?.error || "You do not have permission to view logs for the selected project.");
      return;
    }
    console.error("Failed to apply filters", err);
    alert("Failed to apply filters. Check console for details.");
  } finally {
    setLoadingLogs(false);
  }
};


  const clearFilters = () => {
    setFilters({
      projectName: "",
      appName: "",
      microservice: "",
      level: "",
      fromTs: "",
      toTs: "",
    });
    fetchData();
  };

  return (
    <div className="container">
      <h1>☁️ Cloud Log Monitoring Dashboard</h1>

      {/* Filters */}
      <section className="filters card">
        <h3>🔎 Filters</h3>

        <div className="filter-row">
          <label>
            Project
            <select name="projectName" value={filters.projectName} onChange={handleFilterChange}>
              <option value="">All</option>
              {options.projects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label>
            App
            <select name="appName" value={filters.appName} onChange={handleFilterChange}>
              <option value="">All</option>
              {options.apps.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>

          <label>
            Microservice
            <select name="microservice" value={filters.microservice} onChange={handleFilterChange}>
              <option value="">All</option>
              {options.microservices.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label>
            Level
            <select name="level" value={filters.level} onChange={handleFilterChange}>
              <option value="">All</option>
              {options.levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-row">
          <label>
            From
            <input
              name="fromTs"
              type="datetime-local"
              value={filters.fromTs}
              onChange={handleFilterChange}
              placeholder="From"
            />
          </label>

          <label>
            To
            <input
              name="toTs"
              type="datetime-local"
              value={filters.toTs}
              onChange={handleFilterChange}
              placeholder="To"
            />
          </label>

          <div className="filter-actions">
            <button className="btn-primary" onClick={applyFilters} disabled={loadingLogs}>
              {loadingLogs ? "Loading..." : "Apply Filters"}
            </button>
            <button onClick={clearFilters} className="btn-secondary">Clear</button>
          </div>
        </div>
      </section>

      {/* Logs table */}
      <section className="log-table card">
        <h3>📜 Recent Logs</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Project</th>
              <th>App</th>
              <th>Microservice</th>
              <th>Source App</th>
              <th>Level</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan="8">No logs found</td>
              </tr>
            )}

            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr
                  className="log-row"
                  onClick={() => toggleExpand(log.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="arrow">
                    {expandedRows.includes(log.id) ? "▾" : "▸"}
                  </td>
                  <td>{log.id}</td>
                  <td>{log.projectName}</td>
                  <td>{log.appName}</td>
                  <td>{log.microservice}</td>
                  <td>{log.sourceApp}</td>
                  <td className={log.level === "ERROR" ? "error" : log.level === "WARN" ? "warn" : "info"}>
                    {log.level}
                  </td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>

                {expandedRows.includes(log.id) && (
                  <tr className="expanded-row">
                    <td colSpan="8">
                      <div className="log-message">
                        <strong>Message:</strong> {log.message}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
