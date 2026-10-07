import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Clock, 
  Megaphone,
  Radio
} from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await adminApi.createNotification({
        title: title.trim(),
        message: message.trim(),
        target_audience: targetAudience,
      });
      setSuccessMsg(`Announcement '${title}' broadcasted successfully.`);
      setTitle('');
      setMessage('');
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to broadcast announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminNav />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Campus Announcements & Alerts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
          Publish official TPO notices, schedule updates, and circulars directly to students and recruiters.
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

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Create Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: 'var(--accent-cyan)' }} />
            Broadcast New Notice
          </h2>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="note-title">Notice Title *</label>
              <input
                id="note-title"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Mandatory Pre-Placement Talk by Google"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note-audience">Target Audience</label>
              <select
                id="note-audience"
                className="form-select"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              >
                <option value="ALL">All Campus Users (Students & Companies)</option>
                <option value="STUDENT">Students Only</option>
                <option value="COMPANY">Companies & Recruiters Only</option>
                <option value="CSE/IT">Computer Science & IT Branches</option>
                <option value="ECE">Electronics Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note-message">Announcement Message *</label>
              <textarea
                id="note-message"
                required
                rows={5}
                className="form-input"
                placeholder="Write the detailed circular message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '10px' }}
            >
              {submitting ? 'Broadcasting...' : (
                <>
                  <Send size={16} />
                  <span>Broadcast Announcement</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Notices Feed */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={18} style={{ color: 'var(--primary)' }} />
            Published Circulars Feed
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading notices...</p>
            </div>
          ) : notifications.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No announcements published yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '550px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{n.title}</h3>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {n.target_audience}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-line', marginBottom: '10px' }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>By: {n.created_by_name || 'TPO Office'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
