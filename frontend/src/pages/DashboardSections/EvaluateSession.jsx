import { useEffect, useState, useMemo } from "react";
import authService from "../../services/authService";

export default function EvaluateSession({ profile, roleName }) {
  const roleLower = (roleName || profile?.role_name || profile?.role || "")
    .toString()
    .toLowerCase();
  const isStudent = roleLower === "student";
  const isAdmin = roleLower === "admin";
  const isTutor = roleLower === "tutor";
  const canEdit = isStudent || isAdmin;
  const canView = canEdit || isTutor;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(canView);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [myTutorId, setMyTutorId] = useState(null);
  const [myTutorLoading, setMyTutorLoading] = useState(false);

  useEffect(() => {
    if (!isTutor) {
      setMyTutorId(null);
      setMyTutorLoading(false);
      return;
    }
    setMyTutorLoading(true);
    authService.getMyTutor()
      .then(data => setMyTutorId(data?.id ?? null))
      .catch(() => setMyTutorId(null))
      .finally(() => setMyTutorLoading(false));
  }, [isTutor]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    authService.getSessions()
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setError("Không tải được danh sách phiên."))
      .finally(() => setLoading(false));
  }, [canView]);

  const sessionLoading = loading || (isTutor && myTutorLoading);

  const sessionsVisible = useMemo(() => {
    if (isTutor) {
      if (!myTutorId) return [];
      return sessions.filter(s => String(s.tutor) === String(myTutorId));
    }
    return sessions;
  }, [sessions, isTutor, myTutorId]);

  useEffect(() => {
    if (!canView) return;
    const completed = sessionsVisible.filter(s => s.status === "completed");
    if (!completed.length) {
      setFeedbackMap({});
      return;
    }
    Promise.all(
      completed.map(s =>
        authService
          .getFeedback(s.id)
          .then(fbArr => ({ sessionId: s.id, fb: fbArr[0] || null }))
          .catch(() => ({ sessionId: s.id, fb: null }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => {
        map[r.sessionId] = {
          id: r.fb?.id || null,
          rating: r.fb?.rating || "",
          comment: r.fb?.comment || "",
          message: "",
          messageType: ""
        };
      });
      setFeedbackMap(map);
    });
  }, [sessionsVisible, canView]);

  const handleChange = (sessionId, field, value) => {
    if (!canEdit) return;
    setFeedbackMap((m) => {
      const prev = m[sessionId] || { rating: "", comment: "", message: "", messageType: "" };
      let nextMsg = prev.message;
      let nextType = prev.messageType;
      let nextValue = value;

      if (field === "comment") {
        if (value.length > 200) {
          nextMsg = "Nhận xét tối đa 200 ký tự.";
          nextType = "error";
          nextValue = value.slice(0, 200);
        } else if (nextType === "error" && nextMsg === "Nhận xét tối đa 200 ký tự.") {
          nextMsg = "";
          nextType = "";
        }
      }

      if (field === "rating" && nextType === "error" && nextMsg === "Vui lòng chọn rating (1-5) trước khi gửi.") {
        nextMsg = "";
        nextType = "";
      }

      return {
        ...m,
        [sessionId]: {
          ...prev,
          [field]: field === "comment" ? nextValue : value,
          message: nextMsg,
          messageType: nextType
        }
      };
    });
  };

  const handleSave = async (sessionId) => {
    if (!canEdit) return;
    const fb = feedbackMap[sessionId];
    if (!fb) return;

    if (!fb.rating) {
      setFeedbackMap((m) => ({
        ...m,
        [sessionId]: { ...fb, message: "Vui lòng chọn rating (1-5) trước khi gửi.", messageType: "error" }
      }));
      return;
    }

    const ratingValue = Number(fb.rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setFeedbackMap((m) => ({
        ...m,
        [sessionId]: { ...fb, message: "Rating phải trong khoảng 1-5.", messageType: "error" }
      }));
      return;
    }

    if ((fb.comment || "").length > 200) {
      setFeedbackMap((m) => ({
        ...m,
        [sessionId]: { ...fb, message: "Nhận xét tối đa 200 ký tự.", messageType: "error" }
      }));
      return;
    }

    setSavingId(sessionId);
    try {
      if (fb.id) {
        const updated = await authService.updateFeedback(fb.id, {
          rating: fb.rating || null,
          comment: fb.comment || ""
        });
        setFeedbackMap((m) => ({
          ...m,
          [sessionId]: {
            id: updated.id,
            rating: updated.rating || "",
            comment: updated.comment || "",
            message: "Đã cập nhật.",
            messageType: "success"
          }
        }));
      } else {
        const created = await authService.createFeedback({
          session: sessionId,
          rating: fb.rating || null,
          comment: fb.comment || ""
        });
        setFeedbackMap((m) => ({
          ...m,
          [sessionId]: {
            id: created.id,
            rating: created.rating || "",
            comment: created.comment || "",
            message: "Đã lưu.",
            messageType: "success"
          }
        }));
      }
    } catch {
      setFeedbackMap((m) => ({
        ...m,
        [sessionId]: { ...fb, message: "Lưu thất bại.", messageType: "error" }
      }));
    } finally {
      setSavingId(null);
    }
  };

  const fmt = dt => {
    try { return new Date(dt).toLocaleString("vi-VN", { hour12: false }); }
    catch { return dt; }
  };

  const completedSessions = sessionsVisible
    .filter(s => s.status === "completed")
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  if (!canView) {
    return (
      <div className="panel evaluate-panel">
        <h3 className="section-title">Đánh giá buổi học</h3>
        <p className="empty-info">Chỉ sinh viên, tutor hoặc admin mới xem được đánh giá.</p>
      </div>
    );
  }

  return (
    <div className="panel evaluate-panel">
      <h3 className="section-title">Đánh giá buổi học</h3>
      <p className="small-note">
        Chỉ các phiên đã hoàn thành (completed) mới hiển thị. Tutor chỉ xem, sinh viên/Admin có thể chỉnh sửa.
      </p>
      {error && <p className="auth-message error">{error}</p>}
      {sessionLoading && <p>Đang tải...</p>}
      {!sessionLoading && completedSessions.length === 0 && (
        <p className="empty-info">Chưa có phiên completed.</p>
      )}

      <div className="evaluate-list">
        {completedSessions.map(s => {
          const fb = feedbackMap[s.id] || { rating: "", comment: "", message: "" };
          return (
            <div key={s.id} className="evaluate-item">
              <div className="evaluate-header">
                <strong>{fmt(s.start_time)}</strong>
                <span>→ {fmt(s.end_time)}</span>
                <span className="ev-mode">{s.mode}</span>
              </div>
              <div className="evaluate-meta">
                <span>Tutor: {s.tutor}</span>
                {s.location && <span>Địa điểm: {s.location}</span>}
              </div>
              {canEdit ? (
                <div className="evaluate-form">
                  <label>
                    Rating (1-5)
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="inline-input"
                      value={fb.rating}
                      onChange={e => handleChange(s.id, "rating", e.target.value)}
                      placeholder="(optional)"
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Nhận xét
                    <textarea
                      className="inline-textarea"
                      rows={3}
                      value={fb.comment}
                      onChange={e => handleChange(s.id, "comment", e.target.value)}
                      placeholder="Cảm nhận / góp ý (tuỳ chọn)"
                    />
                  </label>
                  <div className="evaluate-actions" style={{ gridColumn: "1/-1" }}>
                    <button
                      type="button"
                      className="auth-button"
                      style={{ maxWidth: "160px" }}
                      disabled={savingId === s.id}
                      onClick={() => handleSave(s.id)}
                    >
                      {savingId === s.id
                        ? "Đang lưu..."
                        : fb.id
                          ? "Cập nhật đánh giá"
                          : "Lưu đánh giá"}
                    </button>
                    {fb.message && (
                      <span
                        className={`ev-msg ${fb.messageType === "error" ? "err" : "ok"}`}
                      >
                        {fb.message}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="evaluate-form" style={{ gridTemplateColumns: "1fr" }}>
                  <p className="small-note">
                    Student: {s.student_name || s.student_username || s.student}
                  </p>
                  <p className="small-note">
                    Rating: {fb.rating ? `${fb.rating}★` : "Chưa có"}
                  </p>
                  <p className="small-note">
                    Nhận xét: {fb.comment ? fb.comment : "Chưa có nhận xét."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}