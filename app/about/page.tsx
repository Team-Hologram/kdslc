import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import { Award, Heart, Zap } from 'lucide-react';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About KDSL Clothing — Our Story',
  description: 'Learn about KDSL Clothing — a Sri Lankan luxury fashion brand born from passion, dedicated to premium quality and bold design.',
};

const values = [
  { Icon: Award, title: 'Unmatched Quality', desc: 'Every piece undergoes rigorous quality control. We source only the finest fabrics and work with skilled artisans to ensure every stitch is perfect.' },
  { Icon: Heart, title: 'Passion Driven', desc: 'KDSL was born from a genuine love of fashion and the belief that everyone deserves to feel luxurious in what they wear.' },
  { Icon: Zap, title: 'Bold Vision', desc: 'We don\'t follow trends — we set them. Our designs are bold, confident, and built for those who refuse to blend in.' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroBg} />
          <div className="container">
            <span className="section-tag">Our Story</span>
            <h1 className={styles.heroTitle}>
              Born From <em className={styles.titleAccent}>Passion</em>,<br />
              Built for the Bold
            </h1>
            <p className={styles.heroSubtitle}>
              KDSL Clothing is Sri Lanka's premier luxury streetwear brand — redefining what it means to dress with intention.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className={styles.story}>
          <div className="container">
            <div className={styles.storyGrid}>
              <div className={styles.storyImage}>
                <Image src="/brand-story.jpg" alt="KDSL Atelier" fill className={styles.img} sizes="50vw" />
                <div className={styles.storyImageOverlay} />
              </div>
              <div className={styles.storyText}>
                <span className="section-tag">Chapter One</span>
                <h2 className={styles.storyTitle}>
                  A Vision for <br />
                  <em className={styles.titleAccent}>Modern Luxury</em>
                </h2>
                <p className={styles.storyBody}>
                  KDSL Clothing was founded with one simple mission: to create clothing that makes people feel extraordinary. In a market flooded with fast fashion, we chose to build something different — something that lasts.
                </p>
                <p className={styles.storyBody}>
                  Every design starts with a question: "Does this make the person wearing it feel powerful?" If the answer is yes, we build it. If not, we go back to the drawing board.
                </p>
                <p className={styles.storyBody}>
                  Today, KDSL is more than a brand — it's a community of individuals who refuse to compromise on quality, style, or self-expression.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className={styles.valuesSection}>
          <div className="container">
            <div className={styles.valuesHeader}>
              <span className="section-tag">Our Values</span>
              <h2 className={styles.valuesTitle}>
                What We <em className={styles.titleAccent}>Stand For</em>
              </h2>
            </div>
            <div className={styles.valuesGrid}>
              {values.map(({ Icon, title, desc }) => (
                <div key={title} className={styles.valueCard} id={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className={styles.valueIcon}>
                    <Icon size={22} />
                  </div>
                  <h3 className={styles.valueTitle}>{title}</h3>
                  <p className={styles.valueDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats banner */}
        <section className={styles.statsBanner}>
          <div className="container">
            <div className={styles.statsGrid}>
              {[
                { value: '2024', label: 'Founded' },
                { value: '50+', label: 'Premium Pieces' },
                { value: '10K+', label: 'Happy Customers' },
                { value: '100%', label: 'Satisfaction Guarantee' },
              ].map((s) => (
                <div key={s.label} className={styles.statItem} id={`about-stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lookbook teaser */}
        <section className={styles.lookbookTeaser}>
          <div className="container">
            <div className={styles.lookbookGrid}>
              <div className={styles.lookbookImg}>
                <Image src="/lookbook-hero.jpg" alt="KDSL Lookbook" fill className={styles.img} sizes="33vw" />
              </div>
              <div className={styles.lookbookImg}>
                <Image src="/lookbook-2.jpg" alt="KDSL Lookbook 2" fill className={styles.img} sizes="33vw" />
              </div>
              <div className={styles.lookbookImg}>
                <Image src="/product-tracksuit.jpg" alt="KDSL Tracksuit" fill className={styles.img} sizes="33vw" />
              </div>
            </div>
          </div>
        </section>

        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
