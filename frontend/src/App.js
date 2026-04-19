import React, { useEffect, useMemo, useState } from "react";
import { getDistinctValues, getLogs, getProjectScopes, getProjectsByAccess, getRequestableProjects, me } from "./api";
import "./App.css";
import Login from "./Login";
import SignUp from "./Signup";
import AccessAdminPanel from "./AccessAdminPanel";
import AccessRequestPanel from "./AccessRequestPanel";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // RBAC-aligned filters
  const [filters, setFilters] = useState({
    projectId: "",
    environment: "",
    appName: "",
    microservice: "",
    level: "",
    fromTs: "",
    toTs: "",
  });

  const [options, setOptions] = useState({
    projects: [],       // log filter projects: min VIEWER
    adminProjects: [],  // admin panel projects: min ADMIN
    requestProjects: [],
    projectScopes: [],
    environments: [],   // ["DEV",...]
    apps: [],
    microservices: [],
    levels: [],
  });

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("signup");
  const [authChecking, setAuthChecking] = useState(true);

  const [authzMessage, setAuthzMessage] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const normalizeProjects = (rawProjects) =>
    (Array.isArray(rawProjects) ? rawProjects : [])
      .filter((p) => p && p.id !== undefined && p.id !== null)
      .map((p) => ({
        id: p.id,
        projectKey: p.projectKey || p.name || String(p.id),
        name: p.name,
      }));

 useEffect(() => {
   const params = new URLSearchParams(window.location.search);
   const tokenFromUrl = params.get("jwt") || params.get("token");
   if (tokenFromUrl) {
     localStorage.setItem("token", tokenFromUrl);
     window.history.replaceState({}, document.title, window.location.pathname);
   }

   const verify = async () => {
     const token = localStorage.getItem("token");
     if (!token) {
       setAuthChecking(false);
       return;
     }

     try {
       const res = await me();
       setUser(res.data && typeof res.data === "object" ? res.data : { username: res.data });

       // load options only for authenticated user
       await fetchOptions();
     } catch (err) {
       localStorage.removeItem("token");
       setUser(null);
     } finally {
       setAuthChecking(false);
     }
   };

   verify();
 }, []);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [projectScopesRes, adminProjectsRes, distinctRes, requestProjectsRes] = await Promise.allSettled([
        getProjectScopes(),
        getProjectsByAccess("ADMIN"),
        getDistinctValues(),
        getRequestableProjects(),
      ]);
      const d = distinctRes.status === "fulfilled" ? distinctRes.value.data || {} : {};
      const projectScopes =
        projectScopesRes.status === "fulfilled" && Array.isArray(projectScopesRes.value.data)
          ? projectScopesRes.value.data
          : [];
      const viewerProjects = normalizeProjects(projectScopes);
      const adminProjects =
        adminProjectsRes.status === "fulfilled" ? normalizeProjects(adminProjectsRes.value.data) : [];
      const requestProjects =
        requestProjectsRes.status === "fulfilled"
          ? normalizeProjects(requestProjectsRes.value.data)
          : viewerProjects;
      const accessibleEnvironments = [...new Set(
        projectScopes.flatMap((scope) => Array.isArray(scope.environments) ? scope.environments : [])
      )];

      setOptions({
        projects: viewerProjects,
        adminProjects,
        requestProjects,
        projectScopes,
        environments: accessibleEnvironments.length
          ? accessibleEnvironments
          : Array.isArray(d.environments) ? d.environments : [],
        apps: Array.isArray(d.apps) ? d.apps : [],
        microservices: Array.isArray(d.microservices) ? d.microservices : [],
        levels: Array.isArray(d.levels) ? d.levels : [],
      });
    } catch (err) {
      console.error("Failed to load filter options", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchData = async (params = {}) => {
    try {
      setLoadingLogs(true);
      setAuthzMessage("");
      const logsRes = await getLogs(params);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (err) {
      if (err?.response?.status === 403) {
        setLogs([]);
        setAuthzMessage("You are not authorized to view logs for the selected scope.");
        alert("Not authorized for selected project/environment.");
      } else {
        console.error("API Error:", err);
        setLogs([]);
      }
    } finally {
      setLoadingLogs(false);
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

  const toApiDateTime = (localValue, endOfDay = false) => {
    if (!localValue || typeof localValue !== "string") return null;
    const normalized = localValue.length === 16 ? localValue + ":00" : localValue;
    if (!endOfDay) return normalized;
    if (normalized.endsWith("00:00:00")) {
      return normalized.slice(0, 11) + "23:59:59";
    }
    return normalized;
  };

  const applyFilters = () => {
    const params = {};

    if (!filters.projectId || !filters.environment) {
      alert("Please select Project and Environment first.");
      return;
    }

    params.projectId = Number(filters.projectId);
    params.environment = filters.environment;

    if (filters.appName) params.appName = filters.appName;
    if (filters.microservice) params.microservice = filters.microservice;
    if (filters.level) params.level = filters.level;

    if (filters.fromTs) params.fromTs = toApiDateTime(filters.fromTs, false);
    if (filters.toTs) params.toTs = toApiDateTime(filters.toTs, true);

    if (params.fromTs || params.toTs) params._ = Date.now();

    setHasAppliedFilters(true);
    fetchData(params);
  };

  const clearFilters = () => {
    setFilters({
      projectId: "",
      environment: "",
      appName: "",
      microservice: "",
      level: "",
      fromTs: "",
      toTs: "",
    });
    setLogs([]);
    setHasAppliedFilters(false);
    setAuthzMessage("");
  };

  useEffect(() => {
    // If access scope changed and selected project is no longer allowed, clear it.
    if (
      filters.projectId &&
      !options.projects.some((p) => String(p.id) === String(filters.projectId))
    ) {
      setFilters((prev) => ({ ...prev, projectId: "", environment: "" }));
    }
  }, [options.projects, filters.projectId]);

  const selectedProjectScope = useMemo(
    () => options.projectScopes.find((scope) => String(scope.id) === String(filters.projectId)),
    [filters.projectId, options.projectScopes]
  );
  const availableEnvironments = useMemo(
    () => (
      selectedProjectScope?.environments?.length
        ? selectedProjectScope.environments
        : options.environments.length
          ? options.environments
          : ["DEV", "QA", "UAT", "PROD"]
    ),
    [options.environments, selectedProjectScope]
  );

  useEffect(() => {
    if (
      filters.environment &&
      filters.projectId &&
      !availableEnvironments.includes(filters.environment)
    ) {
      setFilters((prev) => ({ ...prev, environment: "" }));
    }
  }, [availableEnvironments, filters.environment, filters.projectId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAuthView("login");
  };

  const handleLoginSuccess = () => {
    setUser({});
    window.location.reload();
  };

  const hasToken = localStorage.getItem("token");
  if (authChecking && hasToken) {
    return (
      <div className="container">
<div className="header">
  <div>
    <h1 className="title">☁️ Cloud Log Monitoring</h1>
    <p className="subtitle">Real-time logs & access control</p>
  </div>

  <div className="header-actions">
    <span className="user-badge">
      👤 {user?.name || user?.username || "You"}
    </span>

    <button className="btn-secondary" onClick={() => setShowAdminPanel((s) => !s)}>
      {showAdminPanel ? "Hide Admin" : "Admin Panel"}
    </button>

    <button className="btn-secondary" onClick={handleLogout}>
      Logout
    </button>
  </div>
</div>
        <div className="auth-card auth-loading">
          <p className="auth-loading-text">Signing you in…</p>
        </div>
      </div>
    );
  }

  if (!hasToken || !user) {
    return (
      <div className="container">
        <h1>☁️ Cloud Log Monitoring Dashboard</h1>
        {authView === "signup" ? (
          <SignUp onSignUp={handleLoginSuccess} onShowLogin={() => setAuthView("login")} />
        ) : (
          <Login onLogin={handleLoginSuccess} onShowSignUp={() => setAuthView("signup")} />
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>☁️ Cloud Log Monitoring Dashboard</h1>
        <div>
          <span style={{ marginRight: 12 }}>Signed in: {user?.name || user?.username || "You"}</span>
          <button className="btn-secondary" onClick={() => setShowAdminPanel((s) => !s)}>
            {showAdminPanel ? "Hide Access Admin" : "Access Admin"}
          </button>
          <button className="btn-secondary" onClick={handleLogout} style={{ marginLeft: 8 }}>
            Logout
          </button>
        </div>
      </div>

      <section className="filters card">
<h3 className="section-title">Filters</h3>
        <div className="filter-row">
          <label>
            Project *
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleFilterChange}
              disabled={loadingOptions}
            >
              <option value="">Select</option>
              {options.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectKey || p.name || p.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Environment *
            <select
              name="environment"
              value={filters.environment}
              onChange={handleFilterChange}
              disabled={loadingOptions}
            >
              <option value="">Select</option>
              {availableEnvironments.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>

          <label>
            App
            <select name="appName" value={filters.appName} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.apps.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label>
            Microservice
            <select name="microservice" value={filters.microservice} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.microservices.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label>
            Level
            <select name="level" value={filters.level} onChange={handleFilterChange} disabled={loadingOptions}>
              <option value="">All</option>
              {options.levels.map((l) => <option key={l} value={l}>{l}</option>)}
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
            <button className="btn-primary" onClick={applyFilters} disabled={loadingLogs}>
              {loadingLogs ? "Loading..." : "Apply Filters"}
            </button>
            <button onClick={clearFilters} className="btn-secondary">Clear</button>
          </div>
        </div>
      </section>

      {showAdminPanel && (
        <AccessAdminPanel
          projects={options.adminProjects}
          onUnauthorized={(msg) => {
            setAuthzMessage(msg);
            alert(msg);
          }}
        />
      )}

      <AccessRequestPanel user={user} projects={options.requestProjects} />

      <section className="log-table card">
        <h3>📜 Logs</h3>

        {!hasAppliedFilters && (
          <p>Select Project and Environment, then click Apply Filters to view logs.</p>
        )}

        {authzMessage && (
          <p style={{ color: "#dc2626" }}>{authzMessage}</p>
        )}

        {hasAppliedFilters && (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Project</th>
                <th>Environment</th>
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
                    <td colSpan="9">
                      <div className="empty-state">📭 No logs found</div>
                    </td>
                  </tr>
                )}

              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="log-row" onClick={() => toggleExpand(log.id)} style={{ cursor: "pointer" }}>
                    <td className="arrow">{expandedRows.includes(log.id) ? "▾" : "▸"}</td>
                    <td>{log.id}</td>
                    <td>{log?.project?.projectKey || log.projectName}</td>
                    <td>{log.environment}</td>
                    <td>{log.appName}</td>
                    <td>{log.microservice}</td>
                    <td>{log.sourceApp}</td>
                    <td>
                      <span className={`badge ${log.level.toLowerCase()}`}>
                        {log.level}
                      </span>
                    </td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                  {expandedRows.includes(log.id) && (
                    <tr className="expanded-row">
                      <td colSpan="9">
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
        )}
      </section>
    </div>
  );
}
