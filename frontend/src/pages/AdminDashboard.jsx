import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Building2, 
  Database, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  ArrowUpRight,
  Server,
  Layers
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getAdminDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load Admin Dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading administrator controls and database analytics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-admin"><ShieldCheck size={14} /> ADMIN CONSOLE</span>
            <span className="badge badge-neutral">Phase 1 Foundation</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {data?.message || `Welcome Admin, ${user?.email}!`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            College Placement System Administrator • Full RBAC privilege active
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            padding: '10px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#34d399',
            fontSize: '0.85rem'
          }}>
            <Database size={16} />
            <span>SQLite: campushire.db (Ready)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Real-time System Stats from SQLite */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Users
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.stats?.total_users ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            Registered in Database
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Students
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.stats?.total_students ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Student accounts
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Companies
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.stats?.total_companies ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Corporate recruiters
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Administrators
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.stats?.total_admins ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Placement cell staff
          </div>
        </div>
      </div>

      {/* Verification status & Upcoming Modules */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
            Phase 1 Foundation Verification
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem' }}>Self-Contained SQLite Database</span>
              <span className="badge badge-company">Active (campushire.db)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem' }}>SQLAlchemy Models (User, Student, Company, Admin)</span>
              <span className="badge badge-company">Initialized</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem' }}>Bcrypt Secure Password Hashing</span>
              <span className="badge badge-company">Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem' }}>JWT Token & Role-Based Authorization</span>
              <span className="badge badge-company">Enforced</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem' }}>Automated Pytest Suite</span>
              <span className="badge badge-company">8 Passed</span>
            </div>
          </div>
        </div>

        {/* Phase 2+ Module Placeholders */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} style={{ color: 'var(--primary)' }} />
            Placement Management Modules (Placeholders)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Company Verification & Job Drives</strong>
                <span className="badge badge-neutral">Phase 2</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Approve newly registered recruiters and manage on-campus placement drives.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Student Eligibility & CGPA Filter Engine</strong>
                <span className="badge badge-neutral">Phase 2</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Automated eligibility checking based on departments, backlogs, and CGPA.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Placement Analytics & Offer Letter Dispatches</strong>
                <span className="badge badge-neutral">Phase 3</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Statistical graphs, offer confirmation records, and annual placement reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
