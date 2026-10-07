import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Mail,
  KeyRound,
  User,
  Building,
  Phone,
  BookOpen
} from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Student fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [cgpa, setCgpa] = useState('');
  const [phone, setPhone] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [website, setWebsite] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Admin fields
  const [designation, setDesignation] = useState('Placement Officer');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim() || undefined;

    const payload = {
      email: cleanEmail,
      password,
      role,
      phone: cleanPhone,
    };

    if (role === 'STUDENT') {
      payload.full_name = fullName.trim();
      payload.roll_number = rollNumber.trim() || undefined;
      payload.department = department.trim();
      payload.graduation_year = graduationYear ? parseInt(graduationYear, 10) : undefined;
      payload.cgpa = (cgpa !== '' && !isNaN(parseFloat(cgpa))) ? parseFloat(cgpa) : undefined;
    } else if (role === 'COMPANY') {
      payload.company_name = companyName.trim();
      payload.industry = industry.trim();
      payload.website = website.trim() || undefined;
      payload.contact_person = contactPerson.trim() || undefined;
      payload.contact_email = contactEmail.trim().toLowerCase() || undefined;
    } else if (role === 'ADMIN') {
      payload.full_name = fullName.trim();
      payload.designation = designation.trim();
    }

    try {
      const user = await register(payload);
      if (user?.role === 'ADMIN') navigate('/admin');
      else if (user?.role === 'STUDENT') navigate('/student');
      else if (user?.role === 'COMPANY') navigate('/company');
      else navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '30px auto', width: '100%' }}>
      <div className="glass-panel glass-panel-glow" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '16px',
            color: '#a5b4fc'
          }}>
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Create an Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose your role and join CampusHire Placement System
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '6px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            className={`btn ${role === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '10px', fontSize: '0.85rem' }}
            onClick={() => setRole('STUDENT')}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>

          <button
            type="button"
            className={`btn ${role === 'COMPANY' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '10px', fontSize: '0.85rem' }}
            onClick={() => setRole('COMPANY')}
          >
            <Briefcase size={16} />
            <span>Company</span>
          </button>

          <button
            type="button"
            className={`btn ${role === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '10px', fontSize: '0.85rem' }}
            onClick={() => setRole('ADMIN')}
          >
            <ShieldCheck size={16} />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Common Account Credentials */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password * (min 6 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>
          </div>

          {/* STUDENT FORM FIELDS */}
          {role === 'STUDENT' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Profile Information
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-name">Full Name *</label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-roll">Roll / Registration Number</label>
                  <input
                    id="student-roll"
                    type="text"
                    className="form-input"
                    placeholder="e.g. CS2026-101"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    Optional • Must be unique if provided
                  </span>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-dept">Department</label>
                  <input
                    id="student-dept"
                    type="text"
                    className="form-input"
                    placeholder="Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-grad-year">Grad Year</label>
                  <input
                    id="student-grad-year"
                    type="number"
                    className="form-input"
                    placeholder="2026"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-cgpa">CGPA (0 - 10)</label>
                  <input
                    id="student-cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-input"
                    placeholder="8.50"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-phone">Phone Number</label>
                <input
                  id="student-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* COMPANY FORM FIELDS */}
          {role === 'COMPANY' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Company Representative Profile
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="company-name">Company Name *</label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Acme Technologies Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="company-industry">Industry Domain</label>
                  <input
                    id="company-industry"
                    type="text"
                    className="form-input"
                    placeholder="Software & Cloud"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="company-website">Official Website</label>
                  <input
                    id="company-website"
                    type="url"
                    className="form-input"
                    placeholder="https://acme.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="company-contact">HR / Contact Person</label>
                  <input
                    id="company-contact"
                    type="text"
                    className="form-input"
                    placeholder="Jane Doe (Head Recruiter)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company-phone">Contact Phone</label>
                <input
                  id="company-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ADMIN FORM FIELDS */}
          {role === 'ADMIN' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Administrator Profile
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-name">Full Name *</label>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Dr. Robert Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-designation">Designation</label>
                  <input
                    id="admin-designation"
                    type="text"
                    className="form-input"
                    placeholder="Dean of Corporate Affairs"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-phone">Official Phone</label>
                <input
                  id="admin-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 987-6543"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Creating Account in SQLite...</span>
              </>
            ) : (
              <>
                <span>Complete Registration as {role}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
