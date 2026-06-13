import styles from './Testimonials.module.css';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Asel Perera',
    location: 'Colombo',
    quote: 'KDSL hoodie is the best piece I\'ve ever owned. The quality is insane — feels like wearing a luxury brand from overseas but it\'s local.',
    rating: 5,
    item: 'Signature Hoodie',
  },
  {
    id: 2,
    name: 'Dilshan Rajapaksa',
    location: 'Kandy',
    quote: 'Ordered the tracksuit set and it exceeded every expectation. The fit is perfect, the material is premium. KDSL is now my go-to brand.',
    rating: 5,
    item: 'Luxury Tracksuit Set',
  },
  {
    id: 3,
    name: 'Nimesha Fernando',
    location: 'Galle',
    quote: 'Finally a Sri Lankan brand that actually delivers luxury quality. The packaging alone felt premium. My friends keep asking where I got it.',
    rating: 5,
    item: 'Premium Minimal Tee',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section} id="testimonials">
      <div className="container">
        <div className={styles.header}>
          <span className="section-tag">Testimonials</span>
          <h2 className={styles.title}>
            Loved by <em className={styles.titleAccent}>Thousands</em>
          </h2>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t) => (
            <div key={t.id} className={styles.card} id={`testimonial-${t.id}`}>
              <div className={styles.stars}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={13} fill="#1ECFC8" color="#1ECFC8" />
                ))}
              </div>
              <blockquote className={styles.quote}>"{t.quote}"</blockquote>
              <div className={styles.footer}>
                <div className={styles.avatar}>{t.name.charAt(0)}</div>
                <div>
                  <p className={styles.name}>{t.name}</p>
                  <p className={styles.meta}>{t.location} · {t.item}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
