// src/Login.js
import React, { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin, onShowSignUp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const res = await login({ username, password });
      // expecting { token: "..." } from backend
      if (res?.data?.jwt) {
        localStorage.setItem("token", res.data.jwt);
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
    <div className="auth-card login-card">
      <div className="auth-card-header">
        <h2 className="auth-card-title">Log in</h2>
        <p className="auth-card-subtitle">
          Sign in to access the Cloud Log Monitoring Dashboard.
        </p>
      </div>

      <form onSubmit={submit} className="auth-form">
        <section className="auth-form-section">
          <div className="auth-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Your username"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </section>

        <div className="auth-form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setUsername("");
              setPassword("");
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Divider */}
      <div style={{ margin: "16px 0", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
        <span style={{ padding: "0 8px" }}>OR</span>
      </div>

      {/* Google OAuth2 login */}
      <button
        type="button"
        className="btn-secondary"
        style={{ width: "100%" }}
        onClick={() => {
          const serverRoot =
            process.env.REACT_APP_SERVER_URL || "http://localhost:8080";

          window.location.href = `${serverRoot}/oauth2/authorization/google`;
        }}
      >
        Continue with Google
      </button>

<div className="auth-card-footer">
  Don&apos;t have an account?{" "}
  <button type="button" className="btn-link" onClick={onShowSignUp}>
    Create account
  </button>
  <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
    Or continue with Google—if your email isn’t registered, we&apos;ll create your account automatically.
  </div>
</div>
    </div>
  );
}
