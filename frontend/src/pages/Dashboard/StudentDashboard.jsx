// src/pages/Dashboard/StudentDashboard.jsx
import { useState, useEffect } from "react";
import authService from "../../services/authService";

export default function StudentDashboard({ profile }) {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getTutors()
      .then(data => setTutors(data))
      .finally(()=>setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div>
      <h2 className="section-title">Danh sách Tutor</h2>
      <p className="auth-message">Xin chào {profile.first_name}. Bạn có thể đặt lịch học bên dưới.</p>
      {loading && <div className="loading-block">Đang tải tutor...</div>}
      {!loading && tutors.length === 0 && <div className="panel"><p>Hiện chưa có tutor khả dụng.</p></div>}
      <div className="tutor-grid">
        {tutors.map((tutor) => (
          <div key={tutor.id || tutor.username} className="tutor-card">
            <h3>{tutor.name || tutor.username}</h3>
            <p>Môn: {tutor.subject || tutor.major || "—"}</p>
            <p>Slots: {Array.isArray(tutor.available_slots) ? tutor.available_slots.join(", ") : "—"}</p>
            <button className="auth-button">Đặt lịch</button>
          </div>
        ))}
      </div>
    </div>
  );
}
