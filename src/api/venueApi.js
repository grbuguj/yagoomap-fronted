const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

export async function fetchVenues({ team, area, keyword } = {}) {
  const params = new URLSearchParams()
  if (team && team !== '전체') params.append('team', team)
  if (area && area !== '전체') params.append('area', area)
  if (keyword?.trim()) params.append('keyword', keyword.trim())

  const res = await fetch(`${BASE_URL}/api/places?${params}`)
  if (!res.ok) throw new Error(`가게 목록 조회 실패: ${res.status}`)
  return res.json()
}

export async function submitReport(data) {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`제보 실패: ${res.status}`)
  return res.json()
}

export async function fetchReviews(venueId) {
  const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`)
  if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status}`)
  return res.json()
}

export async function submitReview({ venueId, rating, content }) {
  const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content }),
  })
  if (!res.ok) throw new Error(`리뷰 등록 실패: ${res.status}`)
  return res.json()
}