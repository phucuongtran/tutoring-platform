// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import "../styles.css";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(form.username, form.password);
      alert("Login successful!");
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-container">
      <h2 className="auth-title">Login</h2>
      {error && <p className="auth-message error">{error}</p>}

      <input
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        className="auth-input"
      />

      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="auth-input"
      />
      <label className="show-password-label">
        <input
          type="checkbox"
          name="showPassword"
          placeholder="showPassword"
          className="auth-input-checkbox"
          onChange={(e) => setShowPassword(e.target.checked)}
        />
        Show password
      </label>
      <div className="auth-extra">
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>

      <button type="submit" className="auth-button">
        Login
      </button>

      <p className="auth-link">
        Don’t have an account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
