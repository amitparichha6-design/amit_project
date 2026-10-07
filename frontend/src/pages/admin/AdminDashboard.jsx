import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  Users, 
  Building2, 
  Clock, 
  Briefcase, 
  CalendarRange, 
  FileText, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Database,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Fetching live placement metrics from SQLite...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />

      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-admin"><ShieldCheck size={14} /> TPO ADMIN DESK</span>
            <span className="badge badge-company"><Database size={12} /> SQLite Connected</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Placement Officer Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Real-time management of student profiles, company drives, eligibility criteria, and reports.
          </p>
        </div>

        {stats?.pending_companies > 0 && (
          <Link
            to="/admin/companies?status=PENDING"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Clock size={18} />
            <span>{stats.pending_companies} Company Registration(s) Pending Approval</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Students</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.total_students ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {stats?.verified_students ?? 0} Verified Profiles
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Companies</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.total_companies ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: stats?.pending_companies > 0 ? '#fbbf24' : 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.pending_companies ?? 0} Pending Approvals
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Drives</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              <CalendarRange size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.active_drives ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.active_jobs ?? 0} Active Job Postings
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Placed Students</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.selected_students ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {stats?.placement_rate_percentage ?? 0}% Placement Rate
          </div>
        </div>
      </div>

      {/* Secondary Highlights & Quick Action Center */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-emerald)' }} />
            Placement Statistics & Benchmarks
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Total Applications Processed</span>
              <span style={{ fontWeight: 700 }}>{stats?.total_applications ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Average Offered Salary</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{stats?.average_package || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Academic Eligibility Verification Rate</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {stats?.total_students > 0 ? Math.round((stats.verified_students / stats.total_students) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            Quick Administrative Operations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <Link to="/admin/companies" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
              <Building2 size={16} style={{ color: 'var(--accent-emerald)' }} />
              <span>Approve Companies</span>
            </Link>
            <Link to="/admin/students" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
              <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>Verify Students</span>
            </Link>
            <Link to="/admin/drives" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
              <CalendarRange size={16} style={{ color: 'var(--primary)' }} />
              <span>Create Drive</span>
            </Link>
            <Link to="/admin/reports" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
              <Award size={16} style={{ color: '#c084fc' }} />
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Log from SQLite */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Clock size={18} style={{ color: 'var(--text-dim)' }} />
            Recent Administrative Audit Trail
          </h2>
          <Link to="/admin/audit-logs" style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
            View Full Audit Logs &rarr;
          </Link>
        </div>

        {stats?.recent_activities?.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No recent audit activity recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats?.recent_activities?.slice(0, 5).map((log) => (
              <div 
                key={log.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text-main)' }}>{log.details || log.action}</span>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
