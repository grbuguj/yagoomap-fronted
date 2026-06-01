import { useState } from 'react'
import { TEAMS } from '../data/teams'
import { submitReport } from '../api/venueApi'
import { sendEvent, EVENT } from '../api/events'
import styles from './ReportModal.module.css'

const INIT = { name: '', address: '', team: '', content: '' }

function ReportModal({ selectedTeam, onClose }) {
  const [form, setForm]     = useState({ ...INIT, team: selectedTeam })
  const [sending, setSending] = useState(false)
  const [done, setDone]     = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) return
    setSending(true)
    await submitReport(form)
    sendEvent(EVENT.SUBMIT_REPORT, { team: form.team || null })
    setSending(false)
    setDone(true)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>📍 가게 제보하기</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={styles.done}>
            <span>🎉</span>
            <p>제보해주셔서 감사해요!</p>
            <small>검토 후 지도에 반영됩니다</small>
            <button className={styles.submitBtn} onClick={onClose}>닫기</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              가게 이름 <span className={styles.req}>*</span>
              <input
                className={styles.input}
                placeholder="예: 트윈스포차"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              주소 <span className={styles.req}>*</span>
              <input
                className={styles.input}
                placeholder="예: 서울 마포구 서교동 394-20"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              응원 구단
              <select
                className={styles.input}
                value={form.team}
                onChange={e => set('team', e.target.value)}
              >
                <option value="">선택 안 함</option>
                {TEAMS.map(t => (
                  <option key={t.key} value={t.key}>{t.key}</option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              제보 내용
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="야구 중계 여부, 응원 분위기 등 알려주세요!"
                value={form.content}
                onChange={e => set('content', e.target.value)}
                rows={3}
              />
            </label>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={sending || !form.name.trim() || !form.address.trim()}
            >
              {sending ? '제보 중...' : '제보하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportModal
