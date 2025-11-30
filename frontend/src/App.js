// src/App.js
import React, { useEffect, useState } from "react";
import { getLogs, getDistinctValues, me, logout } from "./api";
import "./App.css";
import Login from "./Login";
import Signup from "./Signup";

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

  const [user, setUser] = useState(null);
  const [view, setView] = useState("loading"); // loading | auth | signup | dashboard

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setView("auth");
        return;
      }
      try {
        const res = await me();
        setUser(res.data || { username: res.data });
        setView("dashboard");
        // load data after verified
        fetchData();
        fetchOptions();
      } catch (err) {
        console.warn("Token invalid:", err);
        localStorage.removeItem("token");
        setUser(null);
        setView("auth");
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async (params = {}) => {
    try {
      setLoadingLogs(true);
      const logsRes = await getLogs(params);
      const data = logsRes.data;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("API Error:", err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
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

  const applyFilters = () => {
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
    fetchData(params);
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

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setView("auth");
  };

  // Auth views
  if (view === "loading") return <div className="container">Loading...</div>;

  if (view === "auth") {
    return (
      <div className="container">
        <h1>☁️ Cloud Log Monitoring Dashboard</h1>
        <Login onSuccess={() => {
          // after login, verify and move to dashboard
          me().then(res => {
            setUser(res.data || { username: res.data });
            setView("dashboard");
            fetchData();
            fetchOptions();
          }).catch(() => {
            localStorage.removeItem("token");
            setView("auth");
          });
        }} showSignup={() => setView("signup")} />
        <p style={{ marginTop: 12, color: "#666" }}>
          You can still view logs without login if your backend allows it.
        </p>
      </div>
    );
  }

  if (view === "signup") {
    return (
      <div className="container">
        <h1>☁️ Cloud Log Monitoring Dashboard</h1>
        <Signup onRegistered={() => {
          me().then(res => {
            setUser(res.data || { username: res.data });
            setView("dashboard");
            fetchData();
            fetchOptions();
          }).catch(() => {
            setView("auth");
          });
        }} onCancel={() => setView("auth")} />
      </div>
    );
  }

  // Dashboard (authenticated)
  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>☁️ Cloud Log Monitoring Dashboard</h1>
        <div>
          <span style={{ marginRight: 12 }}>Signed in: {user?.name || user?.username || "You"}</span>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Filters */}
      <section className="filters card">
        <h3>🔎 Filters</h3>

        <div className="filter-row">
          <label>
            Project
            <select name="projectName" value={filters.projectName} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.projects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label>
            App
            <select name="appName" value={filters.appName} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.apps.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>

          <label>
            Microservice
            <select name="microservice" value={filters.microservice} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.microservices.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label>
            Level
            <select name="level" value={filters.level} onChange={handleFilterChange} disabled={loadingOptions}>
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
