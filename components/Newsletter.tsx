'use client';
import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message ?? 'You\'re on the list!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className={styles.section} id="newsletter">
      <div className={styles.inner}>
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />

        <div className={styles.content}>
          <div className={styles.iconWrap}>
            <Mail size={24} />
          </div>
          <span className="section-tag" style={{ justifyContent: 'center' }}>Stay in the loop</span>
          <h2 className={styles.title}>
            Get Early Access to <br />
            <em className={styles.titleAccent}>New Drops</em>
          </h2>
          <p className={styles.subtitle}>
            Subscribe and be the first to know about exclusive collections, limited drops, and members-only offers.
          </p>

          {status === 'success' ? (
            <div className={styles.success} id="newsletter-success">
              <span>✦</span>
              <p>{message || 'You\'re on the list! Expect great things.'}</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} id="newsletter-form">
              {status === 'error' && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>{message}</p>
              )}
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={styles.input}
                  required
                  id="newsletter-email"
                  disabled={status === 'loading'}
                />
                <button type="submit" className={styles.submitBtn} id="newsletter-submit" disabled={status === 'loading'}>
                  <span>{status === 'loading' ? 'Subscribing…' : 'Subscribe'}</span>
                  {status !== 'loading' && <ArrowRight size={16} />}
                </button>
              </div>
              <p className={styles.note}>No spam, ever. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
