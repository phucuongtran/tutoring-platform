// src/pages/Dashboard/AdminDashboard.jsx

export default function AdminDashboard({ profile }) {
  return (
    <div>
      <h2 className="section-title">Quản trị hệ thống</h2>
      <p className="auth-message success">Chào {profile.first_name}. Quản lý người dùng & báo cáo.</p>
      <div className="admin-section">
        <div className="admin-card">
          <h3>Quản lý người dùng</h3>
          <p>Xem, duyệt và cập nhật tài khoản.</p>
        </div>
        <div className="admin-card">
          <h3>Báo cáo hệ thống</h3>
          <p>Theo dõi hoạt động đặt lịch & hiệu suất tutor.</p>
        </div>
      </div>
    </div>
  );
}
