import styles from './Marquee.module.css';

const items = [
  'KDSL CLOTHING',
  'LUXURY FASHION',
  'NEW COLLECTION',
  'PREMIUM QUALITY',
  'BOLD DESIGN',
  'MODERN LUXURY',
  'KDSL CLOTHING',
  'LUXURY FASHION',
  'NEW COLLECTION',
  'PREMIUM QUALITY',
  'BOLD DESIGN',
  'MODERN LUXURY',
];

export default function MarqueeStrip() {
  return (
    <div className={styles.wrapper} id="marquee-strip">
      <div className={styles.track}>
        {items.map((item, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.dot}>✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
