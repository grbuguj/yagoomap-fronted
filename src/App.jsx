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
import { fetchVenues } from './api/venueApi'
import { TEAMS } from './data/teams'
import './App.css'

function App() {
  // 초기값: 가게 데이터 로드 후 가용 팀 자동 선택 (아래 effect)
  const [selectedTeams,    setSelectedTeams]    = useState([])
  const [showTeamSelector, setShowTeamSelector] = useState(true)
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

  // 데이터 첫 로드 시 가용 팀 전체 선택 (1회)
  useEffect(() => {
    if (!teamsInitedRef.current && availableTeams.length > 0) {
      setSelectedTeams(availableTeams)
      teamsInitedRef.current = true
    }
  }, [availableTeams])

  const isAvailable = selectedTeams.some(t => availableTeams.includes(t))

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
  }, [])

  const handleHideSelector = useCallback(() => {
    setShowTeamSelector(false)
    setKeyword('')
    setBoundsFilter(null)
    setMapMoved(false)
  }, [])

  // ── 가게 선택 / 닫기 ─────────────────────────────────────
  const handleVenueSelect = useCallback((venue) => {
    setSelectedVenue(venue)
    setSidebarOpen(true)
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

  // ── 가게 목록 로드 ──────────────────────────────────────────
  useEffect(() => {
    fetchVenues()
      .then(data => { setVenues(data); setVenuesLoading(false) })
      .catch(err  => { console.error(err); setVenuesError(err.message); setVenuesLoading(false) })
  }, [])

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

  // ── 필터링 ───────────────────────────────────────────────
  const filteredVenues = useMemo(() => {
    if (!isAvailable) return []
    let list = venues.filter(v => selectedTeams.includes(v.team) && availableTeams.includes(v.team))
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
  }, [venues, selectedTeams, isAvailable, availableTeams, keyword, boundsFilter])

  // KakaoMap에 넘길 단일 팀값 (첫 번째 선택 팀 or null)
  const primaryTeam = selectedTeams.length === 1 ? selectedTeams[0] : null

  return (
    <div className="app">
      <Header onReport={() => setShowReport(true)} />

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
                  venues={filteredVenues}
                  selectedTeams={selectedTeams}
                  onSelect={handleVenueSelect}
                  onOpenSelector={handleShowSelector}
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
            venues={filteredVenues}
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
