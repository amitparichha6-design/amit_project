import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  ArrowLeft, 
  Send,
  Layers,
  FileCheck,
  CheckCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export default function StudentJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getJobDetail(id);
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setApplyError(null);
      await studentApi.applyJob(job.id, applyNotes);
      setApplySuccess(true);
      await loadJob();
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div>
        <StudentNav />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading opening & verifying live eligibility...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div>
        <StudentNav />
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: 'var(--accent-rose)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Unable to load job</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error || 'Opening not found.'}</p>
          <Link to="/student/jobs" className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Openings
          </Link>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = job.application_deadline && new Date(job.application_deadline) < new Date();
  const isEligible = Boolean(job.is_eligible);
  const isVerified = job.is_verified !== undefined ? Boolean(job.is_verified) : true;
  const hasApplied = Boolean(job.has_applied);
  const canApply = (job.can_apply !== undefined ? Boolean(job.can_apply) : (isEligible && isVerified)) && !isDeadlinePassed && !hasApplied;

  return (
    <div>
      <StudentNav />

      {/* Back Link */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/student/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Jobs Listing
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
            fontWeight: 800,
            fontSize: '1.5rem'
          }}>
            {job.company_name ? job.company_name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge badge-company">{job.company_name}</span>
              {job.job_type && <span className="badge badge-neutral">{job.job_type}</span>}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {job.title}
            </h1>
          </div>
        </div>

        <div>
          {job.has_applied ? (
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '8px 16px', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} /> ALREADY APPLIED
            </span>
          ) : job.is_eligible ? (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} /> ELIGIBLE CANDIDATE
            </span>
          ) : (
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', fontSize: '0.9rem' }}>
              <XCircle size={16} /> NOT ELIGIBLE
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Details + Application Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Job Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Facts */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Overview & Compensation</h2>
            <div className="grid-3" style={{ gap: '16px' }}>
              <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Package / CTC</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#22d3ee' }}>
                  {job.salary_package || job.salary_range || 'Competitive'}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Job Location</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                  {job.job_location || job.location || (job.venue ? `Campus (${job.venue})` : 'Pan-India')}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Application Deadline</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: isDeadlinePassed ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                  {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Open'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>Job Description</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {job.description || 'No detailed job description provided.'}
            </div>
          </div>

          {/* Required Skills */}
          {Boolean(job.required_skills && (Array.isArray(job.required_skills) ? job.required_skills.length > 0 : job.required_skills.length > 0)) && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>Required Technical Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(Array.isArray(job.required_skills)
                  ? job.required_skills
                  : job.required_skills.split(',')
                ).map((skill, i) => (
                  <span key={i} style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}>
                    {typeof skill === 'string' ? skill.trim() : skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Placement Drive & Selection Rounds */}
          {(job.drive || job.drive_title) && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--accent-emerald)' }} />
                Placement Drive Details & Selection Rounds
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Drive Name</span>
                  <span style={{ fontWeight: 600 }}>{job.drive?.title || job.drive_title}</span>
                </div>
                {(job.drive?.drive_date || job.drive_date) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Drive Date & Venue</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(job.drive?.drive_date || job.drive_date).toLocaleDateString()} {(job.drive?.venue || job.venue) ? `• ${job.drive?.venue || job.venue}` : ''}
                    </span>
                  </div>
                )}

                {(job.drive?.selection_rounds || job.selection_rounds) && (job.drive?.selection_rounds || job.selection_rounds).length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>Selection Rounds:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(job.drive?.selection_rounds || job.selection_rounds).map((round, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem'
                        }}>
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {idx + 1}
                          </span>
                          <span>{round}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Eligibility Inspection & Apply Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Eligibility Criteria Breakdown */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-cyan)' }} />
              Eligibility Criteria
            </h2>

            {job.eligibility_criteria ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Min CGPA Required</span>
                  <span style={{ fontWeight: 700 }}>{job.eligibility_criteria.min_cgpa}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Max Backlogs Allowed</span>
                  <span style={{ fontWeight: 700 }}>{job.eligibility_criteria.max_backlogs}</span>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>Eligible Branches</div>
                  <div style={{ fontWeight: 600 }}>
                    {Array.isArray(job.eligibility_criteria.eligible_branches)
                      ? job.eligibility_criteria.eligible_branches.join(', ')
                      : (job.eligibility_criteria.eligible_branches || 'All Branches')}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Eligible Batch</span>
                  <span style={{ fontWeight: 700 }}>{job.eligibility_criteria.eligible_batch || 'All'}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No explicit criteria restriction set by admin.</p>
            )}

            {/* Ineligibility Reasons Alert */}
            {!job.is_eligible && (job.ineligibility_reasons || job.eligibility_reasons) && (job.ineligibility_reasons || job.eligibility_reasons).length > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: '#f87171'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>Criteria Not Met:</div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {(job.ineligibility_reasons || job.eligibility_reasons).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Application Submission Box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} style={{ color: 'var(--primary)' }} />
              Submit Application
            </h2>

            {applySuccess ? (
              <div style={{
                padding: '20px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={36} style={{ color: '#34d399', margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: '#ffffff' }}>
                  Application Submitted!
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Your verified profile and resume have been securely forwarded to the recruitment portal.
                </p>
                <Link to="/student/applications" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}>
                  Track in My Applications
                </Link>
              </div>
            ) : job.has_applied ? (
              <div style={{
                padding: '16px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <CheckCircle size={28} style={{ color: '#a5b4fc', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Already Applied</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Duplicate applications are prevented by system policy.
                </p>
                <Link to="/student/applications" className="btn btn-outline" style={{ width: '100%', fontSize: '0.825rem', padding: '6px' }}>
                  View Application Status
                </Link>
              </div>
            ) : (
              <div>
                {/* Pre-flight Checks checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isEligible ? '#34d399' : '#f87171' }}>
                    {isEligible ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>Eligibility Criteria {isEligible ? 'Passed' : 'Not Met'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isVerified ? '#34d399' : '#f87171' }}>
                    {isVerified ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>Academic Profile {isVerified ? 'TPO Verified' : 'Pending TPO Verification'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !isDeadlinePassed ? '#34d399' : '#f87171' }}>
                    {!isDeadlinePassed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>Application Deadline {!isDeadlinePassed ? 'Active' : 'Expired'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !hasApplied ? '#34d399' : '#a5b4fc' }}>
                    {!hasApplied ? <CheckCircle2 size={14} /> : <CheckCircle size={14} />}
                    <span>{hasApplied ? 'Already Applied' : 'No Prior Application'}</span>
                  </div>
                </div>

                {applyError && (
                  <div className="alert alert-error" style={{ padding: '10px 12px', fontSize: '0.8rem', marginBottom: '14px' }}>
                    <ShieldAlert size={16} />
                    <span>{applyError}</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Cover Note / Additional Remarks (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    value={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.value)}
                    placeholder="Briefly state your passion or specialized skills relevant to this opening..."
                    disabled={!canApply}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!canApply || applying}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    opacity: canApply ? 1 : 0.5,
                    cursor: canApply ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send size={15} />
                  <span>{applying ? 'Submitting Application...' : 'Apply for Opening'}</span>
                </button>

                {!canApply && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px' }}>
                    {!isEligible
                      ? 'Application locked: You do not meet the criteria requirements.'
                      : !isVerified
                      ? 'Application locked: TPO academic verification required.'
                      : isDeadlinePassed
                      ? 'Application locked: The deadline for this drive has passed.'
                      : hasApplied
                      ? 'Application submitted: Duplicate applications are prevented.'
                      : 'Application locked: Eligibility or verification pending.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
