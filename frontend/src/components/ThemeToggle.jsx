import { useEffect, useState } from "react";
import "../styles.css";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // Load trạng thái dark mode khi mở trang
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.body.classList.toggle("dark-mode", saved);
  }, []);

  // Cập nhật body + lưu vào localStorage khi đổi mode
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <div className="theme-toggle-global">
      <button
        className="theme-button"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
    </div>
  );
}
