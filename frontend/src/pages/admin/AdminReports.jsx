import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  BarChart3, 
  Award, 
  Building2, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  PieChart, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getReports();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load placement reports');
    } finally {
      setLoading(false);
    }
  };

  const exportReportJson = () => {
    if (!reports) return;
    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campushire_placement_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Compiling placement analytics & student outcomes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Campus Placement Reports & Outcomes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Comprehensive institutional analytics: Placed students, company-wise hires, branch distribution, and application funnels.
          </p>
        </div>

        <button onClick={exportReportJson} className="btn btn-outline">
          <Download size={16} />
          <span>Export Analytics JSON</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Registered Cohort
          </span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '4px' }}>{reports?.total_students ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Eligible graduating students</div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Successfully Placed Students
          </span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {reports?.total_placed ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            Offer letters confirmed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Overall Placement Rate
          </span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {reports?.placement_rate ?? 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Institutional benchmark</div>
        </div>
      </div>

      {/* Section 1: Placed Students List */}
      <div className="glass-panel" style={{ padding: '26px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} style={{ color: 'var(--accent-emerald)' }} />
          Placed Students Registry
        </h2>

        {reports?.placed_students?.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No placed students recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Student</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Roll #</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Branch</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>CGPA</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Placed Company</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Package Offered</th>
                </tr>
              </thead>
              <tbody>
                {reports.placed_students.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{st.full_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{st.roll_number}</td>
                    <td style={{ padding: '12px 16px' }}>{st.department}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>{st.cgpa}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{st.company_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>{st.package}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Company-wise & Branch-wise Placement */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Company-wise */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--accent-cyan)' }} />
            Company-Wise Recruitment
          </h2>
          {reports?.company_wise_placements?.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No company placements recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reports.company_wise_placements.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600 }}>{c.company_name}</span>
                  <span className="badge badge-company" style={{ fontSize: '0.8rem' }}>
                    {c.count} Hired
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branch-wise */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
            Branch-Wise Placement Progress
          </h2>
          {reports?.branch_wise_placements?.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No department statistics recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.branch_wise_placements.map((b, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600 }}>{b.department}</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {b.placed} / {b.total} ({b.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, b.percentage)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Applications & Selected vs Rejected */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-emerald)' }} />
            Application Pipeline Funnel
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total Applications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{reports?.application_stats?.total ?? 0}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Shortlisted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{reports?.application_stats?.shortlisted ?? 0}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Selected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{reports?.application_stats?.selected ?? 0}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Rejected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{reports?.application_stats?.rejected ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} style={{ color: '#c084fc' }} />
            Outcome Comparison
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                <CheckCircle2 size={16} />
                <span>Selected Candidates</span>
              </div>
              <strong style={{ color: '#34d399' }}>{reports?.selected_vs_rejected?.selected ?? 0}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(244,63,94,0.1)', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
                <XCircle size={16} />
                <span>Rejected Applications</span>
              </div>
              <strong style={{ color: '#f43f5e' }}>{reports?.selected_vs_rejected?.rejected ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
