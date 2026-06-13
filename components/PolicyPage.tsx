import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './PolicyPage.module.css';

export type PolicySection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  note?: string;
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export default function PolicyPage({
  eyebrow,
  title,
  accent,
  intro,
  lastUpdated,
  sections,
}: PolicyPageProps) {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <span className="section-tag">{eyebrow}</span>
              <h1 className={styles.title}>
                {title} <em className={styles.titleAccent}>{accent}</em>
              </h1>
              <p className={styles.intro}>{intro}</p>
              <div className={styles.meta}>Last updated: {lastUpdated}</div>
            </div>
          </div>
        </section>

        <section className={styles.content}>
          <div className="container">
            <div className={styles.layout}>
              <aside className={styles.aside} aria-label="Policy sections">
                <p className={styles.asideTitle}>On this page</p>
                <nav className={styles.navList}>
                  {sections.map((section) => (
                    <Link key={section.id} href={`#${section.id}`} className={styles.navLink}>
                      {section.title}
                    </Link>
                  ))}
                </nav>
                <div className={styles.contactBox}>
                  <p className={styles.asideTitle}>Need help?</p>
                  <p className={styles.contactText}>
                    Contact KDSL Clothing for questions about orders, privacy, or store terms.
                  </p>
                  <Link href="/contact" className={styles.contactLink}>
                    Contact support
                  </Link>
                </div>
              </aside>

              <div className={styles.sections}>
                {sections.map((section) => (
                  <article key={section.id} id={section.id} className={styles.section}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <div className={styles.body}>
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      {section.bullets && (
                        <ul>
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {section.note && <div className={styles.note}>{section.note}</div>}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
