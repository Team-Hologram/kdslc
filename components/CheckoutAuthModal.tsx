'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './CheckoutAuthModal.module.css';

export default function CheckoutAuthModal() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const switchTab = (t: 'login' | 'signup') => {
    setTab(t);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    if (error) {
      setError(error);
      setLoading(false);
    }
    // On success: AuthContext updates user → checkout page re-renders → modal unmounts automatically
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess('Account created! Check your email to verify, then sign in below.');
      switchTab('login');
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
    // Google redirect: page navigates away
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.cartIcon}>
            <ShoppingBag size={22} />
          </div>
          <h2 className={styles.title}>Sign in to checkout</h2>
          <p className={styles.subtitle}>
            Your cart items are saved — they&apos;ll be ready when you sign in.
          </p>
          <Link href="/cart" className={styles.backLink}>
            ← Back to cart
          </Link>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
            onClick={() => switchTab('signup')}
          >
            Create Account
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Google */}
          <button
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={googleLoading}
            id="checkout-google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {/* Login form */}
          {tab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.field}>
                <label htmlFor="ca-email">Email</label>
                <input
                  id="ca-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ca-password">Password</label>
                <input
                  id="ca-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
                id="ca-login-submit"
              >
                {loading ? 'Signing in…' : 'Sign In & Continue to Checkout'}
              </button>
            </form>
          )}

          {/* Signup form */}
          {tab === 'signup' && !success && (
            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.field}>
                <label htmlFor="ca-name">Full Name</label>
                <input
                  id="ca-name"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ca-signup-email">Email</label>
                <input
                  id="ca-signup-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ca-signup-password">Password</label>
                <input
                  id="ca-signup-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
                id="ca-signup-submit"
              >
                {loading ? 'Creating account…' : 'Create Account & Checkout'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
