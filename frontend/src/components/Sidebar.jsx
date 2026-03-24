import { Link } from "react-router-dom";

export default function Sidebar({ role }) {
  return (
    <aside className="sidebar">
      <ul>
        <li><Link to="/dashboard">🏠 Dashboard</Link></li>
        {role === "student" && (
          <>
            <li><Link to="/dashboard/find-tutor">Find Tutor</Link></li>
            <li><Link to="/dashboard/bookings">My Bookings</Link></li>
          </>
        )}
        {role === "tutor" && (
          <>
            <li><Link to="/dashboard/schedule">My Schedule</Link></li>
            <li><Link to="/dashboard/students">My Students</Link></li>
          </>
        )}
        {role === "admin" && (
          <>
            <li><Link to="/dashboard/users">Manage Users</Link></li>
            <li><Link to="/dashboard/reports">Reports</Link></li>
          </>
        )}
        <li><Link to="/dashboard/profile">Profile</Link></li>
      </ul>
    </aside>
  );
}
