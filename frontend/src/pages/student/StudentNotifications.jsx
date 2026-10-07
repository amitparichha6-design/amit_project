import React, { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';
import StudentNav from '../../components/StudentNav';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Briefcase, 
  Calendar, 
  Award, 
  XCircle, 
  Info,
  CheckCheck,
  Filter
} from 'lucide-react';

const TYPE_ICONS = {
  ELIGIBLE_JOB: { icon: Briefcase, color: 'var(--accent-cyan)' },
  APPLICATION_SUBMITTED: { icon: CheckCircle2, color: 'var(--accent-emerald)' },
  SHORTLISTED: { icon: Award, color: 'var(--accent-amber)' },
  INTERVIEW_SCHEDULED: { icon: Calendar, color: 'var(--accent-cyan)' },
  SELECTED: { icon: Award, color: 'var(--accent-emerald)' },
  REJECTED: { icon: XCircle, color: 'var(--accent-rose)' },
  ANNOUNCEMENT: { icon: Info, color: 'var(--primary)' },
};

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await studentApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      alert(err.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await studentApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      alert(err.message || 'Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div>
      <StudentNav />

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-student">
              <Bell size={13} /> PLACEMENT ALERTS
            </span>
            {unreadCount > 0 ? (
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                {unreadCount} Unread
              </span>
            ) : (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                All Caught Up
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Notifications & Circulars
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Drive announcements, qualification triggers, and pipeline interview alerts.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`btn ${filterUnreadOnly ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.825rem', padding: '8px 14px' }}
          >
            <Filter size={14} />
            <span>{filterUnreadOnly ? 'Showing Unread Only' : 'Show All'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="btn btn-outline"
              style={{ fontSize: '0.825rem', padding: '8px 14px' }}
            >
              <CheckCheck size={14} />
              <span>{actionLoading ? 'Updating...' : 'Mark All as Read'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving your notification inbox...</p>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <Bell size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            No Notifications Found
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
            {filterUnreadOnly
              ? 'You have read all your placement alerts.'
              : 'Your notification inbox is currently clear.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayedNotifications.map((notif) => {
            const typeMeta = TYPE_ICONS[notif.notification_type] || {
              icon: Info,
              color: 'var(--primary)',
            };
            const Icon = typeMeta.icon;

            return (
              <div
                key={notif.id}
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  background: notif.is_read ? 'rgba(15, 23, 42, 0.4)' : 'rgba(99, 102, 241, 0.08)',
                  borderLeft: notif.is_read ? '3px solid transparent' : '3px solid var(--primary)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: typeMeta.color,
                    marginTop: '2px'
                  }}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{
                        fontSize: '0.975rem',
                        fontWeight: notif.is_read ? 600 : 700,
                        color: notif.is_read ? 'var(--text-main)' : '#ffffff',
                        margin: 0
                      }}>
                        {notif.title}
                      </h4>
                      {notif.notification_type && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                          {notif.notification_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 8px' }}>
                      {notif.message}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      <span>{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', flexShrink: 0 }}
                    title="Mark as read"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
