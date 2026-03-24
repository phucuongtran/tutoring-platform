const DEFAULT_API_URL = "http://localhost:8000/api/";

function normalizeApiBase(url) {
  if (!url) return DEFAULT_API_URL;
  return url.endsWith("/") ? url : `${url}/`;
}

export const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL || DEFAULT_API_URL);
export const USERS_API = `${API_BASE}users/`;
