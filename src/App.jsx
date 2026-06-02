import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Header        from './components/Header'
import SearchBar     from './components/SearchBar'
import TeamSelector  from './components/TeamSelector'
import VenueList     from './components/VenueList'
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
import { TEAMS, MIXED_TEAM, isMixedTeam } from './data/teams'
import './App.css'

// 주어진 팀 집합 + 키워드 + 지도범위로 가게를 거른다 (목록/지도 공용)
function selectVenues(venues, teams, availableTeams, mixedCount, keyword, boundsFilter) {
  const mixedOn = teams.includes(MIXED_TEAM) && mixedCount > 0
  const teamOn  = teams.some(t => availableTeams.includes(t))
  if (!teamOn && !mixedOn) return []
  let list = venues.filter(v => {
    if (isMixedTeam(v.team)) return mixedOn
    return teams.includes(v.team) && availableTeams.includes(v.team)
  })
  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    list = list.filter(v =>
      v.name.toLowerCase().includes(kw) ||
      v.address.toLowerCase().includes(kw)
    )
  }
  if (boundsFilter) {
    list = list.filter(v =>
      v.lat >= boundsFilter.swLat && v.lat <= boundsFilter.neLat &&
      v.lng >= boundsFilter.swLng && v.lng <= boundsFilter.neLng
    )
  }
  return list
}

function App() {
  // 초기값: 가게 데이터 로드 후 가용 팀 자동 선택 (아래 effect)
  const [selectedTeams,    setSelectedTeams]    = useState([])  // 구단선택 화면의 체크 상태(기억됨)
  const [viewTeams,        setViewTeams]        = useState([])  // 목록/지도에 실제로 보여줄 팀(목록보기로 진입 시)
  const [showTeamSelector, setShowTeamSelector] = useState(true)
  const [favView,          setFavView]          = useState(false) // 즐겨찾기만 보기
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
  const liveBoundsRef  = useRef(null)
  const [boundsFilter, setBoundsFilter] = useState(null)

  const swipeTouchY    = useRef(0)
  const swipeScrollTop = useRef(0)
  const sidebarBodyRef = useRef(null)
  const teamsInitedRef = useRef(false)

  // ── 팀별 등록 가게 수 / 가용 팀 (실제 데이터 기준) ─────────────
  const teamCounts = useMemo(() => {
    const m = {}
    venues.forEach(v => { m[v.team] = (m[v.team] || 0) + 1 })
    return m
  }, [venues])

  const availableTeams = useMemo(
    () => TEAMS.filter(t => (teamCounts[t.key] || 0) > 0).map(t => t.key),
    [teamCounts]
  )

  // 혼합 응원(특정 구단 전용 아님) 가게 수
  const mixedCount = useMemo(
    () => venues.filter(v => isMixedTeam(v.team)).length,
    [venues]
  )

  // ── 즐겨찾기 ─────────────────────────────────────────────
  const { favorites } = useFavorites()
  // 실제 존재하는 가게 중 즐겨찾기된 것만 (삭제된 가게 id는 제외)
  const favoriteVenues = useMemo(
    () => venues.filter(v => favorites.includes(v.id)),
    [venues, favorites]
  )

  // 데이터 첫 로드 시 가용 팀(+혼합) 전체 선택 (1회)
  useEffect(() => {
    if (!teamsInitedRef.current && (availableTeams.length > 0 || mixedCount > 0)) {
      setSelectedTeams([...availableTeams, ...(mixedCount > 0 ? [MIXED_TEAM] : [])])
      teamsInitedRef.current = true
    }
  }, [availableTeams, mixedCount])

  // 목록의 포커스 팀: 구단선택 화면=체크된 팀, 목록 화면=목록보기로 들어온 팀
  const focusTeams  = showTeamSelector ? selectedTeams : viewTeams

  // ── 팀 토글 ──────────────────────────────────────────────
  const handleTeamToggle = useCallback((teamKey) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamKey)) return prev.filter(t => t !== teamKey)
      return [...prev, teamKey]
    })
  }, [])

  const handleShowSelector  = useCallback(() => {
    setShowTeamSelector(true)
    setSelectedVenue(null)
    setFavView(false)
  }, [])

  const handleHideSelector = useCallback((teamKey) => {
    // "목록 보기"로 특정 구단을 콕 집어 들어온 경우 → 그 구단만 표시
    // 체크 상태(selectedTeams)는 건드리지 않고 viewTeams만 바꿔 체크를 기억
    if (typeof teamKey === 'string') {
      setViewTeams([teamKey])
      sendEvent(EVENT.FILTER_TEAM, { team: teamKey })
    }
    setFavView(false)
    setShowTeamSelector(false)
    setKeyword('')
    setBoundsFilter(null)
    setMapMoved(false)
  }, [])

  // 즐겨찾기 목록으로 진입
  const handleShowFavorites = useCallback(() => {
    setFavView(true)
    setShowTeamSelector(false)
    setSelectedVenue(null)
    setKeyword('')
    setBoundsFilter(null)
    setMapMoved(false)
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

  // 화면 전환(구단선택 ↔ 목록 ↔ 상세) 시 스크롤을 항상 맨 위로
  useEffect(() => {
    if (sidebarBodyRef.current) sidebarBodyRef.current.scrollTop = 0
  }, [showTeamSelector, selectedVenue])

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
  // 목록: 즐겨찾기 보기면 즐겨찾기만, 아니면 포커스 팀(목록보기로 들어온 팀)만
  const listVenues = useMemo(
    () => favView
      ? filterByKwBounds(favoriteVenues)
      : selectVenues(venues, focusTeams, availableTeams, mixedCount, keyword, boundsFilter),
    [favView, filterByKwBounds, favoriteVenues, venues, focusTeams, availableTeams, mixedCount, keyword, boundsFilter]
  )

  // 지도: 즐겨찾기 보기면 즐겨찾기만, 아니면 체크된 팀 전체(+현재 보고 있는 팀)
  const mapVenues = useMemo(() => {
    if (favView) return filterByKwBounds(favoriteVenues)
    const teams = showTeamSelector
      ? selectedTeams
      : Array.from(new Set([...selectedTeams, ...viewTeams]))
    return selectVenues(venues, teams, availableTeams, mixedCount, keyword, boundsFilter)
  }, [favView, filterByKwBounds, favoriteVenues, venues, showTeamSelector, selectedTeams, viewTeams, availableTeams, mixedCount, keyword, boundsFilter])

  // KakaoMap/리포트에 넘길 단일 팀값 (포커스 팀이 하나면 그 팀, 아니면 null)
  const primaryTeam = focusTeams.length === 1 ? focusTeams[0] : null

  return (
    <div className="app">
      <Header onReport={() => setShowReport(true)} />
      <NoticeBar />

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
            {/* 오늘의 경기 바: 상세 화면 제외하고 상단 노출 */}
            {!selectedVenue && <TodayGamesBar games={todayGames} />}

            {/* 검색바: 목록 뷰에서만 */}
            {!showTeamSelector && !selectedVenue && (
              <div className="sidebarTop">
                <SearchBar value={keyword} onChange={setKeyword} />
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
              ) : showTeamSelector ? (
                <TeamSelector
                  selectedTeams={selectedTeams}
                  onToggle={handleTeamToggle}
                  onConfirm={handleHideSelector}
                  counts={teamCounts}
                  availableTeams={availableTeams}
                  mixedCount={mixedCount}
                  favoritesCount={favoriteVenues.length}
                  onShowFavorites={handleShowFavorites}
                  gamesByTeam={gamesByTeam}
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
                  selectedTeams={viewTeams}
                  onSelect={handleVenueSelect}
                  onOpenSelector={handleShowSelector}
                  title={favView ? '⭐ 즐겨찾기' : undefined}
                  emptyText={favView ? '즐겨찾기한 가게가 없어요' : undefined}
                  emptyHint={favView ? '가게 카드의 하트를 눌러 추가해보세요' : undefined}
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
          />

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
