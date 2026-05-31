import { useState } from 'react'
import AdminPage from './AdminPage'

const ADMIN_PW  = import.meta.env.VITE_ADMIN_PASSWORD ?? ''
const SESSION_KEY = 'yagoomap_admin_auth'

export default function AdminGate() {
  const [authed, setAuthed] = useState(
    () => ADMIN_PW !== '' && sessionStorage.getItem(SESSION_KEY) === 'ok'
  )
  const [input, setInput]   = useState('')
  const [error, setError]   = useState(false)
  const [shake, setShake]   = useState(false)

  if (authed) return <AdminPage />

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ADMIN_PW === '') {
      // 빌드 시 비밀번호 미설정 → 개발 환경에서는 바로 진입
      setAuthed(true)
      return
    }
    if (input === ADMIN_PW) {
      sessionStorage.setItem(SESSION_KEY, 'ok')
      setAuthed(true)
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.card, animation: shake ? 'shake 0.4s ease' : 'none' }}>
        <div style={styles.logo}>⚾ 야구맵</div>
        <p style={styles.sub}>관리자 전용 페이지입니다</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="비밀번호"
            autoFocus
            style={{ ...styles.input, borderColor: error ? '#ef4444' : '#e5e7eb' }}
          />
          {error && <p style={styles.errMsg}>비밀번호가 올바르지 않습니다</p>}
          <button type="submit" style={styles.btn}>입장</button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '48px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 28,
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  errMsg: {
    fontSize: 12,
    color: '#ef4444',
    margin: '-4px 0 0',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
}
