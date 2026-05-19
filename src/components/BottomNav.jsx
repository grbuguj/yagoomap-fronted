import styles from './BottomNav.module.css'

const NAV_ITEMS = [
  { id: 'map',       icon: '🗺️',  label: '지도' },
  { id: 'favorite',  icon: '★',   label: '즐겨찾기' },
  { id: 'cheer',     icon: '⚾',   label: '응원하기', main: true },
  { id: 'community', icon: '💬',   label: '커뮤니티' },
  { id: 'mypage',    icon: '👤',   label: '마이페이지' },
]

function BottomNav({ active = 'map' }) {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`${styles.item} ${item.main ? styles.main : ''} ${active === item.id ? styles.active : ''}`}
        >
          {item.main ? (
            <span className={styles.mainIcon}>{item.icon}</span>
          ) : (
            <span className={styles.icon}>{item.icon}</span>
          )}
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
