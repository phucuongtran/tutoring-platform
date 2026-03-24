import { useEffect, useState, useCallback } from "react";
import authService from "../../services/authService";

export default function GenerateReport({ profile }) {
  const isAdmin = (profile?.role_name || profile?.role || "").toString().toLowerCase() === "admin";
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authService.getReportOverview({ from, to });
      setOverview(data || {});
    } catch {
      setError("Không lấy được báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) {
    return (
      <div className="panel">
        <h3 className="section-title">Báo cáo</h3>
        <p className="empty-info">Chỉ admin mới xem được báo cáo tổng hợp.</p>
      </div>
    );
  }

  const sessions = overview?.sessions || {};
  const completed = sessions.completed || 0;
  const total = sessions.total || (completed + (sessions.cancelled || 0) + (sessions.scheduled || 0));
  const completionRate = total ? ((completed / total) * 100).toFixed(1) : "0.0";

  const feedback = overview?.feedback || {};
  const avgRating = feedback.average_rating ?? (feedback.count ? (feedback.sum_rating / feedback.count).toFixed(2) : "—");
  const dist = feedback.distribution || {};
  const tutors = Array.isArray(overview?.tutors) ? overview.tutors : [];

  return (
    <div className="panel report-panel">
      <h3 className="section-title">Báo cáo hệ thống</h3>
      <p className="small-note">Thống kê hỗ trợ ra quyết định (attendance & feedback).</p>
      <div className="report-filters">
        <label>
          Từ ngày
          <input
            type="date"
            className="inline-input"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            className="inline-input"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="auth-button"
          disabled={refreshing || loading}
          onClick={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          style={{ maxWidth: "160px" }}
        >
          {refreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && <p className="auth-message error">{error}</p>}
      {loading && <p>Đang tải báo cáo...</p>}
      {!loading && !error && (
        <div className="report-grid">
          <div className="report-card">
            <h4>Phiên học</h4>
            <ul className="stat-list">
              <li>Tổng: {total}</li>
              <li>Hoàn thành: {completed}</li>
              <li>Đã hủy: {sessions.cancelled || 0}</li>
              <li>Đang chờ: {sessions.scheduled || 0}</li>
              <li>Tỷ lệ hoàn thành: {completionRate}%</li>
            </ul>
          </div>
          <div className="report-card">
            <h4>Feedback</h4>
            <ul className="stat-list">
              <li>Số lượng: {feedback.count || 0}</li>
              <li>Điểm TB: {avgRating || "—"}</li>
            </ul>
            <div className="rating-dist">
              {[1,2,3,4,5].map(r => {
                const val = dist[r] || 0;
                const percent = feedback.count ? ((val / feedback.count) * 100) : 0;
                return (
                  <div key={r} className="rating-row">
                    <span className="r-label">{r}★</span>
                    <div className="r-bar-wrap">
                      <div className="r-bar" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="r-val">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="report-card" style={{ gridColumn: "1 / -1" }}>
            <h4>Top Tutor (đã hoàn thành)</h4>
            {tutors.length === 0 && <p className="empty-info">Không có dữ liệu tutor.</p>}
            <div className="tutor-rank-list">
              {tutors.slice(0, 8).map(t => (
                <div key={t.id} className="tutor-rank-item">
                  <span className="t-name">{t.name || t.id}</span>
                  <span className="t-completed">Completed: {t.completed_sessions ?? t.completed ?? 0}</span>
                  <span className="t-rating">Avg ★ {t.avg_rating ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}