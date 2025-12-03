// src/Login.js
import React, { useState } from "react";
import { login } from "./api";

export default function Login({ onSuccess, showSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await login({ username, password });
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        onSuccess && onSuccess();
      } else {
        alert("Login succeeded but token missing.");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Invalid credentials";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card card">
      <h3>Login</h3>
      <form onSubmit={submit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setUsername(""); setPassword(""); }}
            disabled={loading}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn-link"
            onClick={showSignup}
            style={{ marginLeft: 8 }}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
