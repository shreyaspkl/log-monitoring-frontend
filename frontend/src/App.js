import React, { useEffect, useState } from "react";
import { getLogs, getCountByLevel } from "./api";
import "./App.css";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [countByLevel, setCountByLevel] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, countRes] = await Promise.all([
        getLogs(),
        getCountByLevel(),
      ]);
      setLogs(logsRes.data);
      setCountByLevel(countRes.data);
    } catch (err) {
      console.error("API Error:", err);
    }
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
              <th>ID</th>
              <th>Source App</th>
              <th>Level</th>
              <th>Message</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.sourceApp}</td>
                <td>{log.level}</td>
                <td>{log.message}</td>
                <td>{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
