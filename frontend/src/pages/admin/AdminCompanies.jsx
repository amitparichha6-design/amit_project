import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  Eye, 
  Search,
  Filter,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export default function AdminCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [companies, setCompanies] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Selected company for detail modal or reject modal
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [rejectingCompany, setRejectingCompany] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, [statusFilter]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCompanies(statusFilter === 'ALL' ? null : statusFilter);
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (company) => {
    if (!window.confirm(`Approve '${company.company_name}' for campus recruitment?`)) return;
    try {
      setSubmitting(true);
      await adminApi.approveOrRejectCompany(company.id, 'APPROVED');
      setActionSuccess(`Company '${company.company_name}' has been successfully APPROVED.`);
      loadCompanies();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingCompany) return;
    try {
      setSubmitting(true);
      await adminApi.approveOrRejectCompany(
        rejectingCompany.id, 
        'REJECTED', 
        rejectionReason || 'Requirements not met'
      );
      setActionSuccess(`Company '${rejectingCompany.company_name}' was REJECTED.`);
      setRejectingCompany(null);
      setRejectionReason('');
      loadCompanies();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.industry && c.industry.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <AdminNav />

      {/* Header and Status Rule Alert */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Company Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Review recruiter registrations, verify corporate credentials, and manage recruitment rights.
            </p>
          </div>
        </div>

        <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Enforced Placement Rule:</strong> Only companies with <strong>APPROVED</strong> status are permitted to create job listings and host placement drives.
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setSearchParams(st === 'ALL' ? {} : { status: st });
              }}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by company name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.875rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Companies Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Building2 size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <p>No companies found matching the selected filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Company Name</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Contact Info</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Industry</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Active Jobs</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.company_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID #{c.id} &bull; Reg: {new Date(c.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div>{c.contact_person || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.contact_email || c.email}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {c.industry || 'Not specified'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {c.approval_status === 'APPROVED' && (
                        <span className="badge badge-company"><CheckCircle size={12} /> APPROVED</span>
                      )}
                      {c.approval_status === 'PENDING' && (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <Clock size={12} /> PENDING
                        </span>
                      )}
                      {c.approval_status === 'REJECTED' && (
                        <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                          <XCircle size={12} /> REJECTED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 600 }}>{c.active_jobs_count}</span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedCompany(c)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {c.approval_status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(c)}
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981' }}
                            title="Approve Company"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                        )}

                        {c.approval_status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setRejectingCompany(c);
                              setRejectionReason('');
                            }}
                            disabled={submitting}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            title="Reject Company"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{selectedCompany.company_name}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Registered Account Details</span>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="btn btn-outline" 
                style={{ padding: '4px 8px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Approval Status</span>
                <span style={{ fontWeight: 700 }}>{selectedCompany.approval_status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Recruiter Email</span>
                <span>{selectedCompany.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Contact Person</span>
                <span>{selectedCompany.contact_person || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Industry</span>
                <span>{selectedCompany.industry || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Website</span>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedCompany.website} <ExternalLink size={12} />
                    </a>
                  ) : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Contact Phone</span>
                <span>{selectedCompany.phone || 'N/A'}</span>
              </div>
              {selectedCompany.rejection_reason && (
                <div style={{ padding: '8px 12px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: '6px' }}>
                  <strong>Rejection Reason:</strong> {selectedCompany.rejection_reason}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedCompany(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingCompany && (
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Reject Company Registration
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Specify the reason for rejecting <strong>{rejectingCompany.company_name}</strong>.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reject-reason">Rejection Reason</label>
                <textarea
                  id="reject-reason"
                  required
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Unverified business email, invalid website domain, or missing corporate credentials"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setRejectingCompany(null)} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="btn btn-danger"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
