import { useEffect, useState, useMemo } from "react";
import authService from "../../services/authService";

const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

export default function BookMeeting({ profile }) {
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("offline");
  const [location, setLocation] = useState("");
  const [slot, setSlot] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authService.getTutors()
      .then(data => setTutors(data))
      .finally(() => setLoadingTutors(false));
  }, []);

  const selectedTutorObj = useMemo(
    () => tutors.find(t => String(t.id) === String(selectedTutor)),
    [selectedTutor, tutors]
  );

  const dayKey = useMemo(() => {
    if (!date) return null;
    const d = new Date(date + "T00:00:00");
    return dayMap[d.getDay()];
  }, [date]);

  const availableSlots = useMemo(() => {
    if (!selectedTutorObj || !dayKey) return [];
    const avail = selectedTutorObj.availability || {};
    const arr = avail[dayKey] || [];
    return Array.isArray(arr) ? arr : [];
  }, [selectedTutorObj, dayKey]);

  // helper: today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Disallow past date
  const isPastDate = useMemo(() => {
    if (!date) return false;
    return new Date(date + "T00:00:00") < new Date(todayStr + "T00:00:00");
  }, [date, todayStr]);

  const hasRequired = selectedTutor && date && slot && mode && !isPastDate;
  const canSubmit = hasRequired && !submitting;

  const handleBook = async () => {
    if (!hasRequired) {
      if (isPastDate) {
        setStatus("Không thể đặt lịch cho ngày đã qua.");
        return;
      }
      const missing = [];
      if (!selectedTutor) missing.push("chọn tutor");
      if (!date) missing.push("chọn ngày");
      if (!slot) missing.push("chọn khung giờ");
      setStatus(`Vui lòng ${missing.join(", ")} trước khi đặt lịch.`);
      return;
    }
    setSubmitting(true);
    setStatus("");
    try {
      // slot format "HH:MM-HH:MM"
      const [startTimeRaw, endTimeRaw] = slot.split("-");
      const startISO = new Date(date + "T" + startTimeRaw + ":00").toISOString();
      const endISO = new Date(date + "T" + endTimeRaw + ":00").toISOString();
      const payload = {
        tutor: selectedTutor,
        // student: BE sẽ tự gán (student read_only theo serializer)
        start_time: startISO,
        end_time: endISO,
        mode,
        location: mode === "offline" ? location || null : null
      };
      await authService.createSession(payload);
      setStatus("Đặt lịch thành công.");
      setTutors(prev =>
        prev.map(t => {
          if (String(t.id) !== String(selectedTutor) || !t.availability) return t;
          const nextAvail = { ...t.availability };
          const list = Array.isArray(nextAvail[dayKey]) ? [...nextAvail[dayKey]] : [];
          const idx = list.indexOf(slot);
          if (idx !== -1) list.splice(idx, 1);
          if (list.length) {
            nextAvail[dayKey] = list;
          } else {
            delete nextAvail[dayKey];
          }
          return { ...t, availability: nextAvail };
        })
      );
      setSlot("");
    } catch (e) {
      const resp = e?.response?.data;
      let msg = "";
      if (resp) {
        if (typeof resp === "string") msg = resp;
        else if (resp.detail) msg = resp.detail;
        else if (Array.isArray(resp.non_field_errors)) msg = resp.non_field_errors.join(" ");
        else if (resp.non_field_errors) msg = String(resp.non_field_errors);
      }
      setStatus(msg || "Đặt lịch thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel booking-panel">
      <h3 className="section-title">Đặt lịch học</h3>
      <p className="small-note">
        Chọn tutor, ngày và một slot trống từ availability của tutor.
      </p>
      {status && (
        <p className={`auth-message ${status.includes("thành công") ? "success" : "error"}`}>
          {status}
        </p>
      )}
      {loadingTutors && <p>Đang tải danh sách tutor...</p>}
      {!loadingTutors && tutors.length === 0 && <p>Không có tutor nào.</p>}

      <div className="booking-form">
        <label>
          Tutor
          <select
            className="inline-select"
            value={selectedTutor}
            onChange={e => { setSelectedTutor(e.target.value); setSlot(""); }}
          >
            <option value="">-- Chọn tutor --</option>
            {tutors.map(t => {
              const label = typeof t.profile === "number" ? `Tutor #${t.id}` : (t.profile || `Tutor #${t.id}`);
              return (
                <option key={t.id} value={t.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          Ngày
          <input
            type="date"
            className="inline-input"
            value={date}
            min={todayStr} // chặn chọn ngày quá khứ
            onChange={e => { setDate(e.target.value); setSlot(""); }}
          />
        </label>

        <label>
          Slot
          <select
            className="inline-select"
            value={slot}
            onChange={e => {
              setSlot(e.target.value);
              if (status) setStatus("");
            }}
            disabled={!availableSlots.length}
          >
            <option value="">
              {selectedTutor && date
                ? availableSlots.length
                  ? "-- Chọn khung giờ --"
                  : "Không có slot"
                : "Chọn tutor & ngày trước"}
            </option>
            {availableSlots.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Mode
          <select
            className="inline-select"
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </select>
        </label>

        {mode === "offline" && (
          <label>
            Địa điểm (tuỳ chọn)
            <input
              type="text"
              className="inline-input"
              placeholder="Ví dụ: Phòng B203"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </label>
        )}

        <div className="booking-actions">
          <button
            type="button"
            className="auth-button"
            disabled={submitting}
            onClick={handleBook}
            style={{ maxWidth: "170px" }}
          >
            {submitting ? "Đang gửi..." : "Đặt lịch"}
          </button>
        </div>
      </div>

      {selectedTutorObj && date && (
        <div className="small-note" style={{ marginTop: ".8rem" }}>
          Ngày {date} thuộc {dayKey || "?"}. Slots hiển thị dựa trên availability của tutor.
        </div>
      )}

      {selectedTutorObj && date && isPastDate && (
        <div className="auth-message error" style={{ marginTop: ".5rem" }}>
          Không thể đặt lịch cho ngày đã qua.
        </div>
      )}
    </div>
  );
}