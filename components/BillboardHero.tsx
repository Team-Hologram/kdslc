'use client';
import { useCallback, useState, useEffect, useRef, type SyntheticEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import styles from './BillboardHero.module.css';

type HeroTextTone = 'onLight' | 'onDark';

function detectImageTextTone(img: HTMLImageElement): HeroTextTone | null {
  try {
    const canvas = document.createElement('canvas');
    const size = 36;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let luminanceTotal = 0;
    let lightPixels = 0;
    let sampledPixels = 0;

    for (let i = 0; i < data.length; i += 16) {
      const alpha = data[i + 3];
      if (alpha < 20) continue;
      const luminance = (0.2126 * data[i]) + (0.7152 * data[i + 1]) + (0.0722 * data[i + 2]);
      luminanceTotal += luminance;
      if (luminance > 170) lightPixels += 1;
      sampledPixels += 1;
    }

    if (sampledPixels === 0) return null;
    const averageLuminance = luminanceTotal / sampledPixels;
    const lightRatio = lightPixels / sampledPixels;

    return averageLuminance > 150 || lightRatio > 0.55 ? 'onLight' : 'onDark';
  } catch {
    return null;
  }
}

export default function BillboardHero() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [imageTextTones, setImageTextTones] = useState<Record<string, HeroTextTone>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { products } = useProducts();
  const billboardProducts = products.slice(0, 4);

  const goTo = (index: number) => {
    if (index === current) return;
    setPrev(current);
    setCurrent(index);
  };

  // After transition completes, clear the "prev" so it's unmounted from the active class
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 900);
    return () => clearTimeout(t);
  }, [prev]);

  // Auto-advance
  const resetTimer = useCallback(() => {
    if (billboardProducts.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % billboardProducts.length;
      });
    }, 5500);
  }, [billboardProducts.length]);

  useEffect(() => {
    if (billboardProducts.length === 0) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [billboardProducts.length, resetTimer]);

  const product = billboardProducts[current];
  const currentTextTone = product ? imageTextTones[product.id] ?? 'onDark' : 'onDark';

  const handleImageLoad = useCallback((productId: string, event: SyntheticEvent<HTMLImageElement>) => {
    const tone = detectImageTextTone(event.currentTarget);
    if (!tone) return;
    setImageTextTones((prevTones) =>
      prevTones[productId] === tone ? prevTones : { ...prevTones, [productId]: tone }
    );
  }, []);

  if (!product) return null;

  return (
    <section
      className={`${styles.hero} ${currentTextTone === 'onLight' ? styles.textOnLightImage : styles.textOnDarkImage}`}
      id="hero"
    >
      {/* Ambient BG */}
      <div className={styles.ambientBg}>
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />
      </div>

      {/* Slides — pure crossfade */}
      <div className={styles.billboard}>
        {billboardProducts.map((p, i) => (
          <div
            key={p.id}
            className={[
              styles.slide,
              i === current ? styles.slideCurrent : '',
              i === prev ? styles.slidePrev : '',
            ].join(' ')}
          >
            <Image
              src={p.heroImage}
              alt={p.name}
              fill
              className={styles.slideImg}
              sizes="55vw"
              preload={i === 0}
              onLoad={(event) => handleImageLoad(p.id, event)}
            />
            <div className={styles.slideGradient} />
          </div>
        ))}
      </div>

      {/* Content Layer */}
      <div className={styles.contentLayer}>
        {billboardProducts.map((p, i) => {
          const isCurrent = i === current;
          const isPrev = i === prev;
          if (!isCurrent && !isPrev) return null;

          return (
            <div
              key={p.id}
              className={[
                styles.splitSlide,
                isCurrent ? styles.splitCurrent : '',
                isPrev ? styles.splitPrev : '',
              ].join(' ')}
            >
              {/* Top Left Block */}
              <div className={styles.topLeftBlock}>
                <div className={styles.badge} id={`hero-badge-${p.id}`}>
                  <span className={styles.badgeDot} />
                  <span>{p.tag || p.category}</span>
                </div>

                <h1 className={styles.headline}>
                  <span className={styles.headlineCategory}>{p.category}</span>
                  <span className={styles.headlineMain}>{p.name}</span>
                </h1>
              </div>

              {/* Bottom Right Block */}
              <div className={styles.bottomRightBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{p.priceFormatted}</span>
                  <div className={styles.rating}>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.ratingVal}>{p.rating}</span>
                  </div>
                </div>

                <p className={styles.desc}>{p.description.substring(0, 110)}...</p>

                <div className={styles.ctas}>
                  <Link href={`/product/${p.id}`} className="btn-primary" id={`hero-cta-view-${p.id}`}>
                    <span>View Product</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/collections" className="btn-outline" id={`hero-cta-shop-${p.id}`}>
                    <span>All Collections</span>
                  </Link>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Floating stats — bottom left */}
      <div className={styles.statsStrip}>
        {[
          { value: '50+', label: 'Pieces' },
          { value: '10K+', label: 'Customers' },
          { value: '5★', label: 'Rating' },
        ].map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
