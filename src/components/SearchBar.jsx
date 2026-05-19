import styles from './SearchBar.module.css'

function SearchBar() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.input}
          type="text"
          placeholder="지역, 가게명 검색"
          readOnly
        />
      </div>
      <button className={styles.filterBtn}>
        <span>⚙</span>
        <span>필터</span>
        <span className={styles.filterDot} />
      </button>
    </div>
  )
}

export default SearchBar
