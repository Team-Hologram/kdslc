import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './Lookbook.module.css';

export default function Lookbook() {
  return (
    <section className={styles.section} id="lookbook">
      <div className="container">
        <div className={styles.header}>
          <span className="section-tag">SS 2026 Lookbook</span>
          <h2 className={styles.title}>
            The New <em className={styles.titleAccent}>Aesthetic</em>
          </h2>
          <p className={styles.subtitle}>
            A visual journey through our latest collection — where darkness meets elegance.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={`${styles.cell} ${styles.cellLarge}`} id="lookbook-image-1">
            <Image src="/lookbook-hero.jpg" alt="KDSL Lookbook 2026 - Hero" fill className={styles.img} sizes="50vw" />
            <div className={styles.cellOverlay}>
              <span className={styles.cellLabel}>Look 01</span>
              <p className={styles.cellName}>The Nightfall</p>
            </div>
          </div>
          <div className={styles.cellCol}>
            <div className={`${styles.cell} ${styles.cellSmall}`} id="lookbook-image-2">
              <Image src="/lookbook-2.jpg" alt="KDSL Lookbook 2026 - Look 2" fill className={styles.img} sizes="25vw" />
              <div className={styles.cellOverlay}>
                <span className={styles.cellLabel}>Look 02</span>
                <p className={styles.cellName}>The Ivory Edit</p>
              </div>
            </div>
            <div className={`${styles.cell} ${styles.cellSmall}`} id="lookbook-image-3">
              <Image src="/product-tracksuit.jpg" alt="KDSL Lookbook 2026 - Look 3" fill className={styles.img} sizes="25vw" />
              <div className={styles.cellOverlay}>
                <span className={styles.cellLabel}>Look 03</span>
                <p className={styles.cellName}>The Monochrome</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <Link href="/collections" className="btn-primary" id="lookbook-cta">
            <span>Shop The Look</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
