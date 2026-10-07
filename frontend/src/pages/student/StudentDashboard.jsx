import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../services/api';
import StudentNav from '../../components/StudentNav';
import { 
  GraduationCap, 
  Award, 
  Briefcase, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load Student Dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <StudentNav />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving placement dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const completionColor = (data?.profile_completion || 0) >= 80 ? 'var(--accent-emerald)' : (data?.profile_completion || 0) >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';

  return (
    <div>
      <StudentNav />

      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-student">
              <GraduationCap size={14} /> STUDENT PORTAL
            </span>
            {data?.is_verified ? (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle2 size={13} /> PROFILE VERIFIED
              </span>
            ) : (
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Clock size={13} /> PENDING TPO VERIFICATION
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Welcome back, {user?.student_profile?.full_name || user?.email}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.student_profile?.roll_number ? `Roll: ${user.student_profile.roll_number} • ` : ''}
            {user?.student_profile?.department || 'Department'} • Class of {user?.student_profile?.graduation_year || '2026'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/student/jobs" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
            <Briefcase size={16} />
            <span>Browse Eligible Jobs ({data?.total_eligible_jobs || 0})</span>
          </Link>
          <Link to="/student/profile" className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
            Complete Profile
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span>{error}</span>
        </div>
      )}

      {!data?.is_verified && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fbbf24', fontSize: '0.925rem' }}>Profile Verification Required to Apply</strong>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Your academic credentials are being reviewed by the TPO. You can view eligible drives, but applications unlock once verified.
              </div>
            </div>
          </div>
          <Link to="/student/profile" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            Review Profile Data
          </Link>
        </div>
      )}

      {/* Metrics Row 1 */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {/* Profile Completion */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Profile Completion
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: completionColor }}>
            {data?.profile_completion || 0}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${data?.profile_completion || 0}%`,
              height: '100%',
              background: completionColor,
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* CGPA & Backlogs */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Academic Standing
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>
            {data?.cgpa !== null && data?.cgpa !== undefined ? data.cgpa.toFixed(2) : 'N/A'}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}> / 10</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: (data?.backlogs || 0) === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginTop: '8px' }}>
            {(data?.backlogs || 0) === 0 ? '✓ Zero Active Backlogs' : `⚠️ ${data?.backlogs} Active Backlog(s)`}
          </div>
        </div>

        {/* Eligible Jobs */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Eligible Jobs
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {data?.total_eligible_jobs || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Qualified via Eligibility Engine
          </div>
        </div>

        {/* Applied & Shortlisted */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Applications & Status
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>
            {data?.applied_jobs_count || 0}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 400 }}> applied</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: (data?.shortlisted_count || 0) > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: '8px' }}>
            {data?.shortlisted_count || 0} Shortlisted / In Review
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Interviews & Applications + Notifications */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Upcoming Interviews & Active Applications */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-emerald)' }} />
              Upcoming Interviews & Recent Applications
            </h2>
            <Link to="/student/applications" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {/* Upcoming Interviews Highlight */}
          {data?.upcoming_interviews && data.upcoming_interviews.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.upcoming_interviews.map((app) => (
                <div key={app.id} style={{
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{app.job_title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{app.company_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                      INTERVIEW: {app.interview_date ? new Date(app.interview_date).toLocaleDateString() : 'Scheduled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Applications List */}
          {(!data?.recent_applications || data.recent_applications.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <Briefcase size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>You haven't submitted any job applications yet.</p>
              <Link to="/student/jobs" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                Explore Campus Openings
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_applications.slice(0, 4).map((app) => (
                <div key={app.id} style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{app.job_title}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {app.company_name} • Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${
                      app.status === 'SELECTED' ? 'badge-company' :
                      app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED' ? 'badge-student' :
                      app.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Announcements */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} />
              Notifications & TPO Circulars
              {(data?.unread_notifications_count || 0) > 0 && (
                <span className="badge" style={{ background: 'var(--accent-rose)', color: '#fff', fontSize: '0.7rem' }}>
                  {data.unread_notifications_count} unread
                </span>
              )}
            </h2>
            <Link to="/student/notifications" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Inbox <ArrowRight size={14} />
            </Link>
          </div>

          {(!data?.recent_notifications || data.recent_notifications.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>No notifications received yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_notifications.slice(0, 4).map((n) => (
                <div key={n.id} style={{
                  padding: '12px 14px',
                  background: n.is_read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.08)',
                  border: n.is_read ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: n.is_read ? 'var(--text-main)' : '#ffffff' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
