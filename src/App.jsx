import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Header        from './components/Header'
import SearchBar      from './components/SearchBar'
import TeamFilterDropdown from './components/TeamFilterDropdown'
import VenueList      from './components/VenueList'
import VenueDetail   from './components/VenueDetail'
import KakaoMap      from './components/KakaoMap'
import ReportModal   from './components/ReportModal'
import SidebarFooter from './components/SidebarFooter'
import PolicyModal   from './components/PolicyModal'
import WelcomeModal, { shouldShowWelcome } from './components/WelcomeModal'
import NoticeBar from './components/NoticeBar'
import TodayGamesBar from './components/TodayGamesBar'
import { fetchVenues } from './api/venueApi'
import { fetchTodayGames } from './api/gamesApi'
import { sendEvent, EVENT } from './api/events'
import { useFavorites } from './hooks/useFavorites'
import './App.css'

function App() {
  const [activeFilter,     setActiveFilter]     = useState('ALL') // 'ALL'|'FAV'|<teamKey>
  const [keyword,          setKeyword]          = useState('')
  const [selectedVenue,    setSelectedVenue]    = useState(null)
  const [showReport,       setShowReport]       = useState(false)
  const [sidebarOpen,      setSidebarOpen]      = useState(() => window.innerWidth > 480)
  const [policyType,       setPolicyType]       = useState(null)
  const [showWelcome,      setShowWelcome]      = useState(shouldShowWelcome)

  // ── 가게 데이터 (API or mock) ────────────────────────────────
  const [venues,        setVenues]        = useState([])
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [venuesError,   setVenuesError]   = useState(null)
  const [todayGames,    setTodayGames]    = useState([])
  const [userLocation,     setUserLocation]     = useState(null)
  const [locating,         setLocating]         = useState(false)
  const [mapMoved,         setMapMoved]         = useState(false)
  const [showIncheon,      setShowIncheon]      = useState(false) // 인천 공공데이터 레이어
  const liveBoundsRef  = useRef(null)
  const [boundsFilter, setBoundsFilter] = useState(null)

  const swipeTouchY    = useRef(0)
  const swipeScrollTop = useRef(0)
  const sidebarBodyRef = useRef(null)

  // ── 팀별 등록 가게 수 / 가용 팀 (실제 데이터 기준) ─────────────
  const teamCounts = useMemo(() => {
    const m = {}
    venues.forEach(v => { m[v.team] = (m[v.team] || 0) + 1 })
    return m
  }, [venues])

  // ── 즐겨찾기 ─────────────────────────────────────────────
  const { favorites } = useFavorites()
  // 실제 존재하는 가게 중 즐겨찾기된 것만 (삭제된 가게 id는 제외)
  const favoriteVenues = useMemo(
    () => venues.filter(v => favorites.includes(v.id)),
    [venues, favorites]
  )

  // ── 필터 변경 (전체/찜/구단) ─────────────────────────────
  const handleFilterChange = useCallback((key) => {
    setActiveFilter(key)
    setSelectedVenue(null)
    setBoundsFilter(null)
    setMapMoved(false)
    if (key !== 'ALL' && key !== 'FAV') {
      sendEvent(EVENT.FILTER_TEAM, { team: key })
    }
  }, [])

  // ── 가게 선택 / 닫기 ─────────────────────────────────────
  const handleVenueSelect = useCallback((venue) => {
    setSelectedVenue(venue)
    setSidebarOpen(true)
    sendEvent(EVENT.VIEW_VENUE, { placeId: venue?.id, team: venue?.team })
  }, [])

  const handleVenueClose = useCallback(() => {
    setSelectedVenue(null)
  }, [])

  const handleVenueCloseAll = useCallback(() => {
    setSelectedVenue(null)
    setSidebarOpen(false)
  }, [])

  // ── 지도 bounds / 재검색 ──────────────────────────────────
  const handleBoundsChange = useCallback((bounds) => {
    liveBoundsRef.current = bounds
    setMapMoved(true)
  }, [])

  const handleReSearch = useCallback(() => {
    setBoundsFilter(liveBoundsRef.current)
    setMapMoved(false)
  }, [])

  // ── 바텀시트 스와이프 ────────────────────────────────────
  const onHandleTouchStart = useCallback((e) => {
    swipeTouchY.current = e.touches[0].clientY
  }, [])

  const onHandleTouchEnd = useCallback((e) => {
    const dy = e.changedTouches[0].clientY - swipeTouchY.current
    if      (dy >  40) setSidebarOpen(false)
    else if (dy < -40) setSidebarOpen(true)
  }, [])

  const onBodyTouchStart = useCallback((e) => {
    swipeTouchY.current    = e.touches[0].clientY
    swipeScrollTop.current = sidebarBodyRef.current?.scrollTop ?? 0
  }, [])

  const onBodyTouchEnd = useCallback((e) => {
    const dy = e.changedTouches[0].clientY - swipeTouchY.current
    if (dy > 60 && swipeScrollTop.current === 0) setSidebarOpen(false)
  }, [])

  // 필터/상세 전환 시 스크롤을 항상 맨 위로
  useEffect(() => {
    if (sidebarBodyRef.current) sidebarBodyRef.current.scrollTop = 0
  }, [activeFilter, selectedVenue])

  // ── 가게 목록 로드 ──────────────────────────────────────────
  useEffect(() => {
    fetchVenues()
      .then(data => { setVenues(data); setVenuesLoading(false) })
      .catch(err  => { console.error(err); setVenuesError(err.message); setVenuesLoading(false) })
  }, [])

  // ── 오늘의 KBO 경기 로드 (실패해도 앱 동작엔 영향 없음) ──────
  useEffect(() => {
    fetchTodayGames().then(setTodayGames).catch(() => {})
  }, [])

  // 팀별 오늘 경기 (한 팀은 하루 최대 1경기) — 카드 뱃지/가게 상세 연동용
  const gamesByTeam = useMemo(() => {
    const m = {}
    todayGames.forEach(g => {
      if (g.homeTeam) m[g.homeTeam] = g
      if (g.awayTeam) m[g.awayTeam] = g
    })
    return m
  }, [todayGames])

  // ── 분석 이벤트: 페이지 진입 1회 ─────────────────────────────
  useEffect(() => {
    sendEvent(EVENT.PAGE_VIEW)
  }, [])

  // ── 분석 이벤트: 검색어(디바운스 700ms, 2글자 이상만) ────────
  useEffect(() => {
    const kw = keyword.trim()
    if (kw.length < 2) return
    const timer = setTimeout(() => sendEvent(EVENT.SEARCH, { keyword: kw }), 700)
    return () => clearTimeout(timer)
  }, [keyword])

  // ── 앱 시작 시 위치 요청 ─────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않아요.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { alert('위치 정보를 가져올 수 없어요.\n위치 권한을 허용해주세요.'); setLocating(false) },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // 즐겨찾기 보기에서는 키워드/지도범위만 추가로 적용
  const filterByKwBounds = useCallback((list) => {
    let out = list
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      out = out.filter(v =>
        v.name.toLowerCase().includes(kw) || v.address.toLowerCase().includes(kw)
      )
    }
    if (boundsFilter) {
      out = out.filter(v =>
        v.lat >= boundsFilter.swLat && v.lat <= boundsFilter.neLat &&
        v.lng >= boundsFilter.swLng && v.lng <= boundsFilter.neLng
      )
    }
    return out
  }, [keyword, boundsFilter])

  // ── 필터링 ───────────────────────────────────────────────
  // 활성 필터 기준 가게 모음 (전체/찜/특정 구단)
  const baseVenues = useMemo(() => {
    if (activeFilter === 'FAV') return favoriteVenues
    if (activeFilter === 'ALL') return venues
    return venues.filter(v => v.team === activeFilter)
  }, [activeFilter, venues, favoriteVenues])

  // 목록 = 지도 (칩 + 검색어 + 지도범위 동일 적용)
  const listVenues = useMemo(() => filterByKwBounds(baseVenues), [filterByKwBounds, baseVenues])
  const mapVenues  = listVenues

  // 목록 헤더 라벨
  const filterLabel =
    activeFilter === 'ALL' ? '전체'
    : activeFilter === 'FAV' ? '⭐ 즐겨찾기'
    : activeFilter

  // 빈 상태 아이콘/문구 (찜 / 검색중 / 일반)
  const emptyState =
    activeFilter === 'FAV' ? { icon: '⭐', text: '즐겨찾기한 가게가 없어요', hint: '가게 카드의 하트를 눌러 추가해보세요' }
    : keyword.trim()       ? { icon: '🔍', text: '검색 결과가 없어요', hint: '다른 가게명이나 주소로 찾아보세요' }
    :                        { icon: '⚾', text: '등록된 가게가 없어요', hint: '곧 추가될 예정이에요' }

  // KakaoMap/리포트에 넘길 단일 팀값 (특정 구단 선택 시에만)
  const primaryTeam = (activeFilter !== 'ALL' && activeFilter !== 'FAV')
    ? activeFilter : null

  return (
    <div className="app">
      <Header onReport={() => setShowReport(true)} />
      <NoticeBar />
      {/* 오늘의 경기: NOTICE 전광판 바로 아래 풀폭 LED 스코어보드 한 줄 */}
      <TodayGamesBar games={todayGames} />

      <div className={`content${sidebarOpen ? '' : ' content--closed'}`}>
        <div className={`sidebarWrap${sidebarOpen ? '' : ' sidebarWrap--closed'}`}>
          <button
            className="sidebarHandle"
            onClick={() => setSidebarOpen(o => !o)}
            onTouchStart={onHandleTouchStart}
            onTouchEnd={onHandleTouchEnd}
          >
            <span className="sidebarHandleBar" />
          </button>

          <aside className="sidebar">
            {/* 검색 + 구단 필터 드롭다운 (상세 뷰만 제외) */}
            {!selectedVenue && (
              <div className="sidebarTop">
                <div className="filterRow">
                  <div className="filterRowSearch">
                    <SearchBar value={keyword} onChange={setKeyword} />
                  </div>
                  <TeamFilterDropdown
                    activeFilter={activeFilter}
                    onChange={handleFilterChange}
                    teamCounts={teamCounts}
                    favoritesCount={favoriteVenues.length}
                    totalCount={venues.length}
                  />
                </div>
              </div>
            )}

            <div
              className="sidebarBody"
              ref={sidebarBodyRef}
              onTouchStart={onBodyTouchStart}
              onTouchEnd={onBodyTouchEnd}
            >
              {selectedVenue ? (
                <VenueDetail
                  key={selectedVenue.id}
                  venue={selectedVenue}
                  todayGame={gamesByTeam[selectedVenue.team] ?? null}
                  onClose={handleVenueClose}
                  onCloseAll={handleVenueCloseAll}
                />
              ) : venuesLoading ? (
                <div className="venuesLoading">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="venueSkeleton">
                      <div className="skeletonThumb" />
                      <div className="skeletonBody">
                        <div className="skeletonLine skeletonTitle" />
                        <div className="skeletonLine skeletonSub" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : venuesError ? (
                <div className="venuesError">
                  <span>⚠️</span>
                  <p>가게 목록을 불러오지 못했어요</p>
                  <small>{venuesError}</small>
                  <button onClick={() => {
                    setVenuesLoading(true)
                    setVenuesError(null)
                    fetchVenues()
                      .then(data => { setVenues(data); setVenuesLoading(false) })
                      .catch(err  => { setVenuesError(err.message); setVenuesLoading(false) })
                  }}>다시 시도</button>
                </div>
              ) : (
                <VenueList
                  venues={listVenues}
                  selectedTeams={primaryTeam ? [primaryTeam] : []}
                  onSelect={handleVenueSelect}
                  title={filterLabel}
                  emptyIcon={emptyState.icon}
                  emptyText={emptyState.text}
                  emptyHint={emptyState.hint}
                />
              )}
            </div>

            <SidebarFooter onPolicy={setPolicyType} />
          </aside>
        </div>

        <button
          className="sidebarToggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? '닫기' : '열기'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        <div className="mapArea">
          <button
            className={`reSearchBtn${mapMoved ? ' reSearchBtn--visible' : ''}`}
            onClick={handleReSearch}
          >
            ↺ 이 지역 재검색
          </button>

          <KakaoMap
            venues={mapVenues}
            selectedTeam={primaryTeam}
            selectedVenue={selectedVenue}
            onVenueClick={handleVenueSelect}
            userLocation={userLocation}
            onBoundsChange={handleBoundsChange}
            sidebarOpen={sidebarOpen}
            showIncheonLayer={showIncheon}
          />

          <button
            className={`incheonBtn${showIncheon ? ' incheonBtn--on' : ''}`}
            onClick={() => setShowIncheon(v => !v)}
            title="인천 교통·주차 정보 (인천시 공공데이터)"
          >
            🚉
          </button>

          <button
            className={`locateBtn${locating ? ' locateBtn--locating' : ''}`}
            onClick={handleLocate}
            disabled={locating}
            title="내 위치로 이동"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>

        </div>
      </div>

      {showReport && (
        <ReportModal
          selectedTeam={primaryTeam || '전체'}
          onClose={() => setShowReport(false)}
        />
      )}

      {policyType && (
        <PolicyModal
          type={policyType}
          onClose={() => setPolicyType(null)}
        />
      )}

      {showWelcome && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}
    </div>
  )
}

export default App
