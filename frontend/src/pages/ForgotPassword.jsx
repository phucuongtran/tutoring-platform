// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import "../styles.css";

export default function ForgotPassword() {
  return (
    <div className="auth-container">
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-message">Please contact the administrator</p>
      <Link to="/" className="auth-message">
        Go back?
      </Link>
    </div>
  );
}
