export default function Layout({ user, onLogout, children }) {
  return (
    <div className="layout-shell">
      {children}
    </div>
  );
}
