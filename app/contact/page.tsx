'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, Mail, MapPin, Phone, Send, Camera, MessageCircle, Tv } from 'lucide-react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setApiError(data.error ?? 'Failed to send. Please try again.');
      }
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Header */}
        <section className={styles.hero}>
          <div className={styles.heroBg} />
          <div className="container">
            <span className="section-tag">Get in Touch</span>
            <h1 className={styles.heroTitle}>
              Let's <em className={styles.titleAccent}>Connect</em>
            </h1>
            <p className={styles.heroSub}>
              Have a question about sizing, orders, or collaboration? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className={styles.content}>
          <div className="container">
            <div className={styles.grid}>
              {/* Info */}
              <div className={styles.info}>
                <h2 className={styles.infoTitle}>Contact Information</h2>
                <div className={styles.contactItems}>
                  {[
                    { Icon: Building2, label: 'Business Name', value: 'KDSL Clothing' },
                    { Icon: Mail, label: 'Business Email', value: 'hologramsoftwaresolutions@gmail.com' },
                    { Icon: Phone, label: 'Business Phone', value: '0757381568' },
                    { Icon: MessageCircle, label: 'WhatsApp', value: '0757381568' },
                    { Icon: MapPin, label: 'Business Address', value: '23, Palliyawattha, Elabadagama, Pannala, 60160' },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className={styles.contactItem} id={`contact-info-${label.toLowerCase()}`}>
                      <div className={styles.contactIcon}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={styles.contactLabel}>{label}</p>
                        <p className={styles.contactValue}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.socialSection}>
                  <p className={styles.socialTitle}>Follow Us</p>
                  <div className={styles.socials}>
                    {[
                      { Icon: Camera, label: 'Instagram', href: '#' },
                      { Icon: MessageCircle, label: 'Twitter', href: '#' },
                      { Icon: Tv, label: 'YouTube', href: '#' },
                    ].map(({ Icon, label, href }) => (
                      <a key={label} href={href} className={styles.socialBtn} aria-label={label} id={`contact-social-${label.toLowerCase()}`}>
                        <Icon size={18} />
                        <span>{label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className={styles.hours}>
                  <p className={styles.hoursTitle}>Business Hours</p>
                  <p className={styles.hoursText}>Monday – Friday: 9:00 AM – 6:00 PM</p>
                  <p className={styles.hoursText}>Saturday: 10:00 AM – 4:00 PM</p>
                  <p className={styles.hoursText}>Sunday: Closed</p>
                </div>
              </div>

              {/* Form */}
              <div className={styles.formSection}>
                {sent ? (
                  <div className={styles.successMsg} id="contact-success">
                    <div className={styles.successIcon}>✦</div>
                    <h3 className={styles.successTitle}>Message Sent!</h3>
                    <p className={styles.successText}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                    <button className="btn-primary" onClick={() => setSent(false)} id="contact-send-another">
                      <span>Send Another</span>
                    </button>
                  </div>
                ) : (
                  <form className={styles.form} onSubmit={handleSubmit} id="contact-form">
                    <h2 className={styles.formTitle}>Send a Message</h2>
                    <div className={styles.formRow}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="contact-name">Your Name</label>
                        <input
                          id="contact-name"
                          type="text"
                          className={styles.input}
                          placeholder="Kavishka Sinhabahu"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="contact-email">Email Address</label>
                        <input
                          id="contact-email"
                          type="email"
                          className={styles.input}
                          placeholder="hello@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="contact-subject">Subject</label>
                      <input
                        id="contact-subject"
                        type="text"
                        className={styles.input}
                        placeholder="Order enquiry, sizing, collaboration..."
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="contact-message">Message</label>
                      <textarea
                        id="contact-message"
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder="Tell us how we can help..."
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>
                    {apiError && (
                      <p style={{ color: '#dc2626', fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif' }}>{apiError}</p>
                    )}
                    <button type="submit" className="btn-primary" id="contact-submit" disabled={loading}>
                      <span>{loading ? 'Sending…' : 'Send Message'}</span>
                      {!loading && <Send size={15} />}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
