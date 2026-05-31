import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { TEAM_CONFIG } from '../data/teams'
import { fetchImages } from '../api/venueApi'
import ReviewSection from './ReviewSection'
import styles from './VenueDetail.module.css'

function Stars({ rating }) {
  const full  = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}
      <span className={styles.emptyStars}>{'☆'.repeat(empty)}</span>
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

/* ── 라이트박스 모달 ────────────────────────────────────── */
function Lightbox({ images, index, onClose, onPrev, onNext }) {
  // 키보드 ← → Esc
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext, onClose])

  return (
    <div className={styles.lightbox} onClick={onClose}>
      {/* 닫기 */}
      <button className={styles.lightboxClose} onClick={onClose}>✕</button>

      {/* 이전 */}
      <button
        className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
        onClick={e => { e.stopPropagation(); onPrev() }}
        disabled={index === 0}
      >‹</button>

      {/* 이미지 */}
      <img
        src={images[index]?.link || images[index]?.thumbnail}
        alt={`이미지 ${index + 1}`}
        className={styles.lightboxImg}
        onClick={e => e.stopPropagation()}
      />

      {/* 다음 */}
      <button
        className={`${styles.lightboxNav} ${styles.lightboxNext}`}
        onClick={e => { e.stopPropagation(); onNext() }}
        disabled={index === images.length - 1}
      >›</button>

      {/* 하단 도트 */}
      <div className={styles.lightboxDots} onClick={e => e.stopPropagation()}>
        {images.map((_, i) => (
          <button
            key={i}
            className={`${styles.lightboxDot} ${i === index ? styles.lightboxDotActive : ''}`}
            onClick={() => {}} // controlled by parent
          />
        ))}
      </div>

      {/* 카운터 */}
      <span className={styles.lightboxCounter}>{index + 1} / {images.length}</span>
    </div>
  )
}

/* ── VenueDetail ────────────────────────────────────────── */
function VenueDetail({ venue, onClose, onCloseAll }) {
  const [reviewCount,  setReviewCount]  = useState(venue?.reviewCount ?? 0)
  const [venueImgs,    setVenueImgs]    = useState([])
  const [imgLoading,   setImgLoading]   = useState(true)
  const [lightboxIdx,  setLightboxIdx]  = useState(null) // null=닫힘
  const [copied,       setCopied]       = useState(false)

  const handleCopyPhone = useCallback(() => {
    if (!venue?.phone) return
    navigator.clipboard.writeText(venue.phone).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [venue?.phone])

  // 이미지 5장 fetch (BASE_URL 기반 — CloudFront 경유 불가)
  useEffect(() => {
    if (!venue?.name) return
    setImgLoading(true)
    setVenueImgs([])
    fetchImages(venue.name)
      .then(items => {
        setVenueImgs(items?.slice(0, 5) ?? [])
        setImgLoading(false)
      })
  }, [venue?.name])

  const openLightbox  = useCallback((i) => setLightboxIdx(i), [])
  const closeLightbox = useCallback(() => setLightboxIdx(null), [])
  const prevImage     = useCallback(() => setLightboxIdx(i => Math.max(0, i - 1)), [])
  const nextImage     = useCallback(() => setLightboxIdx(i => Math.min(venueImgs.length - 1, i + 1)), [venueImgs.length])

  if (!venue) return null

  const teamCfg   = TEAM_CONFIG[venue.team]
  const teamColor = teamCfg?.color || 'var(--clr-primary)'

  const CATEGORY_EMOJI = {
    '치킨': '🍗', '술집': '🍺', '포차': '🏮',
    '피자': '🍕', '삼겹살': '🥩', '바': '🍸', '주점': '🍶',
  }


  // kakaoPlaceUrl 있으면 직접 링크, 없으면 이름 검색으로 fallback
  const handleKakaoMap = () =>
    window.open(
      venue.kakaoPlaceUrl || `https://map.kakao.com/link/search/${encodeURIComponent(venue.name)}`,
      '_blank'
    )
  const handleNaverMap = () =>
    window.open(
      venue.naverMapUrl || `https://map.naver.com/v5/search/${encodeURIComponent(venue.name)}`,
      '_blank'
    )

  const hasImgs = venueImgs.length > 0

  return (
    <div className={styles.wrap}>
      {/* 상단 네비바 */}
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={onClose} aria-label="뒤로가기">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className={styles.navBtn} onClick={onCloseAll ?? onClose} aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* 이미지 갤러리 영역 */}
      <div className={styles.imgArea} style={{ background: hasImgs ? '#111' : teamColor + '15' }}>
        {hasImgs ? (
          <div className={styles.gallery}>
            <button className={styles.galleryMain} onClick={() => openLightbox(0)}>
              <img src={venueImgs[0].link || venueImgs[0].thumbnail} alt={venue.name} />
            </button>
            <div className={styles.galleryGrid}>
              {[1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  className={styles.galleryThumb}
                  onClick={() => venueImgs[i] && openLightbox(i)}
                  style={{ background: teamColor + '20' }}
                >
                  {venueImgs[i] ? (
                    <img src={venueImgs[i].link || venueImgs[i].thumbnail} alt={`${venue.name} ${i + 1}`} />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span
            className={`${styles.imgPlaceholder} ${imgLoading ? styles.imgPlaceholderLoading : ''}`}
            style={{ color: teamColor }}
          >
            🍻
          </span>
        )}
      </div>

      {/* 기본 정보 */}
      <div className={styles.body}>

        {/* 1. 가게명 + 카테고리 + 팀 배지 */}
        <div className={styles.nameRow}>
          <h2 className={styles.name}>{venue.name}</h2>
          <div className={styles.badgeGroup}>
            {venue.category && (
              <span className={styles.categoryBadge}>
                {CATEGORY_EMOJI[venue.category] ?? ''} {venue.category}
              </span>
            )}
            <span className={styles.teamBadge} style={{ background: teamColor }}>
              {teamCfg?.shortName || venue.team}
            </span>
          </div>
        </div>

        {/* 2. 태그 칩 */}
        {venue.tags?.length > 0 && (
          <div className={styles.tagsRow}>
            {venue.tags.map(tag => (
              <span
                key={tag}
                className={styles.tagChip}
                style={{
                  background: teamColor + '12',
                  borderColor: teamColor + '50',
                  color: teamColor,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 3. 주소 + 전화 */}
        <div className={styles.infoRows}>
          <span className={styles.infoRow}>
            <svg className={styles.infoIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            {venue.address}
          </span>
          {venue.phone && (
            <span className={styles.infoRow}>
              <svg className={styles.infoIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className={styles.phoneNum}>{venue.phone}</span>
              <button
                className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
                onClick={handleCopyPhone}
              >
                {copied ? '복사됨 ✓' : '복사'}
              </button>
            </span>
          )}
        </div>

        {/* 4. 중계 확인 안내 — note 있으면 숨김 */}
        {!venue.note && (
          <p className={styles.notice}>
            📞 정확한 중계 여부는 가게에 전화로 확인하세요
          </p>
        )}

        {/* 5. 운영 메모 (note) */}
        {venue.note && (
          <div className={styles.noteBox} style={{ borderColor: teamColor }}>
            <span className={styles.noteIcon} style={{ color: teamColor }}>📋</span>
            <p className={styles.noteText}>{venue.note}</p>
          </div>
        )}

        {/* 6. 지도 버튼 */}
        <div className={styles.btnRow}>
          <button className={`${styles.mapBtn} ${styles.mapBtnKakao}`} onClick={handleKakaoMap}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.925 2 11.785c0 3.018 1.677 5.684 4.236 7.348l-.978 3.643a.25.25 0 0 0 .373.279L9.93 20.59A11.1 11.1 0 0 0 12 20.57c5.523 0 10-3.925 10-8.785S17.523 3 12 3"/>
            </svg>
            카카오맵
          </button>
          <button className={`${styles.mapBtn} ${styles.mapBtnNaver}`} onClick={handleNaverMap}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버맵
          </button>
        </div>

      </div>

      <div className={styles.divider} />

      {/* 별점 */}
      <div className={styles.ratingRow}>
        <Stars rating={venue.rating} />
      </div>

      <ReviewSection venueId={venue.id} onCountChange={setReviewCount} />

      {/* 라이트박스 — portal로 body에 직접 렌더링 (z-index 스태킹 컨텍스트 탈출) */}
      {lightboxIdx !== null && createPortal(
        <Lightbox
          images={venueImgs}
          index={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />,
        document.body
      )}
    </div>
  )
}

export default VenueDetail
