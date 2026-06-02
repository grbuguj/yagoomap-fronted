import { useSyncExternalStore, useCallback } from 'react'

// 로그인 없이 시작 — 즐겨찾기는 localStorage에 가게 id 배열로 저장한다.
const KEY = 'yagoomap:favorites'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// 모듈 단일 캐시 + 구독자: 여러 컴포넌트(목록 카드, 상세, 헤더 배너)가 항상 같은 값을 본다.
let cache = read()
const listeners = new Set()

function emit() {
  listeners.forEach(l => l())
}

function write(ids) {
  cache = ids
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* 저장 실패(시크릿 모드 등)는 무시 — 화면 상태는 유지 */
  }
  emit()
}

// 다른 탭에서 바뀐 즐겨찾기도 반영
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { cache = read(); emit() }
  })
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return cache
}

export function toggleFavorite(id) {
  const set = new Set(cache)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  write([...set])
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const isFavorite = useCallback((id) => favorites.includes(id), [favorites])
  return { favorites, isFavorite, toggleFavorite }
}
