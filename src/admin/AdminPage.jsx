import { useState, useEffect, useCallback } from 'react'
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
  fetchTeams,
} from '../api/adminApi'

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

  const handleTeam = (e) => {
    const found = teams.find(t => t.teamId === Number(e.target.value))
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
                {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.team}</option>)}
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

  const handleTeam = (e) => {
    const found = teams.find(t => t.teamId === Number(e.target.value))
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
                {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.team}</option>)}
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
        {tab === 1 && <ReportManagement teams={teams} />}
        {tab === 2 && <CandidateManagement teams={teams} />}
        {tab === 3 && <KakaoSearch />}
        {tab === 4 && <PlaceManagement teams={teams} />}
      </main>
    </div>
  )
}
