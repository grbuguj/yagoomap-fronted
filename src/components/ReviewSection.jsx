import { useState, useEffect } from 'react'
import { fetchReviews, submitReview, fetchReviewSummary } from '../api/venueApi'
import { sendEvent, EVENT } from '../api/events'
import styles from './ReviewSection.module.css'

/* ── 별점 선택기 ─────────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`${styles.starBtn} ${n <= active ? styles.starBtnOn : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
        >★</button>
      ))}
      {value > 0 && (
        <span className={styles.starLabel}>{value}.0</span>
      )}
    </div>
  )
}

/* ISO("2026-05-29T16:28:53") → "2026.05.29", 이미 "2026.05.29" 형태면 그대로 */
function formatReviewDate(v) {
  if (!v) return ''
  return v.includes('T') ? v.slice(0, 10).replace(/-/g, '.') : v
}

/* ── 리뷰 카드 ──────────────────────────────────────── */
function ReviewItem({ review }) {
  const filled = '★'.repeat(review.rating)
  const empty  = '☆'.repeat(5 - review.rating)

  return (
    <div className={styles.item}>
      <div className={styles.itemHead}>
        <span className={styles.itemStars}>
          <span className={styles.itemStarsFilled}>{filled}</span>
          <span className={styles.itemStarsEmpty}>{empty}</span>
        </span>
        <span className={styles.itemDate}>{formatReviewDate(review.createdAt)}</span>
      </div>
      <p className={styles.itemContent}>{review.content}</p>
    </div>
  )
}

/* ── ReviewSection ──────────────────────────────────── */
function ReviewSection({ venueId, onCountChange }) {
  const [reviews,    setReviews]    = useState([])
  const [summary,    setSummary]    = useState(null)
  const [loadedId,   setLoadedId]   = useState(null) // 마지막으로 로드 완료한 venueId
  const [showForm,   setShowForm]   = useState(false)
  const [rating,     setRating]     = useState(0)
  const [content,    setContent]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 현재 venueId 데이터가 아직 안 들어왔으면 로딩 상태 (effect 내 동기 setState 회피)
  const loading = loadedId !== venueId

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchReviews(venueId),
      fetchReviewSummary(venueId),
    ]).then(([data, sum]) => {
      if (!cancelled) {
        setReviews(data)
        setSummary(sum)
        setLoadedId(venueId)
        onCountChange?.(data.length)
      }
    })
    return () => { cancelled = true }
  }, [venueId, onCountChange])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating || !content.trim()) return
    setSubmitting(true)
    const newReview = await submitReview({ venueId, rating, content: content.trim() })
    sendEvent(EVENT.WRITE_REVIEW, { placeId: venueId })
    setReviews(prev => {
      const updated = [newReview, ...prev]
      onCountChange?.(updated.length)
      return updated
    })
    // 평균 평점·AI 요약 재계산 (백엔드가 작성 후 갱신)
    fetchReviewSummary(venueId).then(setSummary)
    setRating(0)
    setContent('')
    setShowForm(false)
    setSubmitting(false)
  }

  const canSubmit = rating > 0 && content.trim().length > 0

  return (
    <div className={styles.wrap}>
      {/* 섹션 헤더 */}
      <div className={styles.header}>
        <span className={styles.title}>
          리뷰
          {!loading && <span className={styles.count}>{reviews.length}</span>}
        </span>
        <button
          className={`${styles.writeBtn} ${showForm ? styles.writeBtnCancel : ''}`}
          onClick={() => {
            setShowForm(o => !o)
            setRating(0)
            setContent('')
          }}
        >
          {showForm ? '취소' : '✏️ 리뷰 쓰기'}
        </button>
      </div>

      {/* AI 요약 카드 — 리뷰가 있을 때만 */}
      {!loading && summary && summary.reviewCount > 0 && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <span className={styles.summaryStars}>
              <span className={styles.summaryStarsFilled}>
                {'★'.repeat(Math.round(summary.averageRating ?? 0))}
              </span>
              <span className={styles.summaryStarsEmpty}>
                {'☆'.repeat(5 - Math.round(summary.averageRating ?? 0))}
              </span>
            </span>
            <span className={styles.summaryAvg}>
              {Number(summary.averageRating ?? 0).toFixed(1)}
            </span>
            <span className={styles.summaryCount}>리뷰 {summary.reviewCount}개</span>
          </div>
          {summary.summary && (
            <p className={styles.summaryText}>
              <span className={styles.summaryBadge}>AI 요약</span>
              {summary.summary}
            </p>
          )}
        </div>
      )}

      {/* 작성 폼 */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.formLabel}>별점을 선택해주세요</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className={styles.textarea}
            placeholder="이 가게의 야구 중계 환경은 어때요? (스크린 크기, 소리, 분위기 등)"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || !canSubmit}
          >
            {submitting ? '등록 중...' : '익명으로 등록하기'}
          </button>
        </form>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <p className={styles.placeholder}>불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <span>💬</span>
          <p>아직 리뷰가 없어요</p>
          <small>첫 번째 리뷰를 남겨보세요!</small>
        </div>
      ) : (
        <div className={styles.list}>
          {reviews.map(r => <ReviewItem key={r.id} review={r} />)}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
