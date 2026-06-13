'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import styles from './Hero.module.css';

export default function Hero() {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!circleRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      circleRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className={styles.hero} id="hero">
      {/* Ambient background elements */}
      <div className={styles.ambientBg}>
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />
        <div className={styles.gridLines} />
      </div>

      {/* Floating orbs */}
      <div className={styles.orbs}>
        <div ref={circleRef} className={styles.orbMain} />
        <div className={styles.orbSecondary} />
        <div className={styles.orbTiny} />
      </div>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        <div className={styles.badge} id="hero-badge">
          <span className={styles.badgeDot} />
          <span>New Collection 2026</span>
        </div>

        <h1 className={styles.headline}>
          <span className={styles.headlineLine}>Wear</span>
          <span className={`${styles.headlineLine} ${styles.headlineGradient}`}>
            Your Story
          </span>
          <span className={styles.headlineLine}>In Style</span>
        </h1>

        <p className={styles.subtext}>
          KDSL Clothing — Where modern luxury meets bold self-expression.
          <br />
          Crafted for those who dare to stand out.
        </p>

        <div className={styles.ctas}>
          <Link href="/collections" className="btn-primary" id="hero-cta-shop">
            <span>Explore Collection</span>
            <ArrowRight size={16} />
          </Link>
          <button className={`btn-outline ${styles.playBtn}`} id="hero-cta-video">
            <Play size={14} fill="currentColor" />
            <span>Watch Lookbook</span>
          </button>
        </div>

        <div className={styles.stats}>
          {[
            { value: '50+', label: 'Premium Pieces' },
            { value: '10K+', label: 'Happy Customers' },
            { value: '5★', label: 'Brand Rating' },
          ].map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
        <span className={styles.scrollText}>Scroll</span>
      </div>
    </section>
  );
}
