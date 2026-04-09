import AdBanner from '../../components/AdBanner'
import { useState, useEffect } from 'react'
import { getUserStakes } from '../../api/index'
import api from '../../api/index'
import { useUserStore } from '../../store/userStore'
import './Home.css'

export default function Home({ user, onTab, onCreate, onMyTasks, onSupport, onPartnership, partnershipStatus='1', onMiner, minerStatus='0', onAdOrder, onAuction, isAdmin=false, onPromos }) {
  const [news, setNews] = useState([])
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoErr, setPromoErr] = useState(false)
  const [minerData, setMinerData] = useState(null)
  const { updateBalance } = useUserStore()

  const activatePromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const r = await api.post('/api/promo/activate', { code: promoCode })
      setPromoMsg(`\u2705 \u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d! +${parseFloat(r.data.amount).toFixed(5)} TON`)
      setPromoErr(false)
      setPromoCode('')
      updateBalance(parseFloat(r.data.amount))
    } catch (e) {
      setPromoMsg(e?.response?.data?.error || '\u041e\u0448\u0438\u0431\u043a\u0430')
      setPromoErr(true)
    }
    setPromoLoading(false)
    setTimeout(() => setPromoMsg(''), 5000)
  }

  useEffect(() => { api.get('/api/news').then(r => setNews(r.data || [])).catch(() => {}) }, [])
  const balance = parseFloat(user?.balance_ton ?? 0)
  const username = user?.username || user?.first_name || '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c'
  const [stakeTotal, setStakeTotal] = useState(null)
  const [tasksDone, setTasksDone] = useState(null)
  const [uptime, setUptime] = useState({ days: 0, time: '00:00:00', date: '' })

  useEffect(() => {
    api.get('/api/staking/info').then(r => {
      const launch = r.data?.prices?.launch_date || r.data?.launch_date || '2025-03-01'
      const START = new Date(launch)
      const update = () => {
        const diff = Date.now() - START.getTime()
        const days = Math.floor(diff / 86400000)
        const hours = Math.floor((diff % 86400000) / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setUptime({
          days,
          time: `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`,
          date: START.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
        })
      }
      update()
      const t = setInterval(update, 1000)
      return () => clearInterval(t)
    }).catch(() => {})

    api.get('/api/tasks/my-completed-count').then(r => {
      setTasksDone(r.data?.count ?? 0)
    }).catch(() => {
      // fallback: count from active tasks list
      api.get('/api/tasks').then(r => {
        setTasksDone((r.data || []).filter(t => t.completed).length)
      }).catch(() => setTasksDone(0))
    })

    getUserStakes().then(r => {
      const total = (r.data || []).reduce((s, st) => s + parseFloat(st.amount), 0)
      setStakeTotal(total)
    }).catch(() => setStakeTotal(0))

    // Load miner mini data
    if (minerStatus === '1' || (minerStatus === '2' && isAdmin)) {
      api.get('/api/miner/dashboard').then(r => {
        if (r.data) setMinerData(r.data)
      }).catch(() => {})
    }
  }, [])

  const hasActiveMiner = minerData && minerData.totalHashrate > 0

  return (
    <div className="page-wrap fade-up">

      {/* ===== HERO CARD ===== */}
      <div className="home-hero">
        <div className="hero-greeting">
          <div className="hero-hi">
            <span className="hero-hi-text">{'\u041f\u0440\u0438\u0432\u0435\u0442,'}</span>
            <span className="hero-hi-emoji">👋</span>
          </div>
          <div className="hero-name">{username}</div>
        </div>
        <div className="hero-balance">
          <div className="hero-bal-main">
            <div className="hero-bal-label">BALANCE</div>
            <div className="hero-bal-val">
              {balance.toFixed(4)}
              <span className="hero-bal-cur">TON</span>
            </div>
          </div>
          <div className="hero-bal-side">
            {stakeTotal !== null && stakeTotal > 0 && (
              <div className="hero-bal-pill">
                <span>📈</span>
                <span>{stakeTotal.toFixed(2)} {'\u0432 \u0441\u0442\u0435\u0439\u043a\u0435'}</span>
              </div>
            )}
            {user?.referral_count > 0 && (
              <div className="hero-bal-pill warn">
                <span>👥</span>
                <span>{user.referral_count} {'\u0440\u0435\u0444.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== UPTIME STRIP ===== */}
      <div className="home-uptime">
        <div className="hup-pulse"/>
        <div className="hup-info">
          <div className="hup-label">{'\u041f\u0420\u041e\u0415\u041a\u0422 \u0420\u0410\u0411\u041e\u0422\u0410\u0415\u0422'}</div>
          <div className="hup-val">{uptime.days} {'\u0434\u043d\u0435\u0439'}{uptime.date ? ` \u00b7 \u0441 ${uptime.date}` : ''}</div>
        </div>
        <div className="hup-timer">{uptime.time}</div>
      </div>

      {/* ===== MINI STATS ===== */}
      <div className="mini-stats">
        <div className="mini-stat cyan" onClick={() => onTab('staking')}>
          <div className="ms-header">
            <div className="ms-icon cyan">💎</div>
            <div className="ms-label">{'\u0421\u0422\u0415\u0419\u041a\u0418\u041d\u0413'}</div>
          </div>
          <div className="ms-val">{stakeTotal === null ? '...' : stakeTotal.toFixed(2)}</div>
          <div className="ms-sub">TON</div>
        </div>
        <div className="mini-stat blue" onClick={() => onTab('tasks')}>
          <div className="ms-header">
            <div className="ms-icon blue">✅</div>
            <div className="ms-label">{'\u0417\u0410\u0414\u0410\u041d\u0418\u042f'}</div>
          </div>
          <div className="ms-val">{tasksDone === null ? '...' : tasksDone}</div>
          <div className="ms-sub">{'\u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e'}</div>
        </div>
        <div className="mini-stat green" onClick={() => onTab('referrals')}>
          <div className="ms-header">
            <div className="ms-icon green">👥</div>
            <div className="ms-label">{'\u0420\u0415\u0424\u0415\u0420\u0410\u041b\u042b'}</div>
          </div>
          <div className="ms-val">{user?.referral_count ?? 0}</div>
          <div className="ms-sub">{'\u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u043e'}</div>
        </div>
        <div className="mini-stat gold" onClick={() => onTab('games')}>
          <div className="ms-header">
            <div className="ms-icon gold">🎮</div>
            <div className="ms-label">{'\u0418\u0413\u0420\u042b'}</div>
          </div>
          <div className="ms-val">TON</div>
          <div className="ms-sub">{'\u0437\u0430\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c'}</div>
        </div>
      </div>

      {/* ===== MINER MINI WIDGET ===== */}
      {(minerStatus === '1' || (minerStatus === '2' && isAdmin)) && minerData && (
        <div className="miner-widget" onClick={onMiner}>
          <div className="mw-header">
            <span className="mw-icon">⛏</span>
            <span className="mw-title">CLOUD MINING</span>
            <span className={`mw-status ${hasActiveMiner ? 'active' : 'off'}`}>
              {hasActiveMiner ? '\u25CF MINING' : '\u25CB OFFLINE'}
            </span>
          </div>
          <div className="mw-stats">
            <div className="mw-stat">
              <div className="mw-stat-val" style={{color:'#00d4ff'}}>{minerData.totalHashrate.toFixed(0)}</div>
              <div className="mw-stat-lbl">GH/s</div>
            </div>
            <div className="mw-stat">
              <div className="mw-stat-val" style={{color:'#00e676'}}>{minerData.totalEarned.toFixed(4)}</div>
              <div className="mw-stat-lbl">{'\u0437\u0430\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u043e'}</div>
            </div>
            <div className="mw-stat">
              <div className="mw-stat-val" style={{color:'#ffb300'}}>{minerData.availableBalance.toFixed(4)}</div>
              <div className="mw-stat-lbl">{'\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e'}</div>
            </div>
          </div>
          {hasActiveMiner && minerData.contracts?.length > 0 && (() => {
            const activeContract = minerData.contracts.find(c => c.status === 'active' && new Date(c.expires_at) > new Date())
            if (!activeContract) return null
            const progress = Math.max(0, Math.min(100, ((new Date() - new Date(activeContract.started_at)) / (new Date(activeContract.expires_at) - new Date(activeContract.started_at))) * 100))
            return <div className="mw-progress"><div className="mw-progress-bar" style={{width: progress+'%'}}/></div>
          })()}
        </div>
      )}

      {/* ===== NEWS ===== */}
      {news.length > 0 && (
        <div className="news-section">
          <div className="news-title">{'\uD83D\uDCE2 \u041d\u041e\u0412\u041e\u0421\u0422\u0418'}</div>
          {news.slice(0,3).map(n => (
            <div key={n.id} className="news-card">
              <div className="news-card-title">{n.title}</div>
              <div className="news-card-body">{n.body}</div>
              <div className="news-card-date">{new Date(n.created_at).toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'})}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PROMO ===== */}
      <div className="promo-section">
        <div className="promo-row">
          <input className="promo-input" placeholder={'\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434'} value={promoCode}
            onChange={e=>setPromoCode(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==='Enter'&&activatePromo()}/>
          <button className="promo-btn" onClick={activatePromo} disabled={promoLoading || !promoCode.trim()}>
            {promoLoading ? '...' : '\uD83C\uDF81'}
          </button>
        </div>
        {promoMsg && <div className={`promo-msg ${promoErr?'err':''}`}>{promoMsg}</div>}
        <button className="promo-more-btn" onClick={onPromos}>
          {'\uD83C\uDF81 \u0415\u0449\u0451 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u044b'}
        </button>
      </div>

      <AdBanner page="home" />

      {/* ===== QUICK ACTIONS ===== */}
      <div className="qa-title">{'\u0411\u042b\u0421\u0422\u0420\u042b\u0415 \u0414\u0415\u0419\u0421\u0422\u0412\u0418\u042f'}</div>
      <div className="qa-grid">
        <div className="qa" onClick={() => onTab('staking')}>
          <div className="qa-icon si-cyan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u0421\u0422\u0415\u0419\u041a'}</div>
        </div>
        <div className="qa" onClick={onAuction}>
          <div className="qa-icon si-purple">🏛</div>
          <div className="qa-lbl">{'\u0410\u0423\u041a\u0426\u0418\u041e\u041d'}</div>
        </div>
        <div className="qa" onClick={() => onTab('tasks')}>
          <div className="qa-icon si-blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u0417\u0410\u0414\u0410\u041d\u0418\u042f'}</div>
        </div>
        <div className="qa" onClick={onCreate}>
          <div className="qa-icon si-warn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u0417\u0410\u041a\u0410\u0417\u0410\u0422\u042c'}</div>
        </div>
        <div className="qa" onClick={onMyTasks}>
          <div className="qa-icon si-green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u041c\u041e\u0418 \u0417\u0410\u041a\u0410\u0417\u042b'}</div>
        </div>
        <div className="qa" onClick={onSupport}>
          <div className="qa-icon si-purple">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u041f\u041e\u0414\u0414\u0415\u0420\u0416\u041a\u0410'}</div>
        </div>
        {(partnershipStatus==='1' || partnershipStatus==='3' || (partnershipStatus==='2' && isAdmin)) && (
        <div className="qa" onClick={onPartnership}>
          <div className="qa-icon si-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="qa-lbl">{'\u041f\u0410\u0420\u0422\u041d\u0401\u0420'}</div>
        </div>
        )}
        {(minerStatus==='1' || (minerStatus==='2' && isAdmin)) && (
        <div className="qa" onClick={onMiner}>
          <div className="qa-icon si-cyan">⛏</div>
          <div className="qa-lbl">{'\u041c\u0410\u0419\u041d\u0418\u041d\u0413'}</div>
        </div>
        )}
        <div className="qa" onClick={onAdOrder}>
          <div className="qa-icon si-gold">📣</div>
          <div className="qa-lbl">{'\u0420\u0415\u041a\u041b\u0410\u041c\u0410'}</div>
        </div>
      </div>
    </div>
  )
}
