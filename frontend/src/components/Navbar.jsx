import ThemeToggle from "./ThemeToggle";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <h1 className="navbar-logo">TutorHub</h1>
      <div className="navbar-right">
        <span className="navbar-user">Hi, {user?.first_name || "User"} 👋</span>
        <ThemeToggle />
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
