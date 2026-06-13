import Navbar from '@/components/Navbar';
import BillboardHero from '@/components/BillboardHero';
import MarqueeStrip from '@/components/Marquee';
import FeaturedCollections from '@/components/FeaturedCollections';
import BrandStory from '@/components/BrandStory';
import Lookbook from '@/components/Lookbook';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import HomeScrollShell from '@/components/HomeScrollShell';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />
      <HomeScrollShell>
        <div className={styles.heroPin}>
          <BillboardHero />
        </div>
        <div className={styles.contentRise}>
          <MarqueeStrip />
          <FeaturedCollections />
          <BrandStory />
          <Lookbook />
          <Testimonials />
          <Newsletter />
        </div>
      </HomeScrollShell>
      <Footer />
    </>
  );
}
