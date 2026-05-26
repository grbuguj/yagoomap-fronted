import styles from './SearchBar.module.css'

function SearchBar({ value, onChange, disabled }) {
  return (
    <div className={`${styles.wrap} ${disabled ? styles.disabled : ''}`}>
      <span className={styles.icon}>🔍</span>
      <input
        className={styles.input}
        type="text"
        placeholder="가게명, 주소, 태그 검색"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
      {value && !disabled && (
        <button className={styles.clear} onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}

export default SearchBar
