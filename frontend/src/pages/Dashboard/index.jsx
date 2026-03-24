// src/pages/Dashboard/index.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import Layout from "../../components/Layout";
import Availability from "../DashboardSections/Availability";
import BookMeeting from "../DashboardSections/BookMeeting";
import CancelMeeting from "../DashboardSections/CancelMeeting";
import EvaluateSession from "../DashboardSections/EvaluateSession";
import GenerateReport from "../DashboardSections/GenerateReport";
import StudentDashboard from "./StudentDashboard.jsx";
import TutorDashboard from "./TutorDashboard.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import ThemeToggle from "../../components/ThemeToggle";

const allowed = ["availability","book","schedule","cancel","evaluate","report"];

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [roleName, setRoleName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const didFetch = useRef(false);
  // ---------------- derive current section from URL ----------------
  const pathSeg = location.pathname
    .replace(/\/+$/,'')
    .split("/")
    .filter(Boolean)[1]; // e.g. /dashboard/book -> "book"
  const currentSection = allowed.includes(pathSeg) ? pathSeg : null;
  // -----------------------------------------------------------------

  // Chỉ gọi 1 lần khi mount
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const fetchProfile = async () => {
      try {
        const user = await authService.getProfile();
        setProfile(user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        navigate('/');
      }
    };
    fetchProfile();
  }, [navigate]);

  // Nếu chưa có segment sau khi có profile -> chuyển đến mặc định
  useEffect(() => {
    if (!profile) return;
    // xác định roleLower sớm để tái sử dụng
    const rl = (roleName || profile.role || "").toString().toLowerCase();
    const isTutor = rl === "tutor";
    const def = isTutor ? "availability" : "book";

    // nếu section = report mà không phải admin -> chuyển về mặc định
    if (currentSection === "report" && rl !== "admin") {
      navigate(`/dashboard/${def}`, { replace: true });
      return;
    }

    // nếu chưa có segment hợp lệ -> chuyển đến mặc định
    if (!currentSection) {
      if (pathSeg !== def) navigate(`/dashboard/${def}`, { replace: true });
    }
  }, [profile, roleName, currentSection, pathSeg, navigate]);

  useEffect(() => {
    document.body.classList.add("dashboard-view");
    return () => document.body.classList.remove("dashboard-view");
  }, []);

  // effect lấy tên role
  useEffect(() => {
    if (!profile || !profile.role) return;
    const loadRoleName = async () => {
      try {
        const roles = await authService.getRoles();
        const r = roles.find(x => String(x.id) === String(profile.role));
        if (r) setRoleName(r.name);
      } catch (e) {
        console.error("Error loading roles", e);
      }
    };
    loadRoleName();
  }, [profile]);

  if (!profile) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Loading...</p>;

  const roleLower = (roleName || profile.role || "").toString().toLowerCase();

  let items;
  if (roleLower === 'admin') {
    items = [
      { key: 'availability', label: 'Khả dụng' },
      { key: 'schedule', label: 'Lịch' },
      { key: 'evaluate', label: 'Đánh giá' },
      { key: 'report', label: 'Báo cáo' }
    ];
  } else if (roleLower === 'tutor') {
    items = [
      { key: 'availability', label: 'Khả dụng' },
      { key: 'schedule', label: 'Lịch' },
      { key: 'evaluate', label: 'Đánh giá' },
    ];
  } else if (roleLower === 'student') {
    items = [
      { key: 'availability', label: 'Khả dụng' },
      { key: 'book', label: 'Đặt lịch' },
      { key: 'schedule', label: 'Lịch' },
      { key: 'evaluate', label: 'Đánh giá' },
    ];
  } else {
    items = [
      { key: 'availability', label: 'Khả dụng' },
      { key: 'book', label: 'Đặt lịch' },
      { key: 'schedule', label: 'Lịch' },
      { key: 'evaluate', label: 'Đánh giá' },
    ];
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'availability': return <Availability profile={profile} roleName={roleName} />;
      case 'book': return <BookMeeting profile={profile} />;
      case 'schedule': return <CancelMeeting profile={profile} roleName={roleName} />;
      case 'cancel': return <CancelMeeting profile={profile} roleName={roleName} />;
      case 'evaluate': return <EvaluateSession profile={profile} roleName={roleName} />;
      case 'report': return roleLower === 'admin' ? <GenerateReport profile={profile} /> : <div className="panel"><p>Không có quyền.</p></div>;
      default: return <div className="panel"><p>Chọn một mục ở thanh điều hướng.</p></div>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    authService.clearProfileCache();
    authService.clearRolesCache();
    navigate('/');
  };

  return (
    <Layout user={profile} onLogout={handleLogout}>
      <div className="dashboard-shell">
        <nav className="dash-top-bar" aria-label="Dashboard navigation">
          <ul className="dash-top-list">
            {items.map(it => (
              <li key={it.key} className={currentSection === it.key ? 'active' : ''}>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/${it.key}`)}
                  aria-current={currentSection === it.key ? 'page' : undefined}
                >
                  {it.label}
                </button>
              </li>
            ))}
            <li className="spacer" />
            <li className="theme-item">
              <ThemeToggle />
            </li>
            <li>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </li>
          </ul>
        </nav>

        <div className="user-info-block">
          <h1 className="user-name">
            {profile.first_name || profile.username} {profile.last_name || ""}
          </h1>
          <p className="user-meta">
            Vai trò: <strong>{roleName || profile.role}</strong>
          </p>
        </div>

        <div className="dash-content-area">
          {/* Render theo section hoặc toàn bộ dashboard vai trò */}
          {currentSection ? renderSection() : (
            roleLower === 'student' ? <StudentDashboard profile={profile}/> :
            roleLower === 'tutor' ? <TutorDashboard profile={profile}/> :
            roleLower === 'admin' ? <AdminDashboard profile={profile}/> :
            <div className="panel"><p>Không xác định vai trò.</p></div>
          )}
        </div>
      </div>
    </Layout>
  );
}
