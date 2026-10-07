import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Eye, 
  ShieldCheck, 
  AlertCircle,
  Award,
  BookOpen,
  UserCheck,
  Edit3
} from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(true);
  const [backlogsInput, setBacklogsInput] = useState(0);
  const [cgpaInput, setCgpaInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [departmentFilter, verifiedFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStudents({
        department: departmentFilter || undefined,
        is_verified: verifiedFilter === '' ? undefined : verifiedFilter,
        search: searchQuery || undefined,
      });
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const openVerifyModal = (student) => {
    setEditingStudent(student);
    setVerifyStatus(!student.is_verified);
    setBacklogsInput(student.backlogs || 0);
    setCgpaInput(student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : '');
  };

  const handleVerificationSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setSaving(true);
      await adminApi.verifyStudent(
        editingStudent.id,
        verifyStatus,
        parseInt(backlogsInput, 10) || 0,
        cgpaInput ? parseFloat(cgpaInput) : null
      );
      setSuccessMsg(
        verifyStatus 
          ? `Verified academic profile for ${editingStudent.full_name}.`
          : `Revoked verification for ${editingStudent.full_name}.`
      );
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      setError(err.message || 'Failed to update student academic status');
    } finally {
      setSaving(false);
    }
  };

  const viewStudentDetails = async (student) => {
    try {
      const details = await adminApi.getStudentDetails(student.id);
      setSelectedStudent(details);
    } catch (err) {
      setError('Could not fetch student details');
    }
  };

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Student Academic Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
          Inspect academic records, verify CGPA cutoffs, backlogs, and manage placement eligibility.
        </p>
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

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <select
            className="form-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '180px', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
          </select>

          {/* Verification Filter */}
          <select
            className="form-select"
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search student or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </form>
      </div>

      {/* Students Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <GraduationCap size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <p>No student profiles found matching criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Student Name & Roll</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>CGPA & Backlogs</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Academic Verification</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Placement Status</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.roll_number || 'No Roll #'} &bull; {s.email}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div>{s.department || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Batch {s.graduation_year || '2026'}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {s.cgpa !== null && s.cgpa !== undefined ? Number(s.cgpa).toFixed(2) : 'N/A'} CGPA
                      </div>
                      <div style={{ fontSize: '0.75rem', color: s.backlogs > 0 ? '#f43f5e' : 'var(--text-dim)' }}>
                        {s.backlogs} Backlog(s)
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {s.is_verified ? (
                        <span className="badge badge-company">
                          <CheckCircle2 size={12} /> VERIFIED
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <XCircle size={12} /> UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {s.is_placed ? (
                        <div>
                          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                            <Award size={12} /> PLACED
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {s.placed_company_name} ({s.placed_package || 'Selected'})
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>In Process ({s.applications_count} apps)</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => viewStudentDetails(s)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="View Profile & Applications"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openVerifyModal(s)}
                          className={`btn ${s.is_verified ? 'btn-outline' : 'btn-primary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Edit3 size={14} />
                          <span>{s.is_verified ? 'Update Status' : 'Verify Profile'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify / Update Academic Profile Modal */}
      {editingStudent && (
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
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Academic Verification Desk
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Student: <strong>{editingStudent.full_name}</strong> ({editingStudent.roll_number})
            </p>

            <form onSubmit={handleVerificationSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="verify-status">Verification Decision</label>
                <select
                  id="verify-status"
                  className="form-select"
                  value={verifyStatus ? 'true' : 'false'}
                  onChange={(e) => setVerifyStatus(e.target.value === 'true')}
                >
                  <option value="true">VERIFIED (Eligible for placement drives)</option>
                  <option value="false">UNVERIFIED (Requires revision / not certified)</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-cgpa">Official CGPA (0 - 10)</label>
                  <input
                    id="edit-cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-input"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value)}
                    placeholder="8.50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-backlogs">Active Backlogs</label>
                  <input
                    id="edit-backlogs"
                    type="number"
                    min="0"
                    className="form-input"
                    value={backlogsInput}
                    onChange={(e) => setBacklogsInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditingStudent(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving to SQLite...' : 'Save Academic Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details & Applications Modal */}
      {selectedStudent && (
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
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{selectedStudent.full_name}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Roll: {selectedStudent.roll_number} &bull; {selectedStudent.email}</span>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-outline" style={{ padding: '4px 8px' }}>
                &times;
              </button>
            </div>

            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>CGPA</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedStudent.cgpa || 'N/A'}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Backlogs</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedStudent.backlogs}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Verified</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedStudent.is_verified ? 'var(--accent-emerald)' : '#fbbf24' }}>
                  {selectedStudent.is_verified ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Job Application History</h3>
            {selectedStudent.applications?.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No job applications submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedStudent.applications.map((app) => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{app.job_title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{app.company_name}</div>
                    </div>
                    <span className="badge badge-neutral">{app.status}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
