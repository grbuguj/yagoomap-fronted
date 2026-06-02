import { useFavorites, toggleFavorite } from '../hooks/useFavorites'
import styles from './FavoriteButton.module.css'

// 가게 즐겨찾기(하트) 토글. 목록 카드/상세 어디서나 재사용.
function FavoriteButton({ venueId, className = '', size = 20, stop = true }) {
  const { favorites } = useFavorites()
  const fav = favorites.includes(venueId)

  const handleClick = (e) => {
    if (stop) e.stopPropagation()
    toggleFavorite(venueId)
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${fav ? styles.active : ''} ${className}`}
      onClick={handleClick}
      aria-pressed={fav}
      aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      title={fav ? '즐겨찾기 해제' : '즐겨찾기'}
    >
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={fav ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  )
}

export default FavoriteButton
