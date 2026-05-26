import styles from './SidebarFooter.module.css'

function SidebarFooter({ onPolicy }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.copy}>© 2026 야구맵</p>
      <div className={styles.links}>
        <button className={styles.link} onClick={() => onPolicy('privacy')}>
          개인정보처리방침
        </button>
        <span className={styles.dot}>·</span>
        <button className={styles.link} onClick={() => onPolicy('terms')}>
          이용약관
        </button>
      </div>
    </footer>
  )
}

export default SidebarFooter
