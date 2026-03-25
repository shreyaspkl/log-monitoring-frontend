// src/SignUp.js
import React, { useState } from "react";
import { register } from "./api";

export default function SignUp({ onSignUp, onShowLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const res = await register({ username, email, password });
        const authToken = res?.data?.jwt || res?.data?.token;
        if (authToken) {
            localStorage.setItem("token", authToken);
        onSignUp && onSignUp(res.data);
      } else {
        alert("Account created. Please sign in.");
        onShowLogin && onShowLogin();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Registration failed.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-card signup-card">
      <div className="auth-card-header">
        <h2 className="auth-card-title">Create account</h2>
        <p className="auth-card-subtitle">
          Sign up to access the Cloud Log Monitoring Dashboard.
        </p>
      </div>

      <form onSubmit={submit} className="auth-form">
        <section className="auth-form-section">
          <h4 className="auth-section-label">Account details</h4>
          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Choose a username"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
        </section>

        <section className="auth-form-section">
          <h4 className="auth-section-label">Password</h4>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
        </section>

        <div className="auth-form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </button>
          <button type="button" className="btn-secondary" onClick={clearForm}>
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

<div style={{ marginTop: 10, fontSize: 13, color: "#64748b", textAlign: "center" }}>
  We&apos;ll use your Google email. If it doesn&apos;t exist  yet with this tool, we&apos;ll create your account automatically.
</div>
      <div className="auth-card-footer">
        Already have an account?{" "}
        <button type="button" className="btn-link" onClick={onShowLogin}>
          Log in
        </button>
      </div>
    </div>
  );
}
