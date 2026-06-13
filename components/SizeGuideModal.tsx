'use client';
import { useEffect } from 'react';
import { X, Ruler } from 'lucide-react';
import styles from './SizeGuideModal.module.css';

interface Props { onClose: () => void; }

const sizeData = [
  { size: 'XS', chest: '82–86', waist: '68–72', hip: '88–92', length: '66' },
  { size: 'S',  chest: '86–90', waist: '72–76', hip: '92–96', length: '68' },
  { size: 'M',  chest: '90–95', waist: '76–80', hip: '96–100', length: '70' },
  { size: 'L',  chest: '95–100', waist: '80–85', hip: '100–104', length: '72' },
  { size: 'XL', chest: '100–106', waist: '85–91', hip: '104–109', length: '74' },
  { size: 'XXL',chest: '106–112', waist: '91–97', hip: '109–114', length: '76' },
];

export default function SizeGuideModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      id="size-guide-overlay"
    >
      <div className={styles.modal} id="size-guide-modal">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><Ruler size={18} /></div>
            <div>
              <h2 className={styles.title}>Size Guide</h2>
              <p className={styles.subtitle}>All measurements in centimetres (cm)</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} id="size-guide-close" aria-label="Close size guide">
            <X size={18} />
          </button>
        </div>

        {/* How to measure */}
        <div className={styles.tips}>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📏</span>
            <div>
              <strong>Chest</strong>
              <p>Measure around the fullest part of your chest, keeping the tape horizontal.</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📐</span>
            <div>
              <strong>Waist</strong>
              <p>Measure around your natural waistline, at the narrowest point.</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>🔲</span>
            <div>
              <strong>Hip</strong>
              <p>Measure around the fullest part of your hips, about 20cm below your waist.</p>
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Size</th>
                <th className={styles.th}>Chest (cm)</th>
                <th className={styles.th}>Waist (cm)</th>
                <th className={styles.th}>Hip (cm)</th>
                <th className={styles.th}>Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row, i) => (
                <tr key={row.size} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.tdSize}>{row.size}</td>
                  <td className={styles.td}>{row.chest}</td>
                  <td className={styles.td}>{row.waist}</td>
                  <td className={styles.td}>{row.hip}</td>
                  <td className={styles.td}>{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.note}>
          If you&apos;re between sizes, we recommend sizing up for a relaxed fit or sizing down for a more fitted look.
        </p>
      </div>
    </div>
  );
}
