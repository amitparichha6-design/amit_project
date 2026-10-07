import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../services/api';
import StudentNav from '../../components/StudentNav';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Filter, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function StudentJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJobs();
  }, [filterEligibleOnly]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getJobs(filterEligibleOnly);
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch job opportunities');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const skillsText = Array.isArray(j.required_skills)
      ? j.required_skills.join(' ').toLowerCase()
      : (j.required_skills || '').toLowerCase();
    const locText = (j.job_location || j.location || '').toLowerCase();
    const salaryText = (j.salary_package || j.salary_range || '').toLowerCase();
    const driveText = (j.drive_title || j.drive?.title || '').toLowerCase();
    return (
      j.title.toLowerCase().includes(query) ||
      j.company_name.toLowerCase().includes(query) ||
      locText.includes(query) ||
      skillsText.includes(query) ||
      salaryText.includes(query) ||
      driveText.includes(query)
    );
  });

  return (
    <div>
      <StudentNav />

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-student">
              <Sparkles size={13} /> ELIGIBILITY ENGINE
            </span>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Real-time Database Criteria
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Campus Placement Drives & Openings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live job postings vetted by the TPO with instant criteria evaluation.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
            className={`btn ${filterEligibleOnly ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            <Filter size={15} />
            <span>{filterEligibleOnly ? 'Showing Eligible Only' : 'Show All Drives'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} style={{ color: 'var(--text-dim)' }} />
        <input
          type="text"
          placeholder="Search by job title, company name, skills, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '0.9rem'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Jobs Listing */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Evaluating eligibility criteria against database...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <Briefcase size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            No Matching Drives Found
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 16px' }}>
            {filterEligibleOnly
              ? 'There are currently no active openings matching your branch, batch, and CGPA criteria. Try viewing all drives or updating your profile.'
              : 'No campus jobs found matching your search filters.'}
          </p>
          {filterEligibleOnly && (
            <button onClick={() => setFilterEligibleOnly(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
              View All Campus Drives
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredJobs.map((job) => {
            const isDeadlinePassed = job.application_deadline && new Date(job.application_deadline) < new Date();

            return (
              <div key={job.id} className="glass-panel" style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: job.is_eligible ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}>
                <div>
                  {/* Top Company & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a5b4fc',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}>
                        {job.company_name ? job.company_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.company_name}</div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                          {job.title}
                        </h3>
                        {(job.drive_title || job.drive?.title) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} />
                            <span>{job.drive_title || job.drive?.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {job.has_applied ? (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                        <CheckCircle2 size={12} /> APPLIED
                      </span>
                    ) : job.is_eligible ? (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <CheckCircle2 size={12} /> ELIGIBLE
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <XCircle size={12} /> NOT ELIGIBLE
                      </span>
                    )}
                  </div>

                  {/* CTC and Location */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '14px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22d3ee', fontWeight: 600 }}>
                      <IndianRupee size={15} />
                      <span>{job.salary_package || job.salary_range || 'Competitive'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <MapPin size={15} />
                      <span>{job.job_location || job.location || (job.venue ? `Campus (${job.venue})` : 'On-Campus / Hybrid')}</span>
                    </div>
                  </div>

                  {/* Description snippet */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-dim)',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {job.description || 'Full-time campus placement opening.'}
                  </p>

                  {/* Required Skills */}
                  {Boolean(job.required_skills && (Array.isArray(job.required_skills) ? job.required_skills.length > 0 : job.required_skills.length > 0)) && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Required Skills:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(Array.isArray(job.required_skills)
                          ? job.required_skills
                          : job.required_skills.split(',')
                        ).map((skill, i) => (
                          <span key={i} style={{
                            fontSize: '0.725rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {typeof skill === 'string' ? skill.trim() : skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eligibility criteria summary */}
                  {job.eligibility_criteria && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '14px',
                      fontSize: '0.785rem'
                    }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>Criteria:</strong> Min CGPA: {job.eligibility_criteria.min_cgpa} • Max Backlogs: {job.eligibility_criteria.max_backlogs}
                      </div>
                      <div style={{ color: 'var(--text-dim)' }}>
                        Branches: {Array.isArray(job.eligibility_criteria.eligible_branches) ? job.eligibility_criteria.eligible_branches.join(', ') : (job.eligibility_criteria.eligible_branches || 'All')} • Batch: {job.eligibility_criteria.eligible_batch || 'All'}
                      </div>
                    </div>
                  )}

                  {/* Ineligibility Reasons if not eligible */}
                  {!job.is_eligible && (job.ineligibility_reasons || job.eligibility_reasons) && (job.ineligibility_reasons || job.eligibility_reasons).length > 0 && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '14px',
                      fontSize: '0.775rem',
                      color: '#f87171'
                    }}>
                      <strong>Reason for Ineligibility:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {(job.ineligibility_reasons || job.eligibility_reasons).map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Info & Action */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>
                        Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Rolling'}
                      </span>
                    </div>
                    {isDeadlinePassed && (
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Expired</span>
                    )}
                  </div>

                  <Link
                    to={`/student/jobs/${job.id}`}
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <span>View Details & Apply</span>
                    <ArrowRight size={14} />
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
