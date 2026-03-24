// src/pages/Dashboard/TutorDashboard.jsx

export default function TutorDashboard({ profile }) {
  return (
    <div>
      <h2 className="section-title">Bảng điều khiển Tutor</h2>
      <p className="auth-message">Xin chào {profile.first_name}, quản lý lịch và học viên.</p>
      <div className="tutor-section">
        <div className="tutor-box">
          <h3>Lịch của tôi</h3>
          <p>Cập nhật thời gian trống để sinh viên đặt lịch.</p>
        </div>
        <div className="tutor-box">
          <h3>Học viên</h3>
          <p>Xem danh sách các phiên đã được đặt.</p>
        </div>
      </div>
    </div>
  );
}
