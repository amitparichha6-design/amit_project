import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  FileText, 
  Bell
} from 'lucide-react';

const studentLinks = [
  { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/profile', label: 'My Profile & Resume', icon: User },
  { path: '/student/jobs', label: 'Campus Jobs & Drives', icon: Briefcase },
  { path: '/student/applications', label: 'My Applications', icon: FileText },
  { path: '/student/notifications', label: 'Notifications', icon: Bell },
];

export default function StudentNav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      padding: '4px',
      marginBottom: '24px',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      scrollbarWidth: 'none',
    }}>
      {studentLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              background: isActive ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(6, 182, 212, 0.3)' : 'none',
            })}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
