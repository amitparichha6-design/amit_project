import React, { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';
import StudentNav from '../../components/StudentNav';
import { 
  User, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Link2, 
  Award, 
  Code, 
  BookOpen,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    roll_number: '',
    department: '',
    graduation_year: '',
    cgpa: '',
    percentage: '',
    backlogs: 0,
    skills: '',
    projects: '',
    certifications: '',
    github_url: '',
    linkedin_url: '',
    bio: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploadError, setResumeUploadError] = useState(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        roll_number: data.roll_number || '',
        department: data.department || '',
        graduation_year: data.graduation_year ? String(data.graduation_year) : '',
        cgpa: data.cgpa !== null && data.cgpa !== undefined ? String(data.cgpa) : '',
        percentage: data.percentage !== null && data.percentage !== undefined ? String(data.percentage) : '',
        backlogs: data.backlogs !== null && data.backlogs !== undefined ? data.backlogs : 0,
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''),
        projects: Array.isArray(data.projects) ? data.projects.map(p => typeof p === 'string' ? p : (p?.title || p?.name || '')).filter(Boolean).join('\n') : (data.projects || ''),
        certifications: Array.isArray(data.certifications) ? data.certifications.map(c => typeof c === 'string' ? c : (c?.name || c?.title || '')).filter(Boolean).join('\n') : (data.certifications || ''),
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        bio: data.bio || '',
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        roll_number: formData.roll_number.trim() || null,
        department: formData.department.trim() || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        percentage: formData.percentage ? parseFloat(formData.percentage) : null,
        backlogs: parseInt(formData.backlogs, 10) || 0,
        skills: formData.skills.trim() || null,
        projects: formData.projects.trim() || null,
        certifications: formData.certifications.trim() || null,
        github_url: formData.github_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        bio: formData.bio.trim() || null,
      };

      const updated = await studentApi.updateProfile(payload);
      setProfile(updated);
      setMessage('Profile updated successfully! Academic metrics updated for Eligibility Engine.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setResumeUploadError(null);
    setResumeUploadSuccess(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setResumeUploadError('Only PDF files are permitted for resume upload.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setResumeUploadError('Resume size cannot exceed 8 MB.');
      return;
    }

    setResumeFile(file);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeUploadError('Please select a PDF file first.');
      return;
    }

    try {
      setUploadingResume(true);
      setResumeUploadError(null);
      const res = await studentApi.uploadResume(resumeFile);
      setResumeUploadSuccess('Resume PDF securely uploaded and linked to placement profile!');
      setResumeFile(null);
      // Reload profile to reflect new resume URL and completion %
      await loadProfile();
    } catch (err) {
      setResumeUploadError(err.message || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const blob = await studentApi.downloadResumeBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile?.full_name?.replace(/\s+/g, '_') || 'Student'}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert(err.message || 'Error downloading resume.');
    }
  };

  if (loading) {
    return (
      <div>
        <StudentNav />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading student profile and credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StudentNav />

      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Academic Profile & Portfolio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Maintain accurate academic and skill records. Data directly controls your Eligibility Engine status.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {profile?.is_verified ? (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} /> TPO Verified Student
            </span>
          ) : (
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> Verification Pending
            </span>
          )}
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}>
            {profile?.profile_completion || 0}% Complete
          </span>
        </div>
      </div>

      {message && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Main Profile Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <form onSubmit={handleProfileSubmit}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              Personal & Academic Details
            </h2>

            <div className="grid-2" style={{ marginBottom: '16px' }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-input"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div>
                <label className="form-label">Registration / Roll No. *</label>
                <input
                  type="text"
                  name="roll_number"
                  className="form-input"
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  placeholder="e.g. 22BCE1045"
                />
              </div>

              <div>
                <label className="form-label">Branch / Department *</label>
                <select
                  name="department"
                  className="form-input"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  <option value="Civil Engineering">Civil Engineering (CE)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Batch (Graduation Year) *</label>
                <input
                  type="number"
                  name="graduation_year"
                  className="form-input"
                  value={formData.graduation_year}
                  onChange={handleInputChange}
                  placeholder="e.g. 2026"
                  min="2020"
                  max="2035"
                />
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Cumulative CGPA (0 - 10) *</label>
                <input
                  type="number"
                  name="cgpa"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-input"
                  value={formData.cgpa}
                  onChange={handleInputChange}
                  placeholder="e.g. 8.45"
                />
              </div>

              <div>
                <label className="form-label">Percentage (%)</label>
                <input
                  type="number"
                  name="percentage"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  placeholder="e.g. 82.5"
                />
              </div>

              <div>
                <label className="form-label">Active Backlogs</label>
                <input
                  type="number"
                  name="backlogs"
                  min="0"
                  max="20"
                  className="form-input"
                  value={formData.backlogs}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '28px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} style={{ color: 'var(--accent-cyan)' }} />
              Skills & Portfolio Highlights
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Technical Skills (Comma separated)</label>
              <input
                type="text"
                name="skills"
                className="form-input"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Python, React, FastAPI, SQL, Docker, Machine Learning, Git"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Used by recruiters to match candidates for specialized job roles.
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Projects & Key Work</label>
              <textarea
                name="projects"
                rows="3"
                className="form-input"
                value={formData.projects}
                onChange={handleInputChange}
                placeholder="1. CampusHire: Full stack placement portal using FastAPI & React&#10;2. CloudSync: Automated distributed backup service in Go"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Certifications & Honors</label>
              <textarea
                name="certifications"
                rows="2"
                className="form-input"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="AWS Certified Cloud Practitioner, Oracle Java SE 11 Developer"
              />
            </div>

            <div className="grid-2" style={{ marginBottom: '24px' }}>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} /> GitHub Profile URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  className="form-input"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link2 size={15} /> LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  className="form-input"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Bio / Career Objective</label>
              <textarea
                name="bio"
                rows="2"
                className="form-input"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Aspiring Software Engineer passionate about backend scalability and distributed systems."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {saving ? 'Saving Profile Changes...' : 'Save & Update Profile'}
            </button>
          </form>
        </div>

        {/* Sidebar: Resume PDF Upload & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resume Upload Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--accent-emerald)' }} />
              Placement Resume (PDF)
            </h2>

            {profile?.resume_url ? (
              <div style={{
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FileCheck size={24} style={{ color: '#34d399' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>Active Resume Uploaded</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Validated & Stored in Server Locker</div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadResume}
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.825rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Download / View Uploaded PDF</span>
                </button>
              </div>
            ) : (
              <div style={{
                padding: '14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px dashed rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <AlertCircle size={22} style={{ color: '#f87171', margin: '0 auto 6px' }} />
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  No resume uploaded. Required for campus drive applications.
                </p>
              </div>
            )}

            {/* Upload form */}
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Upload New Resume (PDF only, max 8MB)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem'
                }}
              />
            </div>

            {resumeUploadError && (
              <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: '12px' }}>
                <span>{resumeUploadError}</span>
              </div>
            )}

            {resumeUploadSuccess && (
              <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: '12px' }}>
                <span>{resumeUploadSuccess}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleResumeUpload}
              disabled={!resumeFile || uploadingResume}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.875rem' }}
            >
              <Upload size={15} />
              <span>{uploadingResume ? 'Uploading & Validating...' : 'Upload PDF'}</span>
            </button>
          </div>

          {/* Academic Verification Notice */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: 'var(--accent-amber)' }} />
              Eligibility Engine Notice
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '10px' }}>
              Whenever you update your CGPA, Branch, Batch, or Backlogs, the Eligibility Engine automatically updates your eligibility across all campus placement drives.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              Note: Falsified academic information will be rejected by the TPO during pre-drive document verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
