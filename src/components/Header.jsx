import styles from './Header.module.css'

function Header({ onReport }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚾</span>
        <div className={styles.logoText}>
          <span className={styles.logoMain}>야구맵</span>
          <span className={styles.logoSub}>야구 틀어주는 술집 지도</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <button className={styles.reportBtn} onClick={onReport}>
          📍 제보하기
        </button>
      </nav>
    </header>
  )
}

export default Header
