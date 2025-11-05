import React, { useEffect, useState } from "react";
import { getLogs, getCountByLevel } from "./api";
import "./App.css";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [countByLevel, setCountByLevel] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, countRes] = await Promise.all([
        getLogs(),
        getCountByLevel(),
      ]);
      setLogs(logsRes.data.reverse()); // latest first
      setCountByLevel(countRes.data);
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  const toggleExpand = (logId) => {
    setExpandedRows((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
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

      <section className="log-table">
        <h3>📜 Recent Logs</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
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
                    <td colSpan="5">
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
