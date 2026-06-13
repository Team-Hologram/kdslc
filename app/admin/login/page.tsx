'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import styles from './login.module.css';

type Step = 'credentials' | '2fa' | 'setup';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    // Only verify auth or redirect if already logged in here if needed
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      if (data.requires2fa) {
        setStep('2fa');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Invalid code'); return; }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Shield size={24} />
          </div>
          <div>
            <div className={styles.logoText}>KDSL Admin</div>
            <div className={styles.logoSub}>Secure Admin Portal</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className={styles.alert} data-type="error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className={styles.alert} data-type="success">
            <CheckCircle size={15} /> {success}
          </div>
        )}

        {/* ── Step: Credentials ── */}
        {step === 'credentials' && (
          <>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to your admin account</p>

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@kdslclothing.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <><Shield size={16} /> Sign In</>
                )}
              </button>
            </form>

          </>
        )}

        {/* ── Step: 2FA ── */}
        {step === '2fa' && (
          <>
            <div className={styles.twoFaIcon}>
              <Smartphone size={28} />
            </div>
            <h1 className={styles.title}>Two-Factor Auth</h1>
            <p className={styles.subtitle}>
              Enter the 6-digit code from your authenticator app
            </p>

            <form onSubmit={handle2FA} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={`${styles.input} ${styles.codeInput}`}
                  placeholder="000 000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading || code.length !== 6}>
                {loading ? <span className={styles.spinner} /> : <><Shield size={16} /> Verify</>}
              </button>

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
              >
                ← Back to login
              </button>
            </form>
          </>
        )}


        <div className={styles.footer}>
          <Shield size={12} />
          Protected by 2FA authentication
        </div>
      </div>
    </div>
  );
}
