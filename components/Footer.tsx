import Link from 'next/link';
import Image from 'next/image';
import { Camera, MessageCircle, Tv, Mail, MapPin, Phone } from 'lucide-react';
import styles from './Footer.module.css';

const links = {
  Shop: [
    { label: 'New Arrivals', href: '/collections' },
    { label: 'Hoodies', href: '/collections' },
    { label: 'T-Shirts', href: '/collections' },
    { label: 'Sets & Tracksuits', href: '/collections' },
    { label: 'Jackets', href: '/collections' },
  ],
  Company: [
    { label: 'About KDSL', href: '/about' },
    { label: 'Lookbook', href: '#lookbook' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Careers', href: '/about' },
  ],
  Support: [
    { label: 'Size Guide', href: '/contact' },
    { label: 'Shipping & Returns', href: '/return-policy' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'FAQ', href: '/contact' },
    { label: 'Track Order', href: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className="container">
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} id="footer-logo">
              <Image src="/logo.png" alt="KDSL Clothing Logo" width={48} height={48} />
              <span className={styles.logoText}>KDSL Clothing</span>
            </Link>
            <p className={styles.tagline}>
              Luxury fashion for the bold and refined. Crafted with passion, worn with purpose.
            </p>
            <div className={styles.socials}>
              {[
                { Icon: Camera, label: 'Instagram', href: '#' },
                { Icon: MessageCircle, label: 'Twitter', href: '#' },
                { Icon: Tv, label: 'YouTube', href: '#' },
              ].map(({ Icon, label, href }) => (
                <a key={label} href={href} className={styles.socialBtn} aria-label={label} id={`footer-social-${label.toLowerCase()}`}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail size={13} className={styles.contactIcon} />
                <span>hologramsoftwaresolutions@gmail.com</span>
              </div>
              <div className={styles.contactItem}>
                <Phone size={13} className={styles.contactIcon} />
                <span>0757381568</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={13} className={styles.contactIcon} />
                <span>23, Palliyawattha, Elabadagama, Pannala, 60160</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className={styles.linkGroup}>
              <h4 className={styles.groupTitle}>{group}</h4>
              <ul className={styles.linkList}>
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={styles.link} id={`footer-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copy}>
            © 2026 KDSL Clothing. All rights reserved.
          </p>
          <div className={styles.legal}>
            <Link href="/return-policy" className={styles.legalLink} id="footer-return-policy">Return Policy</Link>
            <Link href="/privacy-policy" className={styles.legalLink} id="footer-privacy">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className={styles.legalLink} id="footer-terms">Business Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
