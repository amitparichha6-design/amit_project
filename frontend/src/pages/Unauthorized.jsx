import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'STUDENT') return '/student';
    if (user.role === 'COMPANY') return '/company';
    return '/login';
  };

  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px 32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f43f5e',
          marginBottom: '20px'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
          403 Access Forbidden
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '24px' }}>
          You do not have the required role privileges to access this dashboard section.
          {user && (
            <span style={{ display: 'block', marginTop: '6px' }}>
              Current Role: <strong>{user.role}</strong>
            </span>
          )}
        </p>

        <Link to={getHomePath()} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          <ArrowLeft size={16} />
          <span>Return to Your Authorized Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
