import React from 'react';

// Menu definitions per role
const BASE_ITEMS = [
  { key: 'availability', label: 'Tutor Availability', roles: ['tutor','admin'] },
  { key: 'book', label: 'Book Meeting', roles: ['student','tutor','admin'] },
  { key: 'cancel', label: 'Cancel Meeting', roles: ['student','tutor','admin'] },
  { key: 'evaluate', label: 'Evaluate Session', roles: ['student','tutor','admin'] },
  { key: 'report', label: 'Generate Report', roles: ['admin','tutor'] },
];

export default function DashboardNav({ role, active, onSelect }) {
  const items = BASE_ITEMS.filter(i => i.roles.includes(role));
  return (
    <nav className="dash-nav">
      <ul className="dash-nav-list">
        {items.map(item => (
          <li key={item.key} className={active === item.key ? 'active' : ''}>
            <button type="button" onClick={() => onSelect(item.key)}>{item.label}</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}