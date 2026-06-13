'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, Search, Heart, User, LogOut, Settings, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useAuth } from '@/contexts/AuthContext';
import SearchOverlay from './SearchOverlay';
import styles from './Navbar.module.css';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/collections' },
  { label: 'Offers', href: '/offers' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();
  const { count: watchlistCount } = useWatchlist();
  const { user, signOut, loading } = useAuth();

  const userInitial = user?.user_metadata?.full_name?.[0] ??
    user?.email?.[0]?.toUpperCase() ?? 'U';
  const userName = user?.user_metadata?.full_name ?? user?.email ?? '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <div className={styles.navWrapper}>
        <input
          id="nav-mobile-toggle"
          className={styles.mobileMenuCheckbox}
          type="checkbox"
          checked={menuOpen}
          onChange={(e) => setMenuOpen(e.currentTarget.checked)}
          aria-hidden="true"
        />
        {/* Navbar pill */}
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} id="navbar">
          <div className={styles.inner}>
            {/* Logo */}
            <Link href="/" className={styles.logo} id="nav-logo">
              <Image src="/logo.png" alt="KDSL Clothing Logo" width={36} height={36} priority />
              <span className={styles.logoText}>KDSL</span>
            </Link>

            {/* Links */}
            <ul className={styles.links}>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`${styles.link} ${l.label === 'Offers' ? styles.offersLink : ''}`}
                    id={`nav-${l.label.toLowerCase()}`}
                  >
                    {l.label === 'Offers' && <Tag size={12} className={styles.offersIcon} />}
                    {l.label}
                    <span className={styles.linkUnderline} />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={styles.iconBtn}
                aria-label="Search"
                id="nav-search"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search size={17} />
              </button>
              <Link href="/watchlist" className={styles.iconBtn} aria-label="Watchlist" id="nav-watchlist">
                <Heart size={17} />
                {watchlistCount > 0 && (
                  <span className={styles.cartBadge}>{watchlistCount}</span>
                )}
              </Link>
              <Link href="/cart" className={styles.iconBtn} aria-label="Cart" id="nav-cart">
                <ShoppingBag size={17} />
                {itemCount > 0 && (
                  <span className={styles.cartBadge}>{itemCount}</span>
                )}
              </Link>
              {/* Sign In — only when definitively logged out (not during loading) */}
              {!loading && !user && (
                <Link href="/auth/login" className={styles.signInBtn} id="nav-signin">
                  <User size={14} />
                  Sign In
                </Link>
              )}
              <Link href="/collections" className={`btn-primary ${styles.shopBtn}`} id="nav-shop-cta">
                <span>Shop Now</span>
              </Link>
              <label
                htmlFor="nav-mobile-toggle"
                className={styles.menuBtn}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                id="nav-menu-toggle"
                role="button"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </label>
            </div>
          </div>
        </nav>

        {/* Floating avatar — outside pill, only when definitively logged in */}
        {!loading && user && (
          <div className={styles.avatarFloat} ref={dropdownRef}>
            <button
              id="nav-avatar-btn"
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Account menu"
              title={user.email}
            >
              <span className={styles.avatarInitial}>{userInitial}</span>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className={styles.dropdown} id="nav-account-dropdown">
                {/* User info */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAvatar}>
                    <span>{userInitial}</span>
                  </div>
                  <div className={styles.dropdownInfo}>
                    {user.user_metadata?.full_name && (
                      <p className={styles.dropdownName}>{user.user_metadata.full_name}</p>
                    )}
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                </div>

                <div className={styles.dropdownDivider} />

                {/* Menu items */}
                <div className={styles.dropdownMenu}>
                  <Link
                    href="/account"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                    id="dropdown-profile"
                  >
                    <Settings size={14} />
                    <span>My Account</span>
                  </Link>
                  <Link
                    href="/watchlist"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                    id="dropdown-watchlist"
                  >
                    <Heart size={14} />
                    <span>Watchlist {watchlistCount > 0 && `(${watchlistCount})`}</span>
                  </Link>
                </div>

                <div className={styles.dropdownDivider} />

                <button
                  className={styles.dropdownSignOut}
                  onClick={handleSignOut}
                  id="dropdown-signout"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Drawer */}
        <label
          htmlFor="nav-mobile-toggle"
          className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ''}`}
          aria-hidden="true"
        />
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileMenuHeader}>
            <span className={styles.logoText} style={{ fontSize: '18px' }}>KDSL</span>
            <label htmlFor="nav-mobile-toggle" className={styles.iconBtn} aria-label="Close menu" role="button">
              <X size={24} />
            </label>
          </div>
          <ul className={styles.mobileLinks}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.mobileLink} onClick={closeMenu}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/watchlist" className={styles.mobileLink} onClick={closeMenu}>
                Watchlist {watchlistCount > 0 && `(${watchlistCount})`}
              </Link>
            </li>
            <li>
              <Link href="/cart" className={styles.mobileLink} onClick={closeMenu}>
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
            </li>
            {user ? (
              <li>
                <button
                  className={`${styles.mobileLink} ${styles.mobileLinkBtn}`}
                  onClick={() => { handleSignOut(); closeMenu(); }}
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li>
                <Link href="/auth/login" className={styles.mobileLink} onClick={closeMenu}>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
          <Link href="/collections" className="btn-primary" style={{ justifyContent: 'center', marginTop: 'auto' }} onClick={closeMenu}>
            <span>Shop Now</span>
          </Link>
        </div>
      </div>

      {/* Search overlay — rendered outside the nav wrapper for full-screen */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
