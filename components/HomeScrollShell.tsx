'use client';

import { ReactNode, useEffect, useRef } from 'react';
import styles from '@/app/page.module.css';

export default function HomeScrollShell({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let rafId = 0;

    const updateHeroMotion = () => {
      rafId = 0;
      const start = shell.offsetTop;
      const distance = Math.max(window.innerHeight * 0.9, 1);
      const progress = Math.min(Math.max((window.scrollY - start) / distance, 0), 1);

      shell.style.setProperty('--hero-scale', String(1 - progress * 0.12));
      shell.style.setProperty('--hero-y', `${progress * -72}px`);
      shell.style.setProperty('--hero-opacity', String(1 - progress * 0.28));
      shell.style.setProperty('--hero-blur', `${progress * 2}px`);
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateHeroMotion);
    };

    updateHeroMotion();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main ref={shellRef} className={styles.homeMain}>
      {children}
    </main>
  );
}
