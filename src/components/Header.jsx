import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚾</span>
        <div className={styles.logoText}>
          <span className={styles.logoMain}>야구틀어주는술집</span>
          <span className={styles.logoSub}>LG TWINS MAP</span>
        </div>
      </div>
      <button className={styles.bellBtn} aria-label="알림">
        <span className={styles.bellIcon}>🔔</span>
        <span className={styles.bellDot} />
      </button>
    </header>
  )
}

export default Header
