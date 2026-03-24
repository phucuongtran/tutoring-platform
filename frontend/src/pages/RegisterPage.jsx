// src/pages/RegisterPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import "../styles.css";

export default function RegisterPage() {
  const MAX_LEN = 75;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    student_id: "",
    faculty: "",
    major: "",
  });
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleChange = (e) => {
    const value = e.target.value.slice(0, MAX_LEN);
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Allow student_id to be optional on the frontend; backend will assign default role.
    for (const [key, value] of Object.entries(form)) {
      if (key === 'student_id') continue;
      if (!value.trim()) {
        setMessage(`Please fill in ${key.replace("_", " ")}.`);
        return;
      }
    }
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,20}$/;
    if (!usernameRegex.test(form.username)) {
      setMessage(
        "Username must be 2–20 characters, start with a letter, and contain only letters, numbers, or underscore (_)."
      );
      return;
    }
    // Names: letters only (allow spaces and Vietnamese diacritics)
    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
    if (form.first_name && !nameRegex.test(form.first_name)) {
      setMessage("First name should contain letters and spaces only.");
      return;
    }
    if (form.last_name && !nameRegex.test(form.last_name)) {
      setMessage("Last name should contain letters and spaces only.");
      return;
    }
    const emailRegex = /^[^\s@]+@hcmut.edu.vn$/;
    if (!emailRegex.test(form.email)) {
      setMessage("Invalid email format.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setMessage("Password must contain at least 8 characters, including uppercase, lowercase, and a number.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setMessage("Passwords do not match.");
      return;
    }
    // Student ID: exactly 7 digits if provided
    const sidRegex = /^\d{7}$/;
    if (form.student_id && !sidRegex.test(form.student_id)) {
      setMessage("Student ID must be exactly 7 digits.");
      return;
    }
    try {
      const payload = { ...form };
      payload.faculty = payload.faculty ? Number(payload.faculty) : null;
      payload.major = payload.major ? Number(payload.major) : null;
      setErrors({});
      await authService.registerStudent(payload);
      setMessage("Registration successful! You can now login.");
    } catch (err) {
      // Try to extract useful error info returned by DRF/axios
      const resp = err?.response?.data;
      if (resp) {
        // If the backend returned a mapping of field -> [errors]
        setErrors(resp);
        // Prefer non_field_errors or detail (top-level messages) for summary.
        // If only field-specific errors exist (e.g., { student_id: ["..."] }),
        // avoid duplicating them as a top-level `message` since they are
        // already rendered next to their fields via `errors`.
        const summary = resp.non_field_errors || resp.detail || resp.error || null;
        if (summary) {
          setMessage(Array.isArray(summary) ? summary.join(" ") : String(summary));
        } else {
          // Clear any previous top-level message when only field errors are present
          setMessage("");
        }
      } else {
        setMessage("Error registering user.");
      }
    }
  };

  useEffect(() => {
    // load faculties on mount
    let mounted = true;
    authService
      .getFaculties()
      .then((data) => {
        if (mounted) setFaculties(data || []);
      })
      .catch(() => setFaculties([]));
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    // when faculty changes, load related majors
    if (!form.faculty) {
      setMajors([]);
      setForm((s) => ({ ...s, major: "" }));
      return;
    }
    let mounted = true;
    authService
      .getMajors(form.faculty)
      .then((data) => {
        if (mounted) setMajors(data || []);
      })
      .catch(() => setMajors([]));
    return () => (mounted = false);
  }, [form.faculty]);

  return (
    <form onSubmit={handleSubmit} className="auth-container">
      <h2 className="auth-title">Register</h2>
      {message && (
        <p
          className={`auth-message ${
            message.includes("successful") ? "success" : "error"
          }`}
        >
          {message}
        </p>
      )}

      <input
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        onFocus={() => setFocusedField("username")}
        onBlur={() => setFocusedField("")}
        className="auth-input"
        autoComplete="off"
        maxLength={MAX_LEN}
      />
      {errors.username && (
        <p className="auth-field-error">{Array.isArray(errors.username) ? errors.username.join(' ') : errors.username}</p>
      )}
      {focusedField === "username" && (
        <div className="tooltip">
          Username must be 2–20 characters, start with a letter, and contain
          only letters, numbers, or underscore (_).
        </div>
      )}
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        onFocus={() => setFocusedField("email")}
        onBlur={() => setFocusedField("")}
        className="auth-input"
        autoComplete="off"
        maxLength={MAX_LEN}
      />
      {errors.email && (
        <p className="auth-field-error">{Array.isArray(errors.email) ? errors.email.join(' ') : errors.email}</p>
      )}
      {focusedField === "email" && (
        <div className="tooltip">
          Enter a hcmut.edu.vn email address.
        </div>
      )}
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        onFocus={() => setFocusedField("password")}
        onBlur={() => setFocusedField("")}
        className="auth-input"
        autoComplete="off"
        maxLength={MAX_LEN}
      />
      {focusedField === "password" && (
        <div className="tooltip">Password must have at least 8 characters, including uppercase, lowercase and a number</div>
      )}
      <input
        type={showPassword ? "text" : "password"}
        name="confirm_password"
        placeholder="Confirm Password"
        value={form.confirm_password}
        onChange={handleChange}
        onFocus={() => setFocusedField("confirm_password")}
        onBlur={() => setFocusedField("")}
        className="auth-input"
        autoComplete="off"
        maxLength={MAX_LEN}
      />
      <label className="show-password-label">
        <input
          type="checkbox"
          name="showPassword"
          placeholder="showPassword"
          className="auth-input-checkbox"
          onChange={(e) => setShowPassword(e.target.checked)}
        />
        <span className="show-password-label">Show password</span>
      </label>
      <input
        type="text"
        name="first_name"
        placeholder="First Name"
        value={form.first_name}
        onChange={handleChange}
        className="auth-input"
        autoComplete="off"
        autoCapitalize="on"
        maxLength={MAX_LEN}
      />

      <input
        type="text"
        name="last_name"
        placeholder="Last Name"
        value={form.last_name}
        onChange={handleChange}
        className="auth-input"
        autoComplete="off"
        autoCapitalize="on"
        maxLength={MAX_LEN}
      />

      <input
        type="text"
        name="student_id"
        placeholder="Student ID"
        value={form.student_id}
        onChange={handleChange}
        className="auth-input"
        autoComplete="off"
        maxLength={MAX_LEN}
      />
      {errors.student_id && (
        <p className="auth-field-error">{Array.isArray(errors.student_id) ? errors.student_id.join(' ') : errors.student_id}</p>
      )}

      <select
        name="faculty"
        value={form.faculty}
        onChange={handleChange}
        className="auth-select"
      >
        <option value="">Select Faculty</option>
        {faculties.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <select
        name="major"
        value={form.major}
        onChange={handleChange}
        className="auth-input"
        disabled={!form.faculty}
      >
        <option value="">
          {!form.faculty ? "Select faculty first" : majors.length ? "Select Major" : "No majors available"}
        </option>
        {majors.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <button type="submit" className="auth-button">
        Register
      </button>

      <p className="auth-link">
        Already have an account? <Link to="/">Login</Link>
      </p>
    </form>
  );
}
