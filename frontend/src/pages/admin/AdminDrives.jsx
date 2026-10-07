import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  CalendarRange, 
  PlusCircle, 
  Edit3, 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sliders, 
  ListOrdered,
  Layers,
  Sparkles
} from 'lucide-react';

const ALL_BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering"
];

export default function AdminDrives() {
  const [drives, setDrives] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveDate, setDriveDate] = useState('');
  const [venue, setVenue] = useState('');
  const [roundsText, setRoundsText] = useState('Online Assessment, Technical Interview, HR Round');

  // Eligibility Criteria Fields (Stored in SQLite)
  const [minCgpa, setMinCgpa] = useState(7.0);
  const [maxBacklogs, setMaxBacklogs] = useState(0);
  const [selectedBranches, setSelectedBranches] = useState([
    "Computer Science & Engineering",
    "Information Technology"
  ]);
  const [eligibleBatch, setEligibleBatch] = useState(2026);

  useEffect(() => {
    loadDrivesAndCompanies();
  }, []);

  const loadDrivesAndCompanies = async () => {
    try {
      setLoading(true);
      const [drivesData, companiesData] = await Promise.all([
        adminApi.getDrives(),
        adminApi.getCompanies('APPROVED') // Only approved companies!
      ]);
      setDrives(drivesData);
      setApprovedCompanies(companiesData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDriveId(null);
    setCompanyId(approvedCompanies[0]?.id || '');
    setTitle('');
    setDescription('');
    // Default date to next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDriveDate(nextWeek.toISOString().slice(0, 16));
    setVenue('Auditorium Hall B & Computer Labs');
    setRoundsText('Online Assessment, Technical Interview, HR Discussion');
    setMinCgpa(7.0);
    setMaxBacklogs(0);
    setSelectedBranches(["Computer Science & Engineering", "Information Technology"]);
    setEligibleBatch(2026);
    setIsModalOpen(true);
  };

  const openEditModal = (drive) => {
    setEditingDriveId(drive.id);
    setCompanyId(drive.company_id);
    setTitle(drive.title);
    setDescription(drive.description || '');
    setDriveDate(new Date(drive.drive_date).toISOString().slice(0, 16));
    setVenue(drive.venue);
    setRoundsText(drive.selection_rounds ? drive.selection_rounds.join(', ') : '');

    const crit = drive.eligibility_criteria;
    if (crit) {
      setMinCgpa(crit.min_cgpa);
      setMaxBacklogs(crit.max_backlogs);
      setSelectedBranches(crit.eligible_branches || []);
      setEligibleBatch(crit.eligible_batch || 2026);
    } else {
      setMinCgpa(6.5);
      setMaxBacklogs(0);
      setSelectedBranches(["Computer Science & Engineering"]);
      setEligibleBatch(2026);
    }
    setIsModalOpen(true);
  };

  const handleBranchToggle = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const rounds = roundsText
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const drivePayload = {
      company_id: parseInt(companyId, 10),
      title: title.trim(),
      description: description.trim() || undefined,
      drive_date: new Date(driveDate).toISOString(),
      venue: venue.trim(),
      selection_rounds: rounds.length > 0 ? rounds : ["Technical Interview", "HR Round"],
      eligibility: {
        min_cgpa: parseFloat(minCgpa),
        max_backlogs: parseInt(maxBacklogs, 10),
        eligible_branches: selectedBranches,
        eligible_batch: parseInt(eligibleBatch, 10),
      }
    };

    try {
      if (editingDriveId) {
        await adminApi.updateDrive(editingDriveId, drivePayload);
        setSuccessMsg(`Placement drive '${title}' updated successfully.`);
      } else {
        await adminApi.createDrive(drivePayload);
        setSuccessMsg(`New placement drive '${title}' created successfully.`);
      }
      setIsModalOpen(false);
      loadDrivesAndCompanies();
    } catch (err) {
      setError(err.message || 'Failed to save placement drive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (drive) => {
    try {
      await adminApi.toggleDriveStatus(drive.id);
      setSuccessMsg(`Placement drive status updated.`);
      loadDrivesAndCompanies();
    } catch (err) {
      setError(err.message || 'Failed to toggle drive status');
    }
  };

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Placement Drives & Eligibility Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Schedule corporate recruitment drives, configure venues, selection rounds, and define SQLite-backed cutoffs.
          </p>
        </div>

        <button 
          onClick={openCreateModal}
          className="btn btn-primary"
          disabled={approvedCompanies.length === 0}
        >
          <PlusCircle size={18} />
          <span>Create Placement Drive</span>
        </button>
      </div>

      {approvedCompanies.length === 0 && !loading && (
        <div className="alert alert-info">
          <AlertCircle size={18} />
          <span>
            No <strong>APPROVED</strong> companies currently available. Please visit the <strong>Companies</strong> tab and approve at least one corporate recruiter before scheduling drives.
          </span>
        </div>
      )}

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

      {/* Drives List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading placement drives...</p>
        </div>
      ) : drives.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <CalendarRange size={40} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No placement drives created yet.</p>
          <p style={{ fontSize: '0.85rem' }}>Click the "Create Placement Drive" button above to launch your first campus hiring drive.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {drives.map((d) => (
            <div key={d.id} className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="badge badge-company">
                      <Building2 size={12} /> {d.company_name}
                    </span>
                    {d.is_active ? (
                      <span className="badge badge-student"><CheckCircle2 size={12} /> ACTIVE DRIVE</span>
                    ) : (
                      <span className="badge badge-neutral"><XCircle size={12} /> INACTIVE</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{d.title}</h2>
                  {d.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
                      {d.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => openEditModal(d)}
                    className="btn btn-outline"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Drive & Criteria</span>
                  </button>

                  <button 
                    onClick={() => handleToggleStatus(d)}
                    className={`btn ${d.is_active ? 'btn-danger' : 'btn-primary'}`}
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    {d.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Date and Venue */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Date: <strong>{new Date(d.drive_date).toLocaleString()}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <MapPin size={16} style={{ color: 'var(--accent-emerald)' }} />
                  <span>Venue: <strong>{d.venue}</strong></span>
                </div>
              </div>

              {/* Selection Rounds & SQLite Eligibility Rules Grid */}
              <div className="grid-2">
                {/* Selection Rounds */}
                <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ListOrdered size={14} />
                    <span>Selection Rounds</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {d.selection_rounds?.map((round, idx) => (
                      <span key={idx} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600 }}>
                        {idx + 1}. {round}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stored SQLite Eligibility Criteria */}
                <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} />
                    <span>Stored Eligibility Criteria (SQLite)</span>
                  </div>
                  {d.eligibility_criteria ? (
                    <div style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>
                        Minimum CGPA: <strong style={{ color: 'var(--accent-emerald)' }}>{d.eligibility_criteria.min_cgpa}</strong> &bull; Max Backlogs: <strong>{d.eligibility_criteria.max_backlogs}</strong> &bull; Batch: <strong>{d.eligibility_criteria.eligible_batch}</strong>
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '2px' }}>
                        Eligible Branches: {d.eligibility_criteria.eligible_branches?.join(', ')}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Default criteria applied</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Drive Modal */}
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
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                {editingDriveId ? 'Edit Placement Drive & Eligibility' : 'Create New Placement Drive'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ padding: '4px 8px' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Drive Details */}
              <div className="form-group">
                <label className="form-label" htmlFor="drive-company">Recruiting Company (Approved Only) *</label>
                <select
                  id="drive-company"
                  required
                  disabled={!!editingDriveId}
                  className="form-select"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {approvedCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.industry || 'Corporate'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="drive-title">Drive Title *</label>
                <input
                  id="drive-title"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Google Campus Hiring Drive 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="drive-desc">Drive Description</label>
                <textarea
                  id="drive-desc"
                  rows={2}
                  className="form-input"
                  placeholder="Brief description of the hiring event, roles offered, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="drive-date">Drive Date & Time *</label>
                  <input
                    id="drive-date"
                    type="datetime-local"
                    required
                    className="form-input"
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="drive-venue">Venue / Campus Location *</label>
                  <input
                    id="drive-venue"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Auditorium Hall B / Lab 3"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="drive-rounds">Selection Rounds (Comma-separated) *</label>
                <input
                  id="drive-rounds"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Online Test, Technical Interview, HR Round"
                  value={roundsText}
                  onChange={(e) => setRoundsText(e.target.value)}
                />
              </div>

              {/* ELIGIBILITY CRITERIA SECTION (Stored in SQLite) */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
                    Eligibility Criteria Definition (Stored in SQLite)
                  </span>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="crit-cgpa">Minimum CGPA</label>
                    <input
                      id="crit-cgpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="form-input"
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="crit-backlogs">Maximum Backlogs</label>
                    <input
                      id="crit-backlogs"
                      type="number"
                      min="0"
                      className="form-input"
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="crit-batch">Graduation Batch</label>
                    <input
                      id="crit-batch"
                      type="number"
                      min="2020"
                      max="2030"
                      className="form-input"
                      value={eligibleBatch}
                      onChange={(e) => setEligibleBatch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligible Engineering Branches *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(15, 23, 42, 0.4)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                    {ALL_BRANCHES.map((branch) => (
                      <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(branch)}
                          onChange={() => handleBranchToggle(branch)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{branch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving to SQLite...' : editingDriveId ? 'Update Drive & Criteria' : 'Create Placement Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
