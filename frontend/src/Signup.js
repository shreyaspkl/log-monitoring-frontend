// src/Signup.js
import React, { useState } from "react";
import { register } from "./api";

export default function Signup({ onRegistered, onCancel }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await register({ username, email, password });
      // backend returns token on successful register (we support both cases)
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      onRegistered && onRegistered();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data || "Registration failed";
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card card">
      <h3>Create account</h3>
      <form onSubmit={submit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
