import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './BrandStory.module.css';

export default function BrandStory() {
  return (
    <section className={styles.section} id="brand-story">
      <div className={styles.grid}>
        {/* Image side */}
        <div className={styles.imageSide}>
          <div className={styles.imageMain}>
            <Image
              src="/brand-story.jpg"
              alt="KDSL Clothing Atelier"
              fill
              className={styles.img}
              sizes="50vw"
            />
            <div className={styles.imageOverlay} />
          </div>
          <div className={styles.accentCard}>
            <span className={styles.accentYear}>Est.</span>
            <span className={styles.accentNum}>2024</span>
            <p className={styles.accentText}>Born from passion, crafted with purpose</p>
          </div>
        </div>

        {/* Text side */}
        <div className={styles.textSide}>
          <span className="section-tag">Our Story</span>
          <h2 className={styles.title}>
            More Than Clothing —
            <br />
            <em className={styles.titleAccent}>A Statement</em>
          </h2>
          <p className={styles.body}>
            KDSL Clothing was born from a simple belief: fashion should tell your story before you say a word. We craft every piece with meticulous attention to detail, blending contemporary aesthetics with timeless silhouettes.
          </p>
          <p className={styles.body}>
            Our collections are designed for those who understand that true luxury isn't just about price — it's about the feeling when you put something on and know you look exactly right.
          </p>

          <div className={styles.values}>
            {[
              { icon: '◆', label: 'Premium Quality', desc: 'Only the finest fabrics and craftsmanship' },
              { icon: '◆', label: 'Bold Design', desc: 'Pieces that make a statement' },
              { icon: '◆', label: 'Exclusive Drops', desc: 'Limited editions, always in demand' },
            ].map((v) => (
              <div key={v.label} className={styles.value}>
                <span className={styles.valueIcon}>{v.icon}</span>
                <div>
                  <strong className={styles.valueLabel}>{v.label}</strong>
                  <p className={styles.valueDesc}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/about" className="btn-primary" id="brand-story-cta">
            <span>Discover Our Story</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
