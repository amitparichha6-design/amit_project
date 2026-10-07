import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../services/api';
import StudentNav from '../../components/StudentNav';
import { 
  FileText, 
  Building2, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  ExternalLink,
  Award,
  Sparkles,
  MapPin,
  CalendarCheck
} from 'lucide-react';

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badgeClass: 'badge-neutral',
    description: 'Application successfully received. Awaiting recruiter review.',
  },
  IN_REVIEW: {
    label: 'In Review',
    badgeClass: 'badge-student',
    description: 'Recruiting committee is reviewing academic credentials and resume.',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badgeClass: 'badge-student',
    description: 'Congratulations! Shortlisted for company assessment and interview rounds.',
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    badgeClass: 'badge-company',
    description: 'Interview round date and slot assigned.',
  },
  SELECTED: {
    label: 'Selected / Offer Extended',
    badgeClass: 'badge-company',
    description: 'Campus offer extended! Contact the TPO office for offer letter verification.',
  },
  REJECTED: {
    label: 'Application Closed',
    badgeClass: 'badge-danger',
    description: 'Application was not advanced further for this drive cycle.',
  },
};

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getApplications();
      setApplications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load your submitted applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  return (
    <div>
      <StudentNav />

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-student">
              <FileText size={13} /> PLACEMENT TRACKER
            </span>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              Read-Only Statuses
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            My Placement Applications ({applications.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track application pipelines, interview schedules, and final placement offers in real time.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.785rem', padding: '6px 12px' }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving submitted application statuses...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <FileText size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            No Applications Found
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 16px' }}>
            {statusFilter === 'ALL'
              ? "You haven't applied to any active campus openings yet."
              : `No applications with status "${statusFilter}".`}
          </p>
          <Link to="/student/jobs" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            Browse Eligible Jobs
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredApps.map((app) => {
            const config = STATUS_CONFIG[app.status] || {
              label: app.status,
              badgeClass: 'badge-neutral',
              description: '',
            };

            return (
              <div key={app.id} className="glass-panel" style={{
                padding: '24px',
                borderLeft: app.status === 'SELECTED' ? '4px solid var(--accent-emerald)' :
                            app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED' ? '4px solid var(--accent-cyan)' :
                            app.status === 'REJECTED' ? '4px solid var(--accent-rose)' : '4px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a5b4fc',
                      fontWeight: 700,
                      fontSize: '1.2rem'
                    }}>
                      {app.company_name ? app.company_name.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.company_name}</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-main)' }}>
                        {app.job_title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${config.badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                      {config.label}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>

                {/* Status Explanation Box */}
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <strong>Status Update:</strong> {config.description}
                  </div>

                  {app.interview_date && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}>
                      <CalendarCheck size={14} />
                      <span>Interview: {new Date(app.interview_date).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Additional student notes or recruiter feedback */}
                {app.notes && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-dim)', marginBottom: '14px', fontStyle: 'italic' }}>
                    Application Note: "{app.notes}"
                  </div>
                )}

                {/* Quick Link to Job */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    to={`/student/jobs/${app.job_id}`}
                    style={{ fontSize: '0.825rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Job Posting <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
