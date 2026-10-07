import React from 'react';
import Navbar from '../components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem',
        background: 'rgba(9, 13, 22, 0.9)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>CAMPUSHIRE</strong> &copy; {new Date().getFullYear()} — College Placement Management System
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Backend: FastAPI + SQLite</span>
            <span>Frontend: React + Vite</span>
            <span style={{ color: 'var(--accent-emerald)' }}>● Database Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
