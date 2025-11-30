// src/Login.js
import React, { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const res = await login({ username, password });
      // expecting { token: "..." } from backend
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        onLogin && onLogin(res.data);
      } else {
        alert("Login succeeded but no token found in response.");
      }
    } catch (err) {
      console.error(err);
      alert("Invalid credentials or server error.");
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
          <button type="button" className="btn-secondary" onClick={() => { setUsername(""); setPassword(""); }}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
