import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  GraduationCap, 
  CalendarRange, 
  Briefcase, 
  Bell, 
  BarChart3, 
  ScrollText 
} from 'lucide-react';

const adminLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/students', label: 'Students', icon: GraduationCap },
  { path: '/admin/drives', label: 'Placement Drives', icon: CalendarRange },
  { path: '/admin/jobs', label: 'Job Postings', icon: Briefcase },
  { path: '/admin/notifications', label: 'Announcements', icon: Bell },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function AdminNav() {
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
      {adminLinks.map((item) => {
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
              background: isActive ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
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
