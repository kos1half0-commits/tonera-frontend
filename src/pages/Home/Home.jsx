import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const balance = user?.balance_ton ?? 0
  const username = user?.username || user?.first_name || 'Пользователь'

  return (
    <div className="home fade-up">
      <div className="home-header">
        <div className="logo-row">
          <div className="logo-circle">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M9 7h14v3H18v3h-4v-3H9V7z" fill="url(#lg1)"/>
              <path d="M16 13l-5 8h4l-2 6 9-10h-5l3-4H16z" fill="url(#lg2)"/>
              <defs>
                <linearGradient id="lg1" x1="9" y1="7" x2="23" y2="10" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#90d4ff"/>
                  <stop offset="100%" stopColor="#00d4ff"/>
                </linearGradient>
                <linearGradient id="lg2" x1="11" y1="13" x2="21" y2="27" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#b0e0ff"/>
                  <stop offset="100%" stopColor="#60b8ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-name">TonEra</span>
        </div>
        <div className="balance-pill">
          <svg className="ton-logo" viewBox="0 0 56 56" fill="none">
            <path d="M28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0Z" fill="#0098EA"/>
            <path d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5603 15.6277ZM26.2644 36.2844L23.3985 31.1222L16.8414 19.8049C16.4765 19.1777 16.9199 18.3799 17.6538 18.3799H26.2644V36.2844ZM39.1574 19.8049L32.6003 31.1222L29.7345 36.2844V18.3799H38.3451C39.079 18.3799 39.5224 19.1777 39.1574 19.8049Z" fill="white"/>
          </svg>
          <span className="bal-num">{parseFloat(balance).toFixed(2)}</span>
        </div>
      </div>

      <div className="greeting-row">
        <span className="greeting-text">Привет, {username} 👋</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/staking')}>
          <div className="stat-icon si-cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div className="stat-info"><div className="stat-val">—</div><div className="stat-lbl">В стейкинге</div></div>
          <div className="stat-arr">›</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/tasks')}>
          <div className="stat-icon si-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="stat-info"><div className="stat-val">0</div><div className="stat-lbl">Задания</div></div>
          <div className="stat-arr">›</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/referrals')}>
          <div className="stat-icon si-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="18" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
          </div>
          <div className="stat-info"><div className="stat-val">{user?.referral_count ?? 0}</div><div className="stat-lbl">Рефералов</div></div>
          <div className="stat-arr">›</div>
        </div>
      </div>

      <div className="section-title">Быстрые действия</div>
      <div className="qa-grid">
        <div className="qa" onClick={() => navigate('/staking')}><div className="qa-icon si-cyan"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div><div className="qa-lbl">СТЕЙК</div></div>
        <div className="qa" onClick={() => navigate('/tasks')}><div className="qa-icon si-blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div><div className="qa-lbl">ЗАДАНИЯ</div></div>
        <div className="qa" onClick={() => navigate('/referrals')}><div className="qa-icon si-green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div><div className="qa-lbl">РЕФЕРАЛ</div></div>
        <div className="qa" onClick={() => navigate('/wallet')}><div className="qa-icon si-warn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 13a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/><path d="M2 10h20" stroke="currentColor" strokeWidth="2"/></svg></div><div className="qa-lbl">КОШЕЛЁК</div></div>
      </div>
    </div>
  )
}
