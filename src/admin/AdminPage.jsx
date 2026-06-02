import { useState, useEffect, useCallback, useMemo } from 'react'
import styles from './AdminPage.module.css'
import {
  fetchDashboard,
  fetchReports,
  approveReport,
  rejectReport,
  fetchCandidates,
  registerCandidate,
  approveCandidate,
  rejectCandidate,
  searchKakaoPlaces,
  collectKakaoPlaces,
  fetchAdminPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  fetchPlaceReviews,
  deleteReview,
  fetchTeams,
  fetchStats,
  fetchHealth,
  fetchInfo,
  fetchNotice,
  updateNotice,
} from '../api/adminApi'

const TABS = ['대시보드', '통계', '제보 관리', '검수 후보', '카카오 검색', '장소 관리', '리뷰 관리', '공지사항']

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

/* 공통 상태 표시 ─────────────────────────────────────── */
function Loading() {
  return <div className={styles.empty}>불러오는 중…</div>
}
function ErrorBox({ message, onRetry }) {
  return (
    <div className={styles.empty}>
      <p>⚠️ 데이터를 불러오지 못했어요</p>
      <small style={{ color: '#9ca3af' }}>{message}</small>
      {onRetry && <div style={{ marginTop: 12 }}><button className={styles.btnPrimary} onClick={onRetry}>다시 시도</button></div>}
    </div>
  )
}

/* ────────────────────────────────────────────────
   반려 사유 모달
──────────────────────────────────────────────── */
function RejectModal({ title, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>{title ?? '반려 처리'}</div>
        <div className={styles.formGroupFull}>
          <label className={styles.label}>반려 사유</label>
          <textarea className={styles.textarea} value={reason} onChange={e => setReason(e.target.value)} placeholder="반려 사유를 입력하세요 (선택)" />
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>취소</button>
          <button type="button" className={styles.btnReject} onClick={() => onConfirm(reason)}>반려</button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   승인 모달 (제보/후보 → 장소 등록)
   제보: lat/lng 직접 입력 필요 / 후보: lat/lng 자동 채움
──────────────────────────────────────────────── */
function ApproveModal({ title, initial, teams, withNoteTags, onConfirm, onClose }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // 드롭다운에 없는 사전선택 구단(예: 제보의 teamId)도 잃지 않도록 옵션에 합류
  const teamOptions = useMemo(() => {
    if (form.teamId != null && !teams.some(t => t.teamId === form.teamId)) {
      return [{ teamId: form.teamId, team: form.team || `구단 #${form.teamId}` }, ...teams]
    }
    return teams
  }, [teams, form.teamId, form.team])

  const handleTeam = (e) => {
    const found = teamOptions.find(t => t.teamId === Number(e.target.value))
    setForm(f => ({ ...f, teamId: found?.teamId ?? null, team: found?.team ?? '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      address: form.address,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      teamId: form.teamId,
      team: form.team,
    }
    if (withNoteTags) {
      payload.note = form.note || null
      payload.tags = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    }
    onConfirm(payload)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>{title}</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>가게명 *</label>
              <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>주소 *</label>
              <input className={styles.input} value={form.address} onChange={e => set('address', e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>위도 (latitude) *</label>
              <input className={styles.input} type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} required placeholder="37.5121" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>경도 (longitude) *</label>
              <input className={styles.input} type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} required placeholder="127.0718" />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>구단 *</label>
              <select className={styles.select} value={form.teamId ?? ''} onChange={handleTeam} required>
                <option value="" disabled>구단 선택</option>
                {teamOptions.map(t => <option key={t.teamId} value={t.teamId}>{t.team}</option>)}
              </select>
            </div>
            {withNoteTags && (
              <>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>태그 (쉼표로 구분)</label>
                  <input className={styles.input} value={form.tags || ''} onChange={e => set('tags', e.target.value)} placeholder="야구중계, TV보유" />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>메모</label>
                  <textarea className={styles.textarea} value={form.note || ''} onChange={e => set('note', e.target.value)} />
                </div>
              </>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>취소</button>
            <button type="submit" className={styles.btnApprove}>승인 등록</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   장소 등록/수정 모달
──────────────────────────────────────────────── */
function emptyPlaceForm(teams) {
  const first = teams[0] ?? { teamId: null, team: '' }
  return {
    name: '', address: '', latitude: '', longitude: '',
    teamId: first.teamId, team: first.team,
    category: '술집', phone: '', instagramUrl: '',
    naverMapUrl: '', note: '', tags: '', status: 'ACTIVE',
  }
}

function PlaceModal({ initial, teams, onClose, onSubmit }) {
  const [form, setForm] = useState(initial ?? emptyPlaceForm(teams))
  const isEdit = !!initial?.id

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // 수정 대상의 구단이 드롭다운(현재 LG만)에 없어도 유지
  const teamOptions = useMemo(() => {
    if (form.teamId != null && !teams.some(t => t.teamId === form.teamId)) {
      return [{ teamId: form.teamId, team: form.team || `구단 #${form.teamId}` }, ...teams]
    }
    return teams
  }, [teams, form.teamId, form.team])

  const handleTeam = (e) => {
    const found = teamOptions.find(t => t.teamId === Number(e.target.value))
    setForm(f => ({ ...f, teamId: found?.teamId ?? null, team: found?.team ?? '' }))
  }

  // 빈 값/NaN 은 payload 에서 제외 → 수정 시 좌표 등을 null 로 덮어쓰지 않음
  // (admin 목록 응답엔 lat/lng/category/phone 이 없어 모달이 비어있을 수 있음)
  const num = (v) => {
    if (v === '' || v == null) return undefined
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      latitude: num(form.latitude),
      longitude: num(form.longitude),
      tags: (typeof form.tags === 'string' ? form.tags : '').split(',').map(t => t.trim()).filter(Boolean),
    })
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
              <label className={styles.label}>위도 (latitude)</label>
              <input className={styles.input} type="number" step="any" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value)} placeholder="37.5121" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>경도 (longitude)</label>
              <input className={styles.input} type="number" step="any" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value)} placeholder="127.0718" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>구단 *</label>
              <select className={styles.select} value={form.teamId ?? ''} onChange={handleTeam} required>
                <option value="" disabled>구단 선택</option>
                {teamOptions.map(t => <option key={t.teamId} value={t.teamId}>{t.team}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>카테고리</label>
              <input className={styles.input} value={form.category ?? ''} onChange={e => set('category', e.target.value)} placeholder="예) 포차, 펍, 술집, 치킨" list="category-options" />
              <datalist id="category-options">
                {['술집', '포차', '펍', '치킨', '호프', '맥주', '바', '스포츠바', '기타'].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>전화번호</label>
              <input className={styles.input} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="02-1234-5678" />
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
              <input className={styles.input} value={form.instagramUrl ?? ''} onChange={e => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>네이버 지도 URL</label>
              <input className={styles.input} value={form.naverMapUrl ?? ''} onChange={e => set('naverMapUrl', e.target.value)} placeholder="https://map.naver.com/..." />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>태그 (쉼표로 구분)</label>
              <input className={styles.input} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="야구중계, TV보유, 단체가능" />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>메모</label>
              <textarea className={styles.textarea} value={form.note ?? ''} onChange={e => set('note', e.target.value)} placeholder="운영 관련 메모" />
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
  const [data, setData] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchDashboard(),
      fetchReports({ status: 'PENDING' }).catch(() => []),
    ])
      .then(([d, p]) => { setData(d); setPending(Array.isArray(p) ? p : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDashboard(),
      fetchReports({ status: 'PENDING' }).catch(() => []),
    ])
      .then(([d, p]) => { if (active) { setData(d); setPending(Array.isArray(p) ? p : []); setLoading(false) } })
      .catch(err => { if (active) { setError(err.message); setLoading(false) } })
    return () => { active = false }
  }, [])

  if (loading) return <Loading />
  if (error)   return <ErrorBox message={error} onRetry={load} />
  if (!data)   return null

  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 장소</div>
          <div className={styles.statValue}>{data.placeCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>대기 중인 제보</div>
          <div className={`${styles.statValue} ${data.pendingReportCount > 0 ? styles.statValueAlert : ''}`}>
            {data.pendingReportCount}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 제보</div>
          <div className={styles.statValue}>{data.reportCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체 리뷰</div>
          <div className={styles.statValue}>{data.reviewCount}</div>
        </div>
      </div>

      <div className={styles.mb24}>
        <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>최근 등록 장소</div>
        <table className={styles.table}>
          <thead>
            <tr><th>가게명</th><th>구단</th><th>상태</th><th>등록일</th></tr>
          </thead>
          <tbody>
            {(data.recentPlaces ?? []).map(p => (
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
          {pending.map(r => (
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
function ReportManagement({ teams }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchReports()
      .then(data => { setList(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    let active = true
    fetchReports()
      .then(data => { if (active) { setList(Array.isArray(data) ? data : []); setLoading(false) } })
      .catch(err => { if (active) { setError(err.message); setLoading(false) } })
    return () => { active = false }
  }, [])

  const doApprove = async (payload) => {
    setBusy(true)
    try {
      await approveReport(approveTarget.id, payload)
      setApproveTarget(null)
      load()
    } catch (err) {
      alert(`승인 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async (reason) => {
    setBusy(true)
    try {
      await rejectReport(rejectTarget.id, reason)
      setRejectTarget(null)
      load()
    } catch (err) {
      alert(`반려 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>사용자 제보 목록</div>
        <button className={styles.btnPrimary} onClick={load} disabled={loading}>새로고침</button>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>가게명</th><th>주소</th><th>구단</th><th>내용</th><th>참고링크</th><th>제보일</th><th>상태</th><th>처리</th></tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className={styles.empty}>제보가 없습니다</td></tr>}
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
                          <button className={styles.btnApprove} onClick={() => setApproveTarget(r)}>승인</button>
                          <button className={styles.btnReject} onClick={() => setRejectTarget(r)}>반려</button>
                        </div>
                      : r.status === 'REJECTED' && r.rejectReason
                        ? <span title={r.rejectReason} style={{ fontSize: 12, color: '#9ca3af' }}>사유 보기</span>
                        : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approveTarget && (
        <ApproveModal
          title="제보 승인 → 장소 등록"
          teams={teams}
          initial={{
            name: approveTarget.placeName ?? '',
            address: approveTarget.address ?? '',
            latitude: '', longitude: '',
            teamId: approveTarget.teamId ?? (teams[0]?.teamId ?? null),
            team: approveTarget.team ?? (teams[0]?.team ?? ''),
          }}
          onConfirm={busy ? () => {} : doApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          title={`"${rejectTarget.placeName}" 제보 반려`}
          onConfirm={busy ? () => {} : doReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  )
}

/* ────────────────────────────────────────────────
   검수 후보
──────────────────────────────────────────────── */
function CandidateManagement({ teams }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', address: '', note: '' })
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchCandidates()
      .then(data => { setList(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    let active = true
    fetchCandidates()
      .then(data => { if (active) { setList(Array.isArray(data) ? data : []); setLoading(false) } })
      .catch(err => { if (active) { setError(err.message); setLoading(false) } })
    return () => { active = false }
  }, [])

  const handleManualAdd = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await registerCandidate({
        name: manualForm.name,
        address: manualForm.address,
      })
      setManualForm({ name: '', address: '', note: '' })
      setShowForm(false)
      load()
    } catch (err) {
      alert(`등록 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const doApprove = async (payload) => {
    setBusy(true)
    try {
      await approveCandidate(approveTarget.id, payload)
      setApproveTarget(null)
      load()
    } catch (err) {
      alert(`승인 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async (reason) => {
    setBusy(true)
    try {
      await rejectCandidate(rejectTarget.id, reason)
      setRejectTarget(null)
      load()
    } catch (err) {
      alert(`반려 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>검수 후보 목록</div>
        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={load} disabled={loading}>새로고침</button>
          <button className={styles.btnPrimary} onClick={() => setShowForm(v => !v)}>
            {showForm ? '닫기' : '+ 수동 등록'}
          </button>
        </div>
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
          <button type="submit" className={styles.btnApprove} disabled={busy}>저장</button>
        </form>
      )}

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>가게명</th><th>주소</th><th>카테고리</th><th>전화번호</th><th>지도</th><th>수집일</th><th>상태</th><th>처리</th></tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className={styles.empty}>검수 후보가 없습니다</td></tr>}
              {list.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.roadAddress || c.address}</td>
                  <td>{c.categoryName?.split(' > ').pop() || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    {c.mapLink
                      ? <a href={c.mapLink} target="_blank" rel="noreferrer" className={styles.link}>카카오맵 ↗</a>
                      : c.sourceUrl
                        ? <a href={c.sourceUrl} target="_blank" rel="noreferrer" className={styles.link}>출처 ↗</a>
                        : '-'}
                  </td>
                  <td>{formatDate(c.collectedAt || c.createdAt)}</td>
                  <td><Badge status={c.status} /></td>
                  <td>
                    {c.status === 'PENDING'
                      ? <div className={styles.btnRow}>
                          <button className={styles.btnApprove} onClick={() => setApproveTarget(c)}>승인</button>
                          <button className={styles.btnReject} onClick={() => setRejectTarget(c)}>반려</button>
                        </div>
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approveTarget && (
        <ApproveModal
          title="후보 승인 → 장소 등록"
          teams={teams}
          withNoteTags
          initial={{
            name: approveTarget.name ?? '',
            address: approveTarget.roadAddress || approveTarget.address || '',
            latitude: approveTarget.latitude ?? '',
            longitude: approveTarget.longitude ?? '',
            teamId: teams[0]?.teamId ?? null,
            team: teams[0]?.team ?? '',
            note: '', tags: '',
          }}
          onConfirm={busy ? () => {} : doApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          title={`"${rejectTarget.name}" 후보 반려`}
          onConfirm={busy ? () => {} : doReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [collecting, setCollecting] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await searchKakaoPlaces({ query: query.trim() })
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!query.trim()) return
    setCollecting(true)
    try {
      await collectKakaoPlaces({ query: query.trim() })
      alert('검색 결과를 검수 후보로 수집했습니다. "검수 후보" 탭에서 확인하세요.')
    } catch (err) {
      alert(`수집 실패: ${err.message}`)
    } finally {
      setCollecting(false)
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>카카오 장소 검색</div>
        {results.length > 0 && (
          <button className={styles.btnPrimary} onClick={handleCollect} disabled={collecting}>
            {collecting ? '수집 중…' : '검수 후보로 수집'}
          </button>
        )}
      </div>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="예) 잠실 야구 중계 술집"
        />
        <button type="submit" className={styles.btnPrimary} disabled={loading}>검색</button>
      </form>

      {searched && (
        loading ? <Loading /> : error ? <ErrorBox message={error} /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>가게명</th><th>주소</th><th>카테고리</th><th>전화번호</th><th>거리</th><th>지도</th><th>상태</th></tr>
              </thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={7} className={styles.empty}>검색 결과가 없습니다</td></tr>}
                {results.map(r => (
                  <tr key={r.sourceId}>
                    <td><b>{r.name}</b></td>
                    <td>{r.roadAddress || r.address}</td>
                    <td>{r.categoryName?.split(' > ').pop()}</td>
                    <td>{r.phone || '-'}</td>
                    <td>{r.distanceMeters != null ? `${r.distanceMeters}m` : '-'}</td>
                    <td>
                      {r.mapLink
                        ? <a href={r.mapLink} target="_blank" rel="noreferrer" className={styles.link}>카카오맵 ↗</a>
                        : '-'}
                    </td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
function PlaceManagement({ teams }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'add' | place 객체
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchAdminPlaces()
      .then(data => { setList(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    let active = true
    fetchAdminPlaces()
      .then(data => { if (active) { setList(Array.isArray(data) ? data : []); setLoading(false) } })
      .catch(err => { if (active) { setError(err.message); setLoading(false) } })
    return () => { active = false }
  }, [])

  const handleAdd = async (form) => {
    setBusy(true)
    try {
      await createPlace(form)
      setModal(null)
      load()
    } catch (err) {
      alert(`등록 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (form) => {
    setBusy(true)
    try {
      await updatePlace(form.id, form)
      setModal(null)
      load()
    } catch (err) {
      alert(`수정 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    setBusy(true)
    try {
      await deletePlace(id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      alert(`삭제 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (place) => {
    setModal({ ...place, tags: Array.isArray(place.tags) ? place.tags.join(', ') : (place.tags || '') })
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>전체 장소 목록</div>
        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={load} disabled={loading}>새로고침</button>
          <button className={styles.btnPrimary} onClick={() => setModal('add')}>+ 장소 등록</button>
        </div>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>ID</th><th>가게명</th><th>구단</th><th>주소</th><th>상태</th><th>등록일</th><th>관리</th></tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className={styles.empty}>등록된 장소가 없습니다</td></tr>}
              {list.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td><b>{p.name}</b></td>
                  <td>{p.team}</td>
                  <td><div className={styles.ellipsis}>{p.address}</div></td>
                  <td><Badge status={p.status} /></td>
                  <td>{formatDate(p.createdAt)}</td>
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
      )}

      {modal === 'add' && (
        <PlaceModal teams={teams} onClose={() => setModal(null)} onSubmit={busy ? () => {} : handleAdd} />
      )}
      {modal && modal !== 'add' && (
        <PlaceModal initial={modal} teams={teams} onClose={() => setModal(null)} onSubmit={busy ? () => {} : handleEdit} />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`"${deleteTarget.name}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={busy ? () => {} : () => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

/* ────────────────────────────────────────────────
   리뷰 관리 (장소 선택 → 리뷰 조회 → 삭제)
──────────────────────────────────────────────── */
function ReviewManagement() {
  const [places, setPlaces] = useState([])
  const [placeId, setPlaceId] = useState('')
  const [reviews, setReviews] = useState([])
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  // 장소 목록(선택용) 1회 로드
  useEffect(() => {
    let active = true
    fetchAdminPlaces()
      .then(data => { if (active) { setPlaces(Array.isArray(data) ? data : []); setLoadingPlaces(false) } })
      .catch(() => { if (active) setLoadingPlaces(false) })
    return () => { active = false }
  }, [])

  const loadReviews = useCallback((id) => {
    if (!id) { setReviews([]); return }
    setLoading(true)
    setError(null)
    fetchPlaceReviews(id)
      .then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const handleSelect = (e) => {
    const id = e.target.value
    setPlaceId(id)
    loadReviews(id)
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await deleteReview(placeId, deleteTarget.id)
      setDeleteTarget(null)
      loadReviews(placeId)
    } catch (err) {
      alert(`삭제 실패: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const selectedPlace = places.find(p => String(p.id) === String(placeId))

  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>리뷰 관리</div>
        {placeId && (
          <button className={styles.btnPrimary} onClick={() => loadReviews(placeId)} disabled={loading}>새로고침</button>
        )}
      </div>

      <div className={styles.formGroup} style={{ maxWidth: 360, marginBottom: 20 }}>
        <label className={styles.label}>장소 선택</label>
        <select className={styles.select} value={placeId} onChange={handleSelect} disabled={loadingPlaces}>
          <option value="">{loadingPlaces ? '장소 불러오는 중…' : '리뷰를 볼 장소를 선택하세요'}</option>
          {places.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
          ))}
        </select>
      </div>

      {!placeId ? (
        <div className={styles.empty}>장소를 선택하면 해당 가게의 리뷰 목록이 표시됩니다</div>
      ) : loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => loadReviews(placeId)} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>ID</th><th>별점</th><th>내용</th><th>작성일</th><th>처리</th></tr>
            </thead>
            <tbody>
              {reviews.length === 0 && <tr><td colSpan={5} className={styles.empty}>작성된 리뷰가 없습니다</td></tr>}
              {reviews.map(rv => (
                <tr key={rv.id}>
                  <td>{rv.id}</td>
                  <td><span style={{ color: '#f59e0b' }}>{'★'.repeat(rv.rating)}</span><span style={{ color: '#d1d5db' }}>{'☆'.repeat(Math.max(0, 5 - rv.rating))}</span></td>
                  <td><div className={styles.ellipsis} title={rv.content}>{rv.content}</div></td>
                  <td>{formatDate(rv.createdAt)}</td>
                  <td>
                    <button className={styles.btnDelete} onClick={() => setDeleteTarget(rv)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`${selectedPlace ? `"${selectedPlace.name}"의 ` : ''}리뷰(별점 ${deleteTarget.rating}점)를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={busy ? () => {} : handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

/* ────────────────────────────────────────────────
   운영 통계 (사용자 행동 이벤트 집계 + 서버 상태)
──────────────────────────────────────────────── */
const TYPE_LABEL = {
  PAGE_VIEW:     '페이지뷰',
  SEARCH:        '검색',
  VIEW_VENUE:    '가게 상세보기',
  FILTER_TEAM:   '구단 필터',
  CLICK_KAKAO:   '카카오맵 클릭',
  CLICK_NAVER:   '네이버맵 클릭',
  SUBMIT_REPORT: '제보 등록',
  WRITE_REVIEW:  '리뷰 작성',
  SHARE:         '공유',
}

const RANGE_OPTIONS = [
  { days: 1,  label: '오늘' },
  { days: 7,  label: '7일' },
  { days: 14, label: '14일' },
  { days: 30, label: '30일' },
]

/* 가로 막대 한 줄 (차트 라이브러리 없이 div 로 표현) */
function Bar({ label, value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div
        style={{ width: 130, flexShrink: 0, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={label}
      >
        {label}
      </div>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 6, height: 18 }}>
        <div style={{ width: `${pct}%`, minWidth: value > 0 ? 3 : 0, background: color, height: '100%', borderRadius: 6, transition: 'width .3s' }} />
      </div>
      <div style={{ width: 52, flexShrink: 0, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#111827' }}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}

/* 세로 막대 차트 (일별 추이용) */
function DailyChart({ data, color = '#6366f1', height = 150 }) {
  if (!data || data.length === 0) return <div style={{ color: '#9ca3af', padding: 16, fontSize: 14 }}>데이터가 없습니다</div>
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, minWidth: data.length * 36, height: height + 44, padding: '8px 4px 0' }}>
        {data.map(d => {
          const barH = Math.max(d.count > 0 ? 3 : 0, Math.round((d.count / max) * height))
          const label = (d.date ?? '').length >= 7 ? d.date.slice(5) : (d.date ?? '')
          return (
            <div key={d.date} style={{ flex: '1 0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1 }}>
                {d.count > 0 ? d.count.toLocaleString() : ''}
              </div>
              <div style={{
                width: '65%', height: barH,
                background: color, borderRadius: '3px 3px 0 0',
                transition: 'height .4s ease'
              }} />
              <div style={{ height: 1, width: '100%', background: '#e5e7eb' }} />
              <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Monitoring() {
  const [days, setDays]       = useState(7)
  const [stats, setStats]     = useState(null)
  const [health, setHealth]   = useState(null)
  const [info, setInfo]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback((d) => {
    setLoading(true)
    setError(null)
    Promise.all([fetchStats(d), fetchHealth(), fetchInfo()])
      .then(([s, h, i]) => { setStats(s); setHealth(h); setInfo(i); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { load(days) }, [days, load])

  if (loading) return <Loading />
  if (error)   return <ErrorBox message={error} onRetry={() => load(days)} />
  if (!stats)  return null

  const byTypeMax = Math.max(1, ...(stats.byType ?? []).map(t => t.count))
  const dailyMax  = Math.max(1, ...(stats.dailyTrend ?? []).map(d => d.count))
  const refMax    = Math.max(1, ...(stats.referrers ?? []).map(r => r.count))

  const healthUp  = health?.status === 'UP'
  const buildVer  = info?.build?.version ?? info?.app?.version
  const buildTime = info?.build?.time
  const javaVer   = info?.java?.version ?? info?.java?.runtime?.version

  return (
    <>
      {/* 기간 선택 + 새로고침 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>운영 통계</div>
        <div className={styles.btnRow}>
          {RANGE_OPTIONS.map(o => (
            <button
              key={o.days}
              className={styles.btnPrimary}
              style={days === o.days ? undefined : { background: '#e5e7eb', color: '#374151' }}
              onClick={() => setDays(o.days)}
            >
              {o.label}
            </button>
          ))}
          <button className={styles.btnPrimary} onClick={() => load(days)} disabled={loading}>새로고침</button>
        </div>
      </div>

      {/* 서버 상태 배너 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: health == null ? '#9ca3af' : healthUp ? '#22c55e' : '#ef4444' }} />
          서버 {health == null ? '확인 불가' : healthUp ? '정상 (UP)' : '점검 필요 (DOWN)'}
        </span>
        {buildVer  && <span style={{ fontSize: 13, color: '#6b7280' }}>버전 <b style={{ color: '#374151' }}>{buildVer}</b></span>}
        {javaVer   && <span style={{ fontSize: 13, color: '#6b7280' }}>Java {javaVer}</span>}
        {buildTime && <span style={{ fontSize: 13, color: '#6b7280' }}>빌드 {formatDate(buildTime)}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
          집계 {formatDate(stats.generatedAt)} · 최근 {stats.rangeDays}일
        </span>
      </div>

      {/* 핵심 지표 카드 */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}><div className={styles.statLabel}>오늘 방문자(DAU)</div><div className={styles.statValue}>{stats.dauToday.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>오늘 이벤트</div><div className={styles.statValue}>{stats.eventsToday.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>기간 내 세션</div><div className={styles.statValue}>{stats.activeSessionsInRange.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>기간 내 이벤트</div><div className={styles.statValue}>{stats.eventsInRange.toLocaleString()}</div></div>
      </div>
      <div className={styles.statGrid}>
        <div className={styles.statCard}><div className={styles.statLabel}>카카오맵 클릭</div><div className={styles.statValue}>{stats.kakaoClicks.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>네이버맵 클릭</div><div className={styles.statValue}>{stats.naverClicks.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>제보 등록</div><div className={styles.statValue}>{stats.reportSubmits.toLocaleString()}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>리뷰 작성</div><div className={styles.statValue}>{stats.reviewWrites.toLocaleString()}</div></div>
      </div>

      {/* 일별 방문자(DAU) 추이 */}
      <div className={styles.mb24} style={{ marginTop: 8 }}>
        <div className={styles.sectionTitle} style={{ marginBottom: 12 }}>일별 방문자(DAU) 추이</div>
        <DailyChart data={stats.dailyDauTrend} color="#6366f1" />
      </div>

      {/* 일별 이벤트 추이 */}
      <div className={styles.mb24}>
        <div className={styles.sectionTitle} style={{ marginBottom: 12 }}>일별 이벤트 추이</div>
        <DailyChart data={stats.dailyTrend} color="#0ea5e9" />
      </div>

      {/* 이벤트 유형별 */}
      <div className={styles.mb24}>
        <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>이벤트 유형별</div>
        {(stats.byType ?? []).length === 0
          ? <div className={styles.empty}>데이터가 없습니다</div>
          : stats.byType.map(t => <Bar key={t.type} label={TYPE_LABEL[t.type] ?? t.type} value={t.count} max={byTypeMax} color="#0ea5e9" />)}
      </div>

      {/* 인기 가게 / 인기 검색어 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>인기 가게 (상세보기 기준)</div>
          <table className={styles.table}>
            <thead><tr><th>가게명</th><th style={{ textAlign: 'right' }}>조회수</th></tr></thead>
            <tbody>
              {(stats.topVenues ?? []).length === 0 && <tr><td colSpan={2} className={styles.empty}>데이터가 없습니다</td></tr>}
              {(stats.topVenues ?? []).map(v => (
                <tr key={v.placeId}><td><b>{v.name}</b></td><td style={{ textAlign: 'right' }}>{v.count.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>인기 검색어</div>
          <table className={styles.table}>
            <thead><tr><th>검색어</th><th style={{ textAlign: 'right' }}>횟수</th></tr></thead>
            <tbody>
              {(stats.topKeywords ?? []).length === 0 && <tr><td colSpan={2} className={styles.empty}>데이터가 없습니다</td></tr>}
              {(stats.topKeywords ?? []).map((k, idx) => (
                <tr key={`${k.keyword}-${idx}`}><td>{k.keyword}</td><td style={{ textAlign: 'right' }}>{k.count.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 유입 경로 */}
      <div>
        <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>유입 경로</div>
        {(stats.referrers ?? []).length === 0
          ? <div className={styles.empty}>데이터가 없습니다</div>
          : stats.referrers.map(r => <Bar key={r.referrer} label={r.referrer} value={r.count} max={refMax} color="#10b981" />)}
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────
   공지사항 관리
──────────────────────────────────────────────── */
function NoticeManagement() {
  const [content, setContent] = useState('')
  const [active, setActive]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState(null)

  // 현재 공지 로드
  useEffect(() => {
    fetchNotice()
      .then(d => { setContent(d?.content ?? ''); setActive(d?.active ?? false) })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false)
    try {
      await updateNotice({ content: content.trim(), active })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const previewText = content.trim() || '공지 내용을 입력하면 여기에 미리보기가 표시됩니다'

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>📢 LED 공지 배너 관리</span>
      </div>

      {/* 입력 폼 */}
      <div className={`${styles.statCard} ${styles.mb24}`}>
        <div className={styles.formGroupFull} style={{ marginBottom: 16 }}>
          <label className={styles.label}>공지 내용 (최대 200자)</label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 200))}
            placeholder="예: 🔴 야구맵 신규 가게 등록 이벤트 진행 중! 제보하고 스티커 받아가세요 ⚾"
            style={{ minHeight: 80, resize: 'vertical' }}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: content.length > 180 ? '#C30452' : '#9ca3af', marginTop: 4 }}>
            {content.length} / 200
          </div>
        </div>

        {/* 활성화 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              onClick={() => setActive(v => !v)}
              style={{
                display: 'inline-flex',
                width: 44,
                height: 24,
                borderRadius: 12,
                background: active ? '#C30452' : '#d1d5db',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2,
                left: active ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                transition: 'left .2s',
              }} />
            </span>
            배너 활성화
          </label>
          <span style={{ fontSize: 13, color: active ? '#065f46' : '#9ca3af' }}>
            {active ? '🟢 현재 사용자에게 표시됨' : '⚫ 비활성 (배너 숨김)'}
          </span>
        </div>

        {/* 저장 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ 저장됐어요</span>}
          {error && <span style={{ fontSize: 13, color: '#C30452' }}>⚠️ {error}</span>}
        </div>
      </div>

      {/* LED 미리보기 */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>미리보기</span>
      </div>
      <div className={`${styles.statCard} ${styles.mb24}`}>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          실제 앱 상단에 표시되는 모습 (배너 활성화 시):
        </p>
        <div style={{
          background: '#0a0a0a',
          borderRadius: 8,
          height: 40,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.18) 2px,rgba(0,0,0,.18) 4px)',
          border: '1px solid #1a2e00',
        }}>
          {/* 라벨 */}
          <div style={{ flexShrink: 0, padding: '0 12px', borderRight: '1px solid #2a3a00', height: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>📢</span>
            <span style={{
              fontFamily: "'Galmuri11', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: '#c8ff00',
              textShadow: '0 0 4px #c8ff00, 0 0 10px #88ff00',
              letterSpacing: '0.05em',
            }}>NOTICE</span>
          </div>
          {/* 텍스트 (미리보기는 단순 고정 표시) */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px', minWidth: 0 }}>
            <span style={{
              fontFamily: "'Galmuri11', monospace",
              fontSize: 12,
              color: active ? '#c8ff00' : '#4a4a00',
              textShadow: active ? '0 0 5px #c8ff00, 0 0 12px #88ff00, 0 0 24px #44bb00' : 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}>
              {active ? previewText + '   ⚾   ' + previewText : '(비활성 — 사용자에게 안 보임)'}
            </span>
          </div>
          {/* 우측 실시간 접속자 (샘플) */}
          <div style={{ flexShrink: 0, padding: '0 14px', borderLeft: '1px solid #2a3a00', height: '100%', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Galmuri11', monospace", fontSize: 11, color: '#c8ff00', textShadow: '0 0 5px #c8ff00, 0 0 12px #88ff00' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#19ff5a', boxShadow: '0 0 6px #19ff5a' }} />
            <span style={{ color: '#9acf00', fontSize: 10 }}>실시간</span>
            <span style={{ fontWeight: 700, color: '#e8ff80' }}>12</span>
            <span style={{ color: '#9acf00', fontSize: 10 }}>명</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
          ⚡ 실제 앱에서는 공지가 우→좌로 무한 스크롤되고, 우측 “실시간 N명”은 현재 접속자 수가 실시간 반영됩니다. 저장 후 새로고침하면 확인할 수 있어요.
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   메인
──────────────────────────────────────────────── */
export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [teams, setTeams] = useState([])

  // 구단 목록은 페이지 진입 시 1회 로드 (teamId 매핑 소스)
  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [])

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
        {tab === 1 && <Monitoring />}
        {tab === 2 && <ReportManagement teams={teams} />}
        {tab === 3 && <CandidateManagement teams={teams} />}
        {tab === 4 && <KakaoSearch />}
        {tab === 5 && <PlaceManagement teams={teams} />}
        {tab === 6 && <ReviewManagement />}
        {tab === 7 && <NoticeManagement />}
      </main>
    </div>
  )
}
