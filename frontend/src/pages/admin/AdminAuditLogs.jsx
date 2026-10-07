import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  ScrollText, 
  Search, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Activity
} from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs(150);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.admin_email.toLowerCase().includes(term) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      l.target_entity.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action) => {
    if (action.includes('APPROVE') || action.includes('ACTIVAT')) {
      return <span className="badge badge-company">{action}</span>;
    }
    if (action.includes('REJECT') || action.includes('DEACTIVAT')) {
      return <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>{action}</span>;
    }
    if (action.includes('VERIFY')) {
      return <span className="badge badge-student">{action}</span>;
    }
    if (action.includes('DRIVE')) {
      return <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>{action}</span>;
    }
    return <span className="badge badge-neutral">{action}</span>;
  };

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Audit Trail & Security Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Permanent tamper-evident SQLite records of all administrator actions: company approvals, academic verifications, and drives.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search action, admin, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Querying SQLite audit log database...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <ScrollText size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <p>No audit log entries found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Admin</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-dim)', fontWeight: 600 }}>Operation Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                      {log.admin_email}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {log.target_entity} {log.target_id ? `(#${log.target_id})` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      {log.details || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
