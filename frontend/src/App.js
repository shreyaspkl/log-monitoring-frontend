import React, { useEffect, useState } from "react";
import { getLogs, getCountByLevel, getDistinctValues } from "./api";
import "./App.css";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [countByLevel, setCountByLevel] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);

  // filter state
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

  useEffect(() => {
    // initial load (no filters)
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async (params = {}) => {
    try {
      const [logsRes, countRes] = await Promise.all([
        getLogs(params),
        getCountByLevel(),
      ]);
      setLogs(logsRes.data); // already ordered server-side desc
      setCountByLevel(countRes.data);
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await getDistinctValues();
      setOptions({
        projects: Array.from(res.data.projects || []),
        apps: Array.from(res.data.apps || []),
        microservices: Array.from(res.data.microservices || []),
        levels: Array.from(res.data.levels || []),
      });
    } catch (err) {
      console.error("Failed to load filter options", err);
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
    // prepare params only for non-empty values
    const params = {};
    if (filters.projectName) params.projectName = filters.projectName;
    if (filters.appName) params.appName = filters.appName;
    if (filters.microservice) params.microservice = filters.microservice;
    if (filters.level) params.level = filters.level;
    // Dates: send ISO strings if present
    if (filters.fromTs) params.fromTs = new Date(filters.fromTs).toISOString();
    if (filters.toTs) params.toTs = new Date(filters.toTs).toISOString();

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

  return (
    <div className="container">
      <h1>☁️ Cloud Log Monitoring Dashboard</h1>

      <section className="summary">
        <h3>📊 Log Count by Level</h3>
        <ul>
          {Object.entries(countByLevel).map(([level, count]) => (
            <li key={level}>
              <b>{level}</b>: {count}
            </li>
          ))}
        </ul>
      </section>

      <section className="filters">
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
            <input name="fromTs" type="datetime-local" value={filters.fromTs} onChange={handleFilterChange} />
          </label>

          <label>
            To
            <input name="toTs" type="datetime-local" value={filters.toTs} onChange={handleFilterChange} />
          </label>

          <div className="filter-actions">
            <button onClick={applyFilters}>Apply Filters</button>
            <button onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </section>

      <section className="log-table">
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
                  <td
                    className={
                      log.level === "ERROR"
                        ? "error"
                        : log.level === "WARN"
                        ? "warn"
                        : "info"
                    }
                  >
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
