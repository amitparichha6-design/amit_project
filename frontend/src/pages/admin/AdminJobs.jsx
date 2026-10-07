import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  Search 
} from 'lucide-react';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create Job Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roleCategory, setRoleCategory] = useState('Software Engineering');
  const [salaryPackage, setSalaryPackage] = useState('');
  const [jobLocation, setJobLocation] = useState('Bengaluru / Hybrid');
  const [jobType, setJobType] = useState('Full-Time');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJobsAndCompanies();
  }, []);

  const loadJobsAndCompanies = async () => {
    try {
      setLoading(true);
      const [jobsData, companiesData] = await Promise.all([
        adminApi.getJobs(),
        adminApi.getCompanies('APPROVED')
      ]);
      setJobs(jobsData);
      setApprovedCompanies(companiesData);
      if (companiesData.length > 0 && !companyId) {
        setCompanyId(companiesData[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await adminApi.toggleJobStatus(job.id);
      setSuccessMsg(`Status of job '${job.title}' updated.`);
      loadJobsAndCompanies();
    } catch (err) {
      setError(err.message || 'Failed to toggle job status');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!companyId) {
      setError('Please select an approved company.');
      return;
    }
    try {
      setSubmitting(true);
      await adminApi.createJob({
        company_id: parseInt(companyId, 10),
        title: title.trim(),
        description: description.trim() || undefined,
        role_category: roleCategory.trim() || undefined,
        salary_package: salaryPackage.trim() || undefined,
        job_location: jobLocation.trim() || undefined,
        job_type: jobType,
        is_active: true,
      });
      setSuccessMsg(`Job posting '${title}' created successfully.`);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setSalaryPackage('');
      loadJobsAndCompanies();
    } catch (err) {
      setError(err.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Corporate Job Openings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Monitor corporate job roles, salary offerings (CTC), and control listing status.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          disabled={approvedCompanies.length === 0}
        >
          <PlusCircle size={18} />
          <span>Post New Job</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading corporate jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Briefcase size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No jobs listed yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-company">
                    <Building2 size={12} /> {job.company_name}
                  </span>
                  {job.is_active ? (
                    <span className="badge badge-student">ACTIVE</span>
                  ) : (
                    <span className="badge badge-neutral">INACTIVE</span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{job.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
                  {job.role_category || 'General Role'} &bull; {job.job_type}
                </div>

                {job.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} style={{ color: 'var(--accent-emerald)' }} />
                    <span>Package: <strong style={{ color: 'var(--text-main)' }}>{job.salary_package || 'Disclosed upon interview'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} />
                    <span>Location: {job.job_location || 'Not specified'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} />
                    <span>Applicants: <strong>{job.applications_count} students</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Posted: {new Date(job.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleToggleActive(job)}
                  className={`btn ${job.is_active ? 'btn-danger' : 'btn-primary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  {job.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Post Corporate Job Listing</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ padding: '4px 8px' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label" htmlFor="job-company">Approved Company *</label>
                <select
                  id="job-company"
                  required
                  className="form-select"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {approvedCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="job-title">Job Title *</label>
                <input
                  id="job-title"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. SDE-1 Full Stack Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="job-package">Salary Package (CTC)</label>
                  <input
                    id="job-package"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 14.5 LPA"
                    value={salaryPackage}
                    onChange={(e) => setSalaryPackage(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="job-type">Job Type</label>
                  <select
                    id="job-type"
                    className="form-select"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="job-loc">Location</label>
                <input
                  id="job-loc"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bengaluru / Remote"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="job-desc">Job Description</label>
                <textarea
                  id="job-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Core requirements, stack, and responsibilities"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Post Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
