'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './RouteLoader.module.css';

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function shouldShowForLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  const nextUrl = new URL(href, window.location.href);
  if (nextUrl.origin !== window.location.origin) return false;
  if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return false;

  return true;
}

export default function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setVisible(true);
    safetyTimer.current = setTimeout(() => setVisible(false), 6000);
  };

  const hideSoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 360);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('button, [data-route-loader-ignore="true"]')) return;
      const anchor = target?.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement && shouldShowForLink(anchor)) show();
    };

    const onPopState = () => show();

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  useEffect(() => {
    hideSoon();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="Loading page">
      <div className={styles.circle}>
        <div className={styles.spinner} />
        <img src="/logo.png" alt="Logo" className={styles.logoImg} />
      </div>
    </div>
  );
}
