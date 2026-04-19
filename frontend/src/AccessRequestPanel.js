import React, { useEffect, useMemo, useState } from "react";
import {
  createAccessRequest,
  getMyAccessRequests,
} from "./api";

const ENVIRONMENTS = ["DEV", "QA", "UAT", "PROD"];
const ROLES = ["VIEWER", "OPERATOR", "ADMIN"];

export default function AccessRequestPanel({ user, projects = [] }) {
  const [projectId, setProjectId] = useState("");
  const [environment, setEnvironment] = useState("DEV");
  const [roleName, setRoleName] = useState("VIEWER");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState("");

  const loadRequests = async () => {
    try {
      const res = await getMyAccessRequests();
      setRequests(Array.isArray(res?.data) ? res.data : []);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load access requests", err);
      setRequests([]);
      setLoadError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to load your access requests."
      );
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const requestableProjects = useMemo(
    () =>
      (Array.isArray(projects) ? projects : []).filter(
        (project) => project && project.id !== undefined && project.id !== null
      ),
    [projects]
  );

  const username = user?.username || user?.name || user?.email || "";
  const myRequests = useMemo(() => requests, [requests]);

  const submitRequest = async (e) => {
    e?.preventDefault();
    if (!projectId) {
      alert("Please select a project.");
      return;
    }

    const selectedProject = requestableProjects.find(
      (project) => String(project.id) === String(projectId)
    );

    if (!selectedProject) {
      alert("Please select a valid project.");
      return;
    }

    const duplicatePending = myRequests.some(
      (request) =>
        request.status === "PENDING" &&
        String(request.projectId) === String(projectId) &&
        request.environment === environment &&
        request.roleName === roleName
    );

    if (duplicatePending) {
      alert("You already have a pending request for this project, environment, and role.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAccessRequest({
        projectId: Number(projectId),
        environment,
        roleName,
        reason: reason.trim(),
      });
      const createdRequest = res?.data;
      if (createdRequest && typeof createdRequest === "object") {
        setRequests((prev) => [createdRequest, ...prev.filter((item) => item.id !== createdRequest.id)]);
      } else {
        await loadRequests();
      }
      setReason("");
      setRoleName("VIEWER");
      setEnvironment("DEV");
      setProjectId("");
      alert("Access request submitted for admin review.");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to submit access request.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card request-card">
      <h3>Request Project Access</h3>
      <p className="section-copy">
        Raise an access request for a project role. An authorized admin can review it and approve or reject it.
      </p>

      <form onSubmit={submitRequest}>
        <div className="filter-row">
          <label>
            Requesting User
            <input value={username} disabled readOnly />
          </label>

          <label>
            Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select project</option>
              {requestableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectKey || project.name || project.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Environment
            <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
              {ENVIRONMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Role
            <select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-row">
          <label className="request-reason">
            Reason
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this access?"
              rows={3}
            />
          </label>
          <div className="filter-actions">
            <button type="submit" className="btn-primary" disabled={submitting || !projectId}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <strong>My Requests</strong>
        {loadError && <p style={{ color: "#dc2626" }}>{loadError}</p>}
        {myRequests.length === 0 ? (
          <p>No access requests yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Env</th>
                <th>Role</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.projectKey}</td>
                  <td>{request.environment}</td>
                  <td>{request.roleName}</td>
                  <td>
                    <span className={`status-pill ${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.updatedAt || request.createdAt).toLocaleString()}</td>
                  <td>{request.decisionNote || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
