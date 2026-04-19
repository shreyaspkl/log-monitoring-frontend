// src/AccessAdminPanel.js
import React, { useState } from "react";
import {
  approveAccessRequest,
  assignAccess,
  getPendingAccessRequests,
  listAccess,
  rejectAccessRequest,
  revokeAccess,
} from "./api";

export default function AccessAdminPanel({ projects = [], onUnauthorized }) {
  const [username, setUsername] = useState("");
  const [projectId, setProjectId] = useState("");
  const [environment, setEnvironment] = useState("DEV");
  const [roleName, setRoleName] = useState("VIEWER");
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestError, setRequestError] = useState("");

  const loadPendingRequests = async () => {
    try {
      const res = await getPendingAccessRequests();
      setRequests(Array.isArray(res?.data) ? res.data : []);
      setRequestError("");
    } catch (err) {
      handleErr(err);
      setRequests([]);
      setRequestError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to load pending access requests."
      );
    }
  };

  React.useEffect(() => {
    const loadOnMount = async () => {
      try {
        const res = await getPendingAccessRequests();
        setRequests(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        handleErr(err);
        setRequests([]);
      }
    };

    loadOnMount();
  }, []);

  const handleErr = (err) => {
    if (err?.response?.status === 403) {
      onUnauthorized?.("You are not authorized to manage access for this project/environment.");
      return;
    }
    alert(err?.response?.data?.error || err?.response?.data?.message || "Request failed");
  };

  const refreshList = async () => {
    if (!projectId || !environment) return;
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) {
      alert("Please select a valid project.");
      return;
    }
    try {
      setLoading(true);
      const res = await listAccess(pid, environment);
      setBindings(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const onAssign = async () => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) {
      alert("Please select a valid project.");
      return;
    }
    try {
      setLoading(true);
      await assignAccess({
        username,
        projectId: pid,
        environment,
        roleName,
      });
      await refreshList();
      alert("Access assigned");
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const onRevoke = async () => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) {
      alert("Please select a valid project.");
      return;
    }
    try {
      setLoading(true);
      await revokeAccess({
        username,
        projectId: pid,
        environment,
        roleName,
      });
      await refreshList();
      alert("Access revoked");
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (request, decision) => {
    try {
      setLoading(true);
      if (decision === "APPROVED") {
        await approveAccessRequest(request.id, {
          decisionNote: "Approved and access assigned.",
        });
      } else {
        await rejectAccessRequest(request.id, {
          decisionNote: "Rejected by project admin.",
        });
      }

      await loadPendingRequests();

      if (
        decision === "APPROVED" &&
        String(projectId) === String(request.projectId) &&
        environment === request.environment
      ) {
        await refreshList();
      }

      alert(decision === "APPROVED" ? "Request approved and access assigned." : "Request rejected.");
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const manageableRequests = requests.filter((request) => request.status === "PENDING");

  return (
    <section className="card" style={{ marginTop: 20 }}>
      <h3>Access Management (Admin)</h3>

      <div className="filter-row">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user1" />
        </label>

        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectKey || p.name || p.id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Environment
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="DEV">DEV</option>
            <option value="QA">QA</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
          </select>
        </label>

        <label>
          Role
          <select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
            <option value="VIEWER">VIEWER</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
      </div>

      <div className="filter-actions" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={onAssign} disabled={loading || !username || !projectId}>
          Assign
        </button>
        <button className="btn-secondary" onClick={onRevoke} disabled={loading || !username || !projectId}>
          Revoke
        </button>
        <button className="btn-secondary" onClick={refreshList} disabled={loading || !projectId}>
          Refresh List
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong>Current Bindings</strong>
{bindings.length === 0 ? (
  <p>No bindings</p>
) : (
  <table className="admin-table">
    <thead>
      <tr>
        <th>User</th>
        <th>Project</th>
        <th>Env</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      {bindings.map((b, idx) => (
        <tr key={idx}>
          <td>{b.username}</td>
          <td>{b.projectKey}</td>
          <td>{b.environment}</td>
          <td>{b.role}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
      </div>

      <div style={{ marginTop: 20 }}>
        <strong>Pending Access Requests</strong>
        {requestError && <p style={{ color: "#dc2626" }}>{requestError}</p>}
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <button className="btn-secondary" onClick={loadPendingRequests} disabled={loading}>
            Refresh Requests
          </button>
        </div>
        {manageableRequests.length === 0 ? (
          <p>No pending requests for your admin projects.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Project</th>
                <th>Env</th>
                <th>Role</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manageableRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.requesterUsername || request.requesterEmail || "Unknown user"}</td>
                  <td>{request.projectKey}</td>
                  <td>{request.environment}</td>
                  <td>{request.roleName}</td>
                  <td>{request.reason || "-"}</td>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="request-actions">
                    <button
                      className="btn-primary"
                      onClick={() => reviewRequest(request, "APPROVED")}
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => reviewRequest(request, "REJECTED")}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
