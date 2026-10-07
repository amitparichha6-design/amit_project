import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { 
  Briefcase, 
  Building2, 
  Users, 
  PlusCircle, 
  Globe, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getCompanyDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load Company Dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const profile = user?.company_profile || data?.user?.company_profile;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Retrieving recruiter workspace...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-company"><Briefcase size={14} /> RECRUITER PORTAL</span>
            <span className="badge badge-neutral">Phase 1 Foundation</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {data?.message || `Welcome, ${profile?.company_name || user?.email}!`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {profile?.industry ? `${profile.industry} • ` : ''}
            Partner Recruiter Organization • Verified SQLite Account
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
            <Sparkles size={16} />
            <span>Recruiter Portal Active</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Recruiter Metrics */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Job Postings
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Job posting module unlocks in Phase 2
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Applicant Resumes
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Candidates applied
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Interviews Scheduled
            </span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scheduled interview sessions
          </div>
        </div>
      </div>

      {/* Company Profile Details & Placeholders */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} style={{ color: 'var(--accent-emerald)' }} />
            Recruiter Organization Profile
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Company Name</span>
              <span style={{ fontWeight: 600 }}>{profile?.company_name || 'Not provided'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Industry</span>
              <span style={{ fontWeight: 600 }}>{profile?.industry || 'Not provided'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Official Website</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {profile?.website ? (
                  <a href={profile.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                    {profile.website}
                  </a>
                ) : 'Not provided'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Point of Contact</span>
              <span style={{ fontWeight: 600 }}>{profile?.contact_person || 'Not provided'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Contact Email</span>
              <span style={{ fontWeight: 600 }}>{profile?.contact_email || user?.email}</span>
            </div>
          </div>
        </div>

        {/* Phase 2 Company Placeholders */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} style={{ color: 'var(--primary)' }} />
            Recruiter Operations (Placeholders)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Post Job Profile & Eligibility Criteria</strong>
                <span className="badge badge-neutral">Phase 2</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Define designation, salary packages, eligibility cutoffs, and required tech skills.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Candidate Shortlisting & Resume Review</strong>
                <span className="badge badge-neutral">Phase 2</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Filter applicant resumes, view academic performance, and export student lists.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Interview Management & Results Dispatch</strong>
                <span className="badge badge-neutral">Phase 3</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Submit round scores, finalize selections, and issue digital offer confirmations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
