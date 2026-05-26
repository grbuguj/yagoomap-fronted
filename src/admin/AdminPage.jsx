import { useState } from 'react'
import styles from './AdminPage.module.css'
import {
  MOCK_DASHBOARD,
  MOCK_REPORTS,
  MOCK_CANDIDATES,
  MOCK_PLACES,
  MOCK_KAKAO_RESULTS,
  TEAMS,
} from './mockData'

const TABS = ['대시보드', '제보 관리', '검수 후보', '카카오 검색', '장소 관리']

const STATUS_LABEL = {
  PENDING:   { label: '대기중',  cls: 'badgePending' },
  APPROVED:  { label: '승인',    cls: 'badgeApproved' },
  REJECTED:  { label: '반려',    cls: 'badgeRejected' },
  ACTIVE:    { label: '활성',    cls: 'badgeActive' },
  INACTIVE:  { label: '비활성', cls: 'badgeInactive' },
  DUPLICATE: { label: '중복',    cls: 'badgeDuplicate' },
}

function Badge({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'badgePending' }
  return <span className={`${styles.badge} ${styles[s.cls]}`}>{s.label}</span>
}

function formatDate(iso) {
  return iso ? iso.replace('T', ' ').slice(0, 16) : '-'
}

/* ────────────────────────────────────────────────
   장소 등록/수정 모달
──────────────────────────────────────────────── */
const EMPTY_FORM = {
  name: '', address: '', teamId: 1, team: 'LG 트윈스',
  category: '술집', phone: '', instagramUrl: '',
  naverMapUrl: '', note: '', tags: '', status: 'ACTIVE',
}

function PlaceModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const isEdit = !!initial

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleTeam = (e) => {
    const found = TEAMS.find(t => t.teamId === Number(e.target.value))
    setForm(f => ({ ...f, teamId: found.teamId, team: found.team }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>{isEdit ? '장소 수정' : '장소 등록'}</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>가게명 *</label>
              <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="예) 트윈스포차" />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>주소 *</label>
              <input className={styles.input} value={form.address} onChange={e => set('address', e.target.value)} required placeholder="예) 서울 송파구 잠실동 123-45" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>구단 *</label>
              <select className={styles.select} value={form.teamId} onChange={handleTeam}>
                {TEAMS.map(t => <option key={t.teamId} value={t.teamId}>{t.team}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>카테고리</label>
              <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                {['술집', '치킨', '호프', '맥주', '스포츠바', '기타'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>전화번호</label>
              <input className={styles.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="02-1234-5678" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>상태</label>
              <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>인스타그램 URL</label>
              <input className={styles.input} value={form.instagramUrl} onChange={e => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>네이버 지도 URL</label>
              <input className={styles.input} value={form.naverMapUrl} onChange={e => set('naverMapUrl', e.target.value)} placeholder="https://map.naver.com/..." />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>태그 (쉼표로 구분)</label>
              <input className={styles.input} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="야구중계, TV보유, 단체가능" />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>메모</label>
              <textarea className={styles.textarea} value={form.note} onChange={e => set('note', e.target.value)} placeholder="운영 관련 메모" />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>취소</button>
            <button type="submit" className={styles.btnSubmit}>{isEdit ? '수정 완료' : '등록'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   확인 모달 (삭제 등)
──────────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.confirmModal}>
        <div className={styles.confirmText}>{message}</div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>취소</button>
          <button className={styles.btnReject} onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   대시보드
──────────────────────────────────────────────── */
function Dashboard() {
  const d = MOCK_DASHBOARD
  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 장소</div>
          <div className={styles.statValue}>{d.placeCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>대기 중인 제보</div>
          <div className={`${styles.statValue} ${d.pendingReportCount > 0 ? styles.statValueAlert : ''}`}>
            {d.pendingReportCount}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 제보</div>
          <div className={styles.statValue}>{d.reportCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 리뷰</div>
          <div className={styles.statValue}>{d.reviewCount}</div>
        </div>
      </div>

      <div className={styles.mb24}>
        <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>최근 등록 장소</div>
        <table className={styles.table}>
          <thead>
            <tr><th>가게명</th><th>구단</th><th>상태</th><th>등록일</th></tr>
          </thead>
          <tbody>
            {d.recentPlaces.map(p => (
              <tr key={p.id}>
                <td><b>{p.name}</b></td>
                <td>{p.team}</td>
                <td><Badge status={p.status} /></td>
                <td>{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>대기 중인 제보</div>
      <table className={styles.table}>
        <thead>
          <tr><th>가게명</th><th>구단</th><th>내용</th><th>제보일</th></tr>
        </thead>
        <tbody>
          {MOCK_REPORTS.filter(r => r.status === 'PENDING').map(r => (
            <tr key={r.id}>
              <td><b>{r.placeName}</b></td>
              <td>{r.team}</td>
              <td><div className={styles.ellipsis}>{r.content}</div></td>
              <td>{formatDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/* ────────────────────────────────────────────────
   제보 관리
──────────────────────────────────────────────── */
function ReportManagement() {
  const [list, setList] = useState(MOCK_REPORTS)

  const handle = (id, action) =>
    setList(prev => prev.map(r => r.id === id
      ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
      : r
    ))

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>사용자 제보 목록</div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>가게명</th><th>주소</th><th>구단</th><th>내용</th><th>참고링크</th><th>제보일</th><th>상태</th><th>처리</th></tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td><b>{r.placeName}</b></td>
                <td>{r.address}</td>
                <td>{r.team}</td>
                <td><div className={styles.ellipsis} title={r.content}>{r.content}</div></td>
                <td>
                  {r.referenceLink
                    ? <a href={r.referenceLink} target="_blank" rel="noreferrer" className={styles.link}>링크 ↗</a>
                    : '-'}
                </td>
                <td>{formatDate(r.createdAt)}</td>
                <td><Badge status={r.status} /></td>
                <td>
                  {r.status === 'PENDING'
                    ? <div className={styles.btnRow}>
                        <button className={styles.btnApprove} onClick={() => handle(r.id, 'approve')}>승인</button>
                        <button className={styles.btnReject} onClick={() => handle(r.id, 'reject')}>반려</button>
                      </div>
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────
   검수 후보
──────────────────────────────────────────────── */
function CandidateManagement() {
  const [list, setList] = useState(MOCK_CANDIDATES)
  const [showForm, setShowForm] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', address: '', note: '' })

  const handle = (id, action) =>
    setList(prev => prev.map(c => c.id === id
      ? { ...c, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
      : c
    ))

  const handleManualAdd = (e) => {
    e.preventDefault()
    const newItem = { id: Date.now(), ...manualForm, phone: '', categoryName: '', mapLink: '', status: 'PENDING', createdAt: new Date().toISOString() }
    setList(prev => [newItem, ...prev])
    setManualForm({ name: '', address: '', note: '' })
    setShowForm(false)
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>검수 후보 목록</div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(v => !v)}>
          {showForm ? '닫기' : '+ 수동 등록'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleManualAdd} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className={styles.formGroup} style={{ flex: '1 1 160px' }}>
            <label className={styles.label}>가게명 *</label>
            <input className={styles.input} value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} required placeholder="가게명" />
          </div>
          <div className={styles.formGroup} style={{ flex: '2 1 240px' }}>
            <label className={styles.label}>주소 *</label>
            <input className={styles.input} value={manualForm.address} onChange={e => setManualForm(f => ({ ...f, address: e.target.value }))} required placeholder="주소" />
          </div>
          <button type="submit" className={styles.btnApprove}>저장</button>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>가게명</th><th>주소</th><th>카테고리</th><th>전화번호</th><th>지도</th><th>등록일</th><th>상태</th><th>처리</th></tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id}>
                <td><b>{c.name}</b></td>
                <td>{c.roadAddress || c.address}</td>
                <td>{c.categoryName?.split(' > ').pop() || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>
                  {c.mapLink
                    ? <a href={c.mapLink} target="_blank" rel="noreferrer" className={styles.link}>카카오맵 ↗</a>
                    : '-'}
                </td>
                <td>{formatDate(c.createdAt)}</td>
                <td><Badge status={c.status} /></td>
                <td>
                  {c.status === 'PENDING'
                    ? <div className={styles.btnRow}>
                        <button className={styles.btnApprove} onClick={() => handle(c.id, 'approve')}>승인</button>
                        <button className={styles.btnReject} onClick={() => handle(c.id, 'reject')}>반려</button>
                      </div>
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────
   카카오 검색
──────────────────────────────────────────────── */
function KakaoSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [saved, setSaved] = useState(new Set())

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setResults(MOCK_KAKAO_RESULTS) // TODO: 실제 API 연동
    setSearched(true)
  }

  const handleSave = (sourceId) => {
    setSaved(prev => new Set([...prev, sourceId]))
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>카카오 장소 검색</div>
      </div>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="예) 잠실 야구 중계 술집"
        />
        <button type="submit" className={styles.btnPrimary}>검색</button>
      </form>

      {searched && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>가게명</th><th>주소</th><th>카테고리</th><th>전화번호</th><th>거리</th><th>지도</th><th>상태</th><th>후보 저장</th></tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.sourceId}>
                  <td><b>{r.name}</b></td>
                  <td>{r.roadAddress || r.address}</td>
                  <td>{r.categoryName?.split(' > ').pop()}</td>
                  <td>{r.phone || '-'}</td>
                  <td>{r.distanceMeters}m</td>
                  <td>
                    <a href={r.mapLink} target="_blank" rel="noreferrer" className={styles.link}>카카오맵 ↗</a>
                  </td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    {r.status === 'DUPLICATE'
                      ? <span style={{ fontSize: 12, color: '#9ca3af' }}>중복</span>
                      : saved.has(r.sourceId)
                        ? <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>저장됨</span>
                        : <button className={styles.btnSave} onClick={() => handleSave(r.sourceId)}>후보 저장</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searched && (
        <div className={styles.empty}>키워드를 입력하고 검색하면 카카오맵 결과가 표시됩니다</div>
      )}
    </>
  )
}

/* ────────────────────────────────────────────────
   장소 관리
──────────────────────────────────────────────── */
function PlaceManagement() {
  const [list, setList] = useState(MOCK_PLACES)
  const [modal, setModal] = useState(null) // null | 'add' | place 객체
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleAdd = (form) => {
    setList(prev => [{ ...form, id: Date.now(), rating: 0, reviewCount: 0 }, ...prev])
    setModal(null)
  }

  const handleEdit = (form) => {
    setList(prev => prev.map(p => p.id === form.id ? { ...p, ...form } : p))
    setModal(null)
  }

  const handleDelete = (id) => {
    setList(prev => prev.filter(p => p.id !== id))
    setDeleteTarget(null)
  }

  const openEdit = (place) => {
    setModal({ ...place, tags: Array.isArray(place.tags) ? place.tags.join(', ') : (place.tags || '') })
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>전체 장소 목록</div>
        <button className={styles.btnPrimary} onClick={() => setModal('add')}>+ 장소 등록</button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>가게명</th><th>구단</th><th>주소</th><th>카테고리</th><th>전화번호</th><th>평점</th><th>리뷰</th><th>상태</th><th>관리</th></tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><b>{p.name}</b></td>
                <td>{p.team}</td>
                <td><div className={styles.ellipsis}>{p.address}</div></td>
                <td>{p.category}</td>
                <td>{p.phone || '-'}</td>
                <td>⭐ {p.rating}</td>
                <td>{p.reviewCount}개</td>
                <td><Badge status={p.status} /></td>
                <td>
                  <div className={styles.btnRow}>
                    <button className={styles.btnEdit} onClick={() => openEdit(p)}>수정</button>
                    <button className={styles.btnDelete} onClick={() => setDeleteTarget(p)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'add' && (
        <PlaceModal onClose={() => setModal(null)} onSubmit={handleAdd} />
      )}
      {modal && modal !== 'add' && (
        <PlaceModal initial={modal} onClose={() => setModal(null)} onSubmit={handleEdit} />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`"${deleteTarget.name}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

/* ────────────────────────────────────────────────
   메인
──────────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab] = useState(0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>⚾ 야구맵 관리자</span>
        <span className={styles.headerBadge}>ADMIN</span>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className={styles.body}>
        {tab === 0 && <Dashboard />}
        {tab === 1 && <ReportManagement />}
        {tab === 2 && <CandidateManagement />}
        {tab === 3 && <KakaoSearch />}
        {tab === 4 && <PlaceManagement />}
      </main>
    </div>
  )
}
