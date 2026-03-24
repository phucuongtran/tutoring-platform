import axios from "axios";
import { API_BASE, USERS_API } from "../config/api";

// Create an axios instance so we can attach interceptors without affecting global axios
const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });

// Public (không cần token) endpoints -> bỏ Authorization nếu có token hết hạn
const PUBLIC_ENDPOINTS = [
  "users/faculties/",
  "users/majors/",
  "users/roles/",
  "users/register/student/",
];

function isPublic(config) {
  // config.url có thể là full URL hoặc relative; chuẩn hoá về phần sau /api/
  const url = (config.url || "").replace(API_BASE, "").replace(/^\//, "");
  return PUBLIC_ENDPOINTS.some((p) => url.startsWith(p));
}

// Token refresh control to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// Request interceptor: attach access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token && !isPublic(config)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 try to refresh the token, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response or not 401, just propagate
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Nếu là endpoint công khai và có Authorization thì thử 1 lần bỏ header rồi gửi lại
    if (isPublic(originalRequest) && originalRequest.headers?.Authorization && !originalRequest._publicRetry) {
      originalRequest._publicRetry = true;
      // Bỏ header để backend trả về dữ liệu public
      delete originalRequest.headers.Authorization;
      return api(originalRequest);
    }

    // Prevent infinite loop: nếu đã retry refresh hoặc gọi chính refresh endpoint
    if (originalRequest._retry || /token\/refresh\/$/.test(originalRequest.url || "")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // If refresh in progress, queue the request and resolve when refreshed
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        // No refresh token -> cannot refresh
        isRefreshing = false;
        onRefreshed(null);
        return Promise.reject(error);
      }

      // Use plain axios (not the instance) to avoid interceptor loops
      const resp = await axios.post(API_BASE + "token/refresh/", { refresh });
      const newAccess = resp.data.access;
      localStorage.setItem("access", newAccess);

      // Notify queued requests
      onRefreshed(newAccess);
      isRefreshing = false;

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed: clear tokens and propagate error (frontend should redirect to login)
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      isRefreshing = false;
      onRefreshed(null);
      // Nếu request gốc là public -> gửi lại không header để lấy dữ liệu công khai
      if (isPublic(originalRequest) && originalRequest.headers?.Authorization) {
        delete originalRequest.headers.Authorization;
        return api(originalRequest);
      }
      return Promise.reject(refreshError);
    }
  }
);

let profileCache = null;
let rolesCache = null;

const registerStudent = async (form) => {
  const res = await api.post(USERS_API + "register/student/", { ...form });
  return res.data;
};

const login = async (username, password) => {
  // Use plain axios to avoid request interceptor attaching stale token
  const res = await axios.post(API_BASE + "token/", { username, password });
  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  return res.data;
};

const getProfile = async () => {
  if (profileCache) return profileCache;
  const res = await api.get(USERS_API + "profiles/me/");
  profileCache = res.data;
  return profileCache;
};

const getFaculties = async () => {
  const res = await api.get(USERS_API + "faculties/");
  return res.data;
};

const getMajors = async (facultyId) => {
  const url = facultyId ? `${USERS_API}majors/?faculty=${facultyId}` : `${USERS_API}majors/`;
  const res = await api.get(url);
  return res.data;
};

const getRoles = async () => {
  if (rolesCache) return rolesCache;
  const res = await api.get(USERS_API + "roles/");
  rolesCache = res.data;
  return rolesCache;
};

const refreshToken = async () => {
  const refresh = localStorage.getItem("refresh");
  const res = await axios.post(API_BASE + "token/refresh/", { refresh });
  localStorage.setItem("access", res.data.access);
  return res.data;
};

const clearProfileCache = () => { profileCache = null; };
const clearRolesCache = () => { rolesCache = null; };
const getTutors = async () => {
  try {
    const res = await api.get("tutoring/tutors/");
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error("getTutors error:", e);
    return [];
  }
};
const getMyTutor = async () => {
  const res = await api.get("tutoring/tutors/me/");
  return res.data;
};

const updateMyTutor = async (patch) => {
  const res = await api.patch("tutoring/tutors/me/", patch);
  return res.data;
};

const seedTutorAvailability = async () => {
  // Mẫu availability đơn giản
  const sample = {
    monday: ["08:00-10:00", "14:00-16:00"],
    wednesday: ["09:00-11:00"],
    friday: ["13:30-15:00"],
    online_only: true
  };
  // PATCH vào /tutoring/tutors/me/
  const res = await api.patch("tutoring/tutors/me/", { availability: sample });
  return res.data;
};
const createSession = async (data) => {
  const res = await api.post("tutoring/sessions/", data);
  return res.data;
};
const getSessions = async () => {
  const res = await api.get("tutoring/sessions/");
  return Array.isArray(res.data) ? res.data : [];
};
const cancelSession = async (id, reason) => {
  const payload = { status: "cancelled" };
  if (reason !== undefined) payload.reason = reason;
  const res = await api.patch(`tutoring/sessions/${id}/`, payload);
  return res.data;
};
const deleteSession = async (id) => {
  await api.delete(`tutoring/sessions/${id}/`);
};
const getFeedback = async (sessionId) => {
  const res = await api.get(`feedback/feedback/?session=${sessionId}`);
  return Array.isArray(res.data) ? res.data : [];
};

const createFeedback = async ({ session, rating, comment }) => {
  const res = await api.post("feedback/feedback/", { session, rating, comment });
  return res.data;
};

const updateFeedback = async (id, patch) => {
  const res = await api.patch(`feedback/feedback/${id}/`, patch);
  return res.data;
};

const getReportOverview = async (params = {}) => {
  const qp = new URLSearchParams();
  if (params.from) qp.append("from", params.from);
  if (params.to) qp.append("to", params.to);
  const url = "tutoring/reports/overview/" + (qp.toString() ? `?${qp.toString()}` : "");
  const res = await api.get(url);
  return res.data;
};

// USAGE (tutor):
// 1) login(username,password) -> lưu token
// 2) getMyTutor() -> lấy thông tin Tutor + availability (yêu cầu đã có Tutor record hoặc BE tự tạo)
// 3) updateMyTutor({ availability: {...} }) -> PATCH lịch rảnh
// 4) seedTutorAvailability() -> ghi đè availability mẫu

export default {
  registerStudent,
  login,
  getProfile,
  refreshToken,
  getFaculties,
  getMajors,
  getRoles,
  clearProfileCache,
  clearRolesCache,
  getTutors,
  getMyTutor,
  updateMyTutor,
  seedTutorAvailability,
  createSession,
  getSessions,
  cancelSession,
  deleteSession,
  getFeedback,
  createFeedback,
  updateFeedback,
  getReportOverview
};
