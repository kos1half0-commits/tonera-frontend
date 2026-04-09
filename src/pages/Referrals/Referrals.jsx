import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Referrals.css'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'tonera_bot'

export default function Referrals({ user, onAuction }) {
  const [refs, setRefs] = useState([])
  const [earned, setEarned] = useState(0)
  const [fromTasks, setFromTasks] = useState(0)
  const [fromDeposits, setFromDeposits] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [auctionEnabled, setAuctionEnabled] = useState(false)
  const [onAuctionIds, setOnAuctionIds] = useState([])

  const refLink = user?.ref_code
    ? `https://t.me/${BOT_USERNAME}?start=${user.ref_code}`
    : `https://t.me/${BOT_USERNAME}`

  useEffect(() => {
    // Загружаем всё параллельно
    Promise.all([
      api.get('/api/referrals').catch(() => ({ data: {} })),
      api.get('/api/auction/info').catch(() => ({ data: {} })),
      api.get('/api/auction/my/all').catch(() => ({ data: { selling: [] } })),
    ]).then(([refsR, auctionR, myR]) => {
      const data = refsR.data
      setRefs(data?.referrals || (Array.isArray(data) ? data : []))
      setEarned(parseFloat(data?.earned || 0))
      setFromTasks(parseFloat(data?.from_tasks || 0))
      setFromDeposits(parseFloat(data?.from_deposits || 0))

      setAuctionEnabled(auctionR.data?.enabled !== '0')

      const selling = myR.data?.selling || []
      setOnAuctionIds(selling.filter(a => a.status === 'active').map(a => a.referral_id))
    }).finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const tg = window.Telegram?.WebApp
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Заходи в TonEra — зарабатывай TON!`)
  }

  return (
    <div className="refs-wrap">
      <div className="refs-title">Рефералы</div>

      <div className="refs-stats">
        <div className="ref-stat"><div className="rsv">{refs.length}</div><div className="rsl">Приглашено</div></div>
        <div className="ref-stat"><div className="rsv">{earned.toFixed(4)}</div><div className="rsl">TON заработано</div></div>
        <div className="ref-stat"><div className="rsv">{fromTasks.toFixed(4)}</div><div className="rsl">С заданий</div></div>
        <div className="ref-stat"><div className="rsv">{fromDeposits.toFixed(4)}</div><div className="rsl">С депозитов</div></div>
      </div>

      <div className="invite-card">
        <div className="inv-label">РЕФЕРАЛЬНАЯ ССЫЛКА</div>
        <div className="inv-link">{refLink}</div>
        <div className="inv-btns">
          <button className="btn-p" onClick={handleShare}>⬆ ПОДЕЛИТЬСЯ</button>
          <button className="btn-copy" onClick={handleCopy}>{copied ? '✓' : 'КОПИРОВАТЬ'}</button>
        </div>
      </div>

      {/* Auction button */}
      <button className="auction-ref-btn" onClick={() => onAuction && onAuction()}>
        🏛 АУКЦИОН РЕФЕРАЛОВ
      </button>

      <div className="hiw-card">
        <div className="hiw-title">КАК ЭТО РАБОТАЕТ</div>
        {['Поделись реферальной ссылкой','Друг регистрируется в TonEra','Ты получаешь бонус мгновенно'].map((s,i) => (
          <div className="hiw-step" key={i}>
            <div className="hiw-num">{i+1}</div>
            <div className="hiw-txt">{s}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="refs-loading">
          <div className="refs-spinner"></div>
          <div>Загрузка рефералов...</div>
        </div>
      )}

      {!loading && refs.length === 0 && (
        <div className="refs-empty">
          <div className="refs-empty-icon">👥</div>
          <div className="refs-empty-title">Пока нет рефералов</div>
          <div className="refs-empty-text">Поделись ссылкой выше и начни зарабатывать TON с каждого приглашённого друга!</div>
        </div>
      )}

      {!loading && refs.length > 0 && (
        <div className="refs-list">
          <div className="refs-list-title">ПРИГЛАШЁННЫЕ</div>
          {refs.map((r, i) => {
            const isOnAuction = onAuctionIds.includes(r.referral_id || r.id)
            return (
              <div className="ref-item" key={i}>
                <div className="ref-avatar-wrap">
                  <div className="ref-avatar">{(r.username || r.first_name || '?')[0].toUpperCase()}</div>
                  <div className={`ref-status-dot ${r.is_active ? 'active' : 'inactive'}`}></div>
                </div>
                <div className="ref-info">
                  <div className="ref-name">{r.username || r.first_name || 'Пользователь'}</div>
                  <div className="ref-date">
                    {new Date(r.created_at).toLocaleDateString('ru')}
                    {r.last_active && (
                      <span className="ref-last-seen"> · был {new Date(r.last_active).toLocaleDateString('ru')}</span>
                    )}
                  </div>
                  <div className="ref-meta">
                    <span className="ref-tasks">✅ {r.tasks_completed ?? 0} заданий</span>
                    {isOnAuction
                      ? <span className="ref-on-auction-tag">· 🏛 на аукционе</span>
                      : r.auction_eligible
                        ? <span className="ref-eligible">· 🏛 можно продать</span>
                        : r.auction_reason
                          ? <span className="ref-ineligible">· 🚫 {r.auction_reason}</span>
                          : null
                    }
                  </div>
                </div>
                <div className="ref-right">
                  <div className="ref-bonus">+{parseFloat(r.earned || 0).toFixed(4)} TON</div>
                  {auctionEnabled && r.auction_eligible && !isOnAuction && (
                    <button className="ref-sell-btn" onClick={() => onAuction && onAuction(r)}>
                      🏛 Продать
                    </button>
                  )}
                  {isOnAuction && (
                    <span className="ref-on-auction">🏛 На аукционе</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
