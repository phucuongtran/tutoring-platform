import { useEffect, useState } from "react";
import authService from "../../services/authService";

const DAYS = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
  { key: "sunday", label: "CN" },
];

export default function Availability({ profile, roleName }) {
  // phân biệt vai trò bằng roleName từ Dashboard (tránh lỗi id số)
  const isTutor = (roleName || "").toString().toLowerCase() === "tutor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tutor, setTutor] = useState(null);
  const [availability, setAvailability] = useState({});
  const [day, setDay] = useState("monday");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [tutorsList, setTutorsList] = useState([]);

  // Load data based on role
  useEffect(() => {
    if (isTutor) {
      authService
        .getMyTutor()
        .then((data) => {
          setTutor(data);
          setAvailability(data?.availability || {});
        })
        .catch(() => setError("Không tải được dữ liệu tutor."))
        .finally(() => setLoading(false));
    } else {
      authService
        .getTutors()
        .then((list) => setTutorsList(list || []))
        .catch(() => setTutorsList([]))
        .finally(() => setLoading(false));
    }
  }, [isTutor]);

  const toMinutes = (timeStr) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    return hh * 60 + mm;
  };

  const overlaps = (slotA, slotB) => {
    const [aStart, aEnd] = slotA.split("-").map(toMinutes);
    const [bStart, bEnd] = slotB.split("-").map(toMinutes);
    return aStart < bEnd && bStart < aEnd;
  };

  const addSlot = () => {
    if (!start || !end) return;
    if (end <= start) {
      setError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    const newSlot = `${start}-${end}`;
    const existing = availability[day] || [];
    if (existing.some((slot) => overlaps(slot, newSlot))) {
      setError("Slot bị trùng hoặc chồng lấp với slot hiện có, hãy chọn khung giờ khác.");
      return;
    }
    setError("");
    setAvailability((prev) => {
      const arr = prev[day] ? [...prev[day]] : [];
      arr.push(newSlot);
      return { ...prev, [day]: arr };
    });
    setStart("");
    setEnd("");
  };

  const removeSlot = (d, slot) => {
    setAvailability((prev) => {
      const arr = (prev[d] || []).filter((s) => s !== slot);
      const next = { ...prev, [d]: arr };
      if (arr.length === 0) delete next[d];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { availability };
      const updated = await authService.updateMyTutor(payload);
      setTutor(updated);
      setAvailability(updated.availability || {});
    } catch (e) {
      setError("Lưu không thành công.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await authService.seedTutorAvailability();
      setTutor(updated);
      setAvailability(updated.availability || {});
    } catch {
      setError("Không tạo được dữ liệu mẫu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="panel"><p>Đang tải...</p></div>;

  // Non tutor view
  if (!isTutor) {
    return (
      <div className="panel availability-wrapper">
        <h3 className="section-title">Availability Tutor</h3>
        {tutorsList.length === 0 && <p className="empty-info">Không có tutor nào.</p>}
        <div className="readonly-tutor-list">
          {tutorsList.map((t) => {
            const headerName = typeof t.profile === "number" ? `Tutor #${t.id}` : (t.profile || `Tutor #${t.id}`);
            return (
              <div key={t.id} className="readonly-tutor-card">
                <h3>{headerName}</h3>
                <p className="small-note">Expertise: {t.expertise || "—"}</p>
                {t.availability ? (
                  Object.entries(t.availability).map(([d, slots]) => (
                    <div key={d} style={{ marginTop: ".35rem" }}>
                      <strong>{d}:</strong>{" "}
                      {Array.isArray(slots) && slots.length ? slots.join(", ") : "—"}
                    </div>
                  ))
                ) : (
                  <p>Chưa có lịch rảnh.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Tutor editor
  return (
    <div className="panel availability-wrapper">
      <h3 className="section-title">Quản lý Availability</h3>
      <div className="avail-actions">
        <button
          type="button"
          className="mini-btn seed"
          disabled={saving}
          onClick={handleSeed}
          title="Tạo nhanh dữ liệu mẫu (ghi đè availability hiện tại)"
        >
          {saving ? "..." : "Dữ liệu mẫu"}
        </button>
        <button
          type="button"
          className="mini-btn"
          disabled={saving}
          onClick={handleSave}
          title="Lưu các thay đổi"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
      <p className="small-note">
        Thêm khung giờ rảnh để sinh viên đặt lịch (HH:MM). Bạn có thể tạo dữ liệu mẫu để test nhanh.
      </p>
      {error && <p className="auth-message error">{error}</p>}

      <div className="avail-current">
        {Object.keys(availability).length === 0 && (
          <p className="empty-info">Chưa có slot nào, hãy thêm.</p>
        )}
        {DAYS.map((d) =>
          (availability[d.key] || []).length ? (
            <div key={d.key} className="avail-day-block">
              <h4>{d.label}</h4>
              {(availability[d.key] || []).map((slot) => (
                <span className="slot-badge" key={slot}>
                  {slot}
                  <button
                    type="button"
                    aria-label="Xóa slot"
                    onClick={() => removeSlot(d.key, slot)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null
        )}
      </div>

      <div className="avail-editor">
        <div className="avail-form-row">
          <select
            className="inline-select"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {DAYS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            className="inline-input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <span style={{ alignSelf: "center", fontSize: ".7rem" }}>→</span>
          <input
            type="time"
            className="inline-input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          <button
            type="button"
            className="auth-button"
            style={{ flex: "0 0 auto", maxWidth: "140px" }}
            onClick={addSlot}
          >
            Thêm slot
          </button>
        </div>
      </div>
    </div>
  );
}