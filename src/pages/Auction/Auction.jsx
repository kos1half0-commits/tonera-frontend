import { useState, useEffect, useCallback } from 'react'
import api from '../../api/index'
import { getReferrals } from '../../api/index'
import './Auction.css'

// --- Referral Profile Modal ---
function RefProfileModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    api.get(`/api/auction/ref-profile/${userId}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  const fmt = (v, d = 4) => parseFloat(v || 0).toFixed(d)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day:'2-digit', month:'short', year:'numeric' }) : '—'
  const fmtTime = (d) => d ? new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'

  const txTypeLabels = {
    deposit: '💳 Депозит',
    withdrawal: '📤 Вывод',
    ref_bonus: '🤝 Реф. бонус',
    ref_task: '📋 Реф. задание',
    ref_deposit: '💵 Реф. депозит',
    staking: '📈 Стейкинг',
    task_reward: '✅ Задание',
    bonus: '🎁 Бонус',
  }
  const hiddenTxTypes = ['spin_result', 'trading', 'miner_payout']

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="ref-profile-modal" onClick={e => e.stopPropagation()}>
        <button className="rpm-close" onClick={onClose}>✕</button>

        {loading && (
          <div className="rpm-loading">
            <div className="rpm-spinner"></div>
            <div>Загрузка профиля...</div>
          </div>
        )}

        {error && (
          <div className="rpm-error">⚠️ {error}</div>
        )}

        {data && !loading && (
          <>
            {/* Header */}
            <div className="rpm-header">
              <div className="rpm-avatar">{(data.user.username || data.user.first_name || '?')[0].toUpperCase()}</div>
              <div className="rpm-user-info">
                <div className="rpm-username">{data.user.username ? `@${data.user.username}` : data.user.first_name || 'Пользователь'}</div>
                <div className="rpm-refs">👥 {data.user.referral_count || 0} рефералов</div>
              </div>
            </div>

            {/* Registration & activity info */}
            <div className="rpm-dates-block">
              <div className="rpm-date-row">
                <span className="rpm-date-icon">📅</span>
                <span className="rpm-date-label">Регистрация:</span>
                <span className="rpm-date-val">{fmtDate(data.user.registered)}</span>
              </div>
              <div className="rpm-date-row">
                <span className="rpm-date-icon">⏳</span>
                <span className="rpm-date-label">На проекте:</span>
                <span className="rpm-date-val highlight">{Math.max(1, Math.floor((Date.now() - new Date(data.user.registered).getTime()) / 86400000))} дней</span>
              </div>
              <div className="rpm-date-row">
                <span className="rpm-date-icon">🕐</span>
                <span className="rpm-date-label">Последний вход:</span>
                <span className="rpm-date-val">{data.stats.last_active ? fmtTime(data.stats.last_active) : '—'}</span>
              </div>
            </div>

            {/* Activity summary bar */}
            <div className="rpm-activity-bar">
              <div className={`rpm-act-dot ${data.stats.activity_7d > 0 ? 'active' : 'inactive'}`}></div>
              <span className="rpm-act-text">
                {data.stats.activity_7d > 0
                  ? `🟢 Активен (${data.stats.activity_7d} действий за 7д)`
                  : data.stats.activity_30d > 0
                    ? `🟡 Активен за 30д (${data.stats.activity_30d} действий)`
                    : '🔴 Неактивен'}
              </span>
              {data.stats.last_active && (
                <span className="rpm-act-last">последн.: {fmtTime(data.stats.last_active)}</span>
              )}
            </div>

            {/* Stats grid */}
            <div className="rpm-section-title">📊 СТАТИСТИКА АКТИВНОСТИ</div>
            <div className="rpm-stats-grid">
              <div className="rpm-stat-card">
                <div className="rpm-stat-icon">💳</div>
                <div className="rpm-stat-val">{fmt(data.stats.total_deposited)}</div>
                <div className="rpm-stat-label">TON депозитов</div>
                <div className="rpm-stat-sub">{data.stats.deposit_count} операций</div>
              </div>
              <div className="rpm-stat-card">
                <div className="rpm-stat-icon">📈</div>
                <div className="rpm-stat-val">{fmt(data.stats.active_staked)}</div>
                <div className="rpm-stat-label">TON в стейке</div>
                <div className="rpm-stat-sub">{data.stats.total_stakes} стейков</div>
              </div>
              <div className="rpm-stat-card">
                <div className="rpm-stat-icon">✅</div>
                <div className="rpm-stat-val">{data.stats.tasks_completed}</div>
                <div className="rpm-stat-label">Заданий</div>
                <div className="rpm-stat-sub">выполнено</div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="rpm-section-title">📜 ПОСЛЕДНИЕ ДЕЙСТВИЯ</div>
            {data.recent_tx.length === 0 ? (
              <div className="rpm-empty-tx">Нет транзакций</div>
            ) : (
              <div className="rpm-tx-list">
                {data.recent_tx.filter(tx => !hiddenTxTypes.includes(tx.type)).map((tx, i) => (
                  <div key={i} className="rpm-tx-item">
                    <div className="rpm-tx-type">{txTypeLabels[tx.type] || `📌 ${tx.type}`}</div>
                    <div className="rpm-tx-label">{tx.label}</div>
                    <div className="rpm-tx-date">{fmtTime(tx.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function useCountdown(endsAt) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - new Date()
      if (diff <= 0) { setTimeLeft('ЗАВЕРШЁН'); setExpired(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [endsAt])
  return { timeLeft, expired }
}

function AuctionTimer({ endsAt }) {
  const { timeLeft, expired } = useCountdown(endsAt)
  return (
    <div className="ac-timer">
      <span className="ac-timer-icon">{expired ? '🔴' : '⏱'}</span>
      <span className={`ac-timer-text ${expired ? 'expired' : ''}`}>{timeLeft}</span>
    </div>
  )
}

function AuctionCard({ auction, userId, onBid, onCancel, onViewProfile, showSeller = true }) {
  const isSeller = auction.seller_id === userId
  const statusClass = auction.status === 'active' ? 'active' : auction.status === 'completed' ? 'completed' : 'cancelled'
  const statusLabel = auction.status === 'active' ? 'АКТИВЕН' : auction.status === 'completed' ? 'ПРОДАН' : 'ОТМЕНЁН'
  const refName = auction.ref_username ? `@${auction.ref_username}` : auction.ref_name || 'Пользователь'
  const sellerName = auction.seller_username ? `@${auction.seller_username}` : auction.seller_name || 'Пользователь'

  return (
    <div className={`auction-card ${statusClass} ${auction.is_test ? 'test' : ''}`}>
      <div className="ac-header">
        <div className="ac-avatar" style={{cursor:'pointer'}} onClick={() => onViewProfile(auction.referred_user_id)}>{refName[0].toUpperCase()}</div>
        <div className="ac-info">
          <div className="ac-name" style={{cursor:'pointer'}} onClick={() => onViewProfile(auction.referred_user_id)}>{refName}</div>
          {showSeller && <div className="ac-seller">продавец: {sellerName}</div>}
        </div>
        <span className={`ac-badge ${statusClass}`}>{statusLabel}</span>
        {auction.is_test && <span className="ac-badge test">ТЕСТ</span>}
      </div>

      <div className="ac-stats">
        <div className="ac-stat">
          <div className="ac-stat-val price">{parseFloat(auction.current_price).toFixed(4)}</div>
          <div className="ac-stat-label">ТЕКУЩАЯ ЦЕНА (TON)</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat-val">{parseFloat(auction.start_price).toFixed(4)}</div>
          <div className="ac-stat-label">НАЧАЛЬНАЯ</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat-val bids">{auction.bid_count || 0}</div>
          <div className="ac-stat-label">СТАВКИ</div>
        </div>
      </div>

      {auction.status === 'active' && <AuctionTimer endsAt={auction.ends_at} />}

      {/* Action buttons */}
      <div style={{display:'flex',gap:6}}>
        <button className="ac-bid-btn" style={{flex:0,background:'rgba(0,212,255,0.1)',color:'#00d4ff',boxShadow:'none',fontSize:9,padding:'10px 14px'}} onClick={() => onViewProfile(auction.referred_user_id)}>
          👤 ПРОФИЛЬ
        </button>
        {auction.status === 'active' && !isSeller && (
          <button className="ac-bid-btn" style={{flex:1}} onClick={() => onBid(auction)}>
            💰 СДЕЛАТЬ СТАВКУ
          </button>
        )}
        {auction.status === 'active' && isSeller && parseInt(auction.bid_count || 0) === 0 && (
          <button className="ac-bid-btn cancel" style={{flex:1}} onClick={() => onCancel(auction.id)}>
            ✕ ОТМЕНИТЬ
          </button>
        )}
      </div>
      {auction.status === 'completed' && auction.winner_username && (
        <div style={{textAlign:'center',padding:'6px',fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)'}}>
          🏆 Победитель: <span style={{color:'#00e676',fontWeight:700}}>@{auction.winner_username || auction.winner_name}</span>
        </div>
      )}
    </div>
  )
}

export default function Auction({ onBack, user, initialRef }) {
  const [info, setInfo] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [myData, setMyData] = useState({ selling: [], bidding: [] })
  const [myRefs, setMyRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(initialRef ? 'create' : 'active')
  const [toast, setToast] = useState({ text: '', error: false })
  const [bidModal, setBidModal] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [profileUserId, setProfileUserId] = useState(null)
  const [sortBy, setSortBy] = useState('time_asc') // time_asc, time_desc, price_asc, price_desc, bids_desc

  // Create form
  const [selRef, setSelRef] = useState(initialRef || null)
  const [createPrice, setCreatePrice] = useState('')
  const [createDuration, setCreateDuration] = useState(24)
  const [creating, setCreating] = useState(false)

  const userId = user?.id

  const showToast = (text, error = false) => {
    setToast({ text, error })
    setTimeout(() => setToast({ text: '', error: false }), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      const [infoR, listR, myR] = await Promise.all([
        api.get('/api/auction/info'),
        api.get('/api/auction/list').catch(() => ({ data: { auctions: [], enabled: false } })),
        api.get('/api/auction/my/all').catch(() => ({ data: { selling: [], bidding: [] } })),
      ])
      setInfo(infoR.data)
      setAuctions(listR.data.auctions || [])
      setMyData(myR.data || { selling: [], bidding: [] })
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Load refs when switching to create tab
  useEffect(() => {
    if (tab === 'create') {
      getReferrals().then(r => {
        const refs = r.data?.referrals || (Array.isArray(r.data) ? r.data : [])
        setMyRefs(refs)
      }).catch(() => {})
    }
  }, [tab])

  // Auto-refresh active auctions
  useEffect(() => {
    const iv = setInterval(() => {
      if (tab === 'active') {
        api.get('/api/auction/list').then(r => setAuctions(r.data.auctions || [])).catch(() => {})
      }
    }, 15000)
    return () => clearInterval(iv)
  }, [tab])

  const handleCreate = async () => {
    if (!selRef) return showToast('Выберите реферала', true)
    if (!createPrice || parseFloat(createPrice) < (info?.min_price || 0.1)) {
      return showToast(`Мин. цена: ${info?.min_price || 0.1} TON`, true)
    }
    setCreating(true)
    try {
      await api.post('/api/auction/create', {
        referral_id: selRef.referral_id || selRef.id,
        start_price: parseFloat(createPrice),
        duration_hours: createDuration,
      })
      showToast('✅ Аукцион создан!')
      setSelRef(null)
      setCreatePrice('')
      setTab('active')
      loadData()
    } catch (e) {
      showToast(e.response?.data?.error || 'Ошибка создания', true)
    }
    setCreating(false)
  }

  const handleBid = async () => {
    if (!bidModal || !bidAmount) return
    setBidding(true)
    try {
      await api.post(`/api/auction/${bidModal.id}/bid`, { amount: parseFloat(bidAmount) })
      showToast('✅ Ставка принята!')
      setBidModal(null)
      setBidAmount('')
      loadData()
    } catch (e) {
      showToast(e.response?.data?.error || 'Ошибка ставки', true)
    }
    setBidding(false)
  }

  const handleCancel = async (id) => {
    try {
      await api.post(`/api/auction/${id}/cancel`)
      showToast('✅ Аукцион отменён')
      loadData()
    } catch (e) {
      showToast(e.response?.data?.error || 'Ошибка', true)
    }
  }

  const openBidModal = (auction) => {
    const minBid = parseFloat(auction.current_price) + parseFloat(auction.min_step)
    setBidAmount(minBid.toFixed(4))
    setBidModal(auction)
  }



  if (loading) return (
    <div className="auction-wrap">
      <button className="auction-back" onClick={onBack}>← НАЗАД</button>
      <div style={{textAlign:'center',padding:40,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Загрузка...</div>
    </div>
  )

  const isEnabled = info?.enabled !== '0'
  const isTest = info?.test_mode === '1'

  return (
    <div className="auction-wrap">
      {toast.text && <div className={`auction-toast ${toast.error ? 'error' : ''}`}>{toast.text}</div>}

      <button className="auction-back" onClick={onBack}>← НАЗАД</button>
      <div className="auction-title"><span>🏛</span> АУКЦИОН РЕФЕРАЛОВ</div>

      {/* Test mode banner */}
      {isTest && isEnabled && (
        <div className="auction-test-banner">
          <div className="atb-icon">🔬</div>
          <div className="atb-text">
            <b>ТЕСТОВЫЙ РЕЖИМ</b><br/>
            Все операции фиктивные. Баланс не списывается, реферальные связи не переносятся.
          </div>
        </div>
      )}

      {/* Disabled banner */}
      {!isEnabled && (
        <div className="auction-off-banner">
          <div className="aob-icon">🔒</div>
          <div className="aob-title">АУКЦИОН ОТКЛЮЧЁН</div>
          <div className="aob-sub">Функция временно недоступна</div>
        </div>
      )}

      {isEnabled && (<>
        {/* Tabs */}
        <div className="auction-tabs">
          <button className={`auction-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            🏛 АКТИВНЫЕ ({auctions.length})
          </button>
          <button className={`auction-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
            ➕ СОЗДАТЬ
          </button>
          <button className={`auction-tab ${tab === 'selling' ? 'active' : ''}`} onClick={() => setTab('selling')}>
            📦 МОИ ЛОТЫ ({myData.selling.length})
          </button>
          <button className={`auction-tab ${tab === 'bidding' ? 'active' : ''}`} onClick={() => setTab('bidding')}>
            💰 МОИ СТАВКИ ({myData.bidding.length})
          </button>
        </div>

        {/* Active auctions */}
        {tab === 'active' && (<>
          {auctions.length === 0 ? (
            <div className="auction-empty">
              <div className="auction-empty-icon">🏛</div>
              <div className="auction-empty-text">Нет активных аукционов</div>
            </div>
          ) : (<>
            {/* Sort bar */}
            <div className="ac-sort-bar">
              <span className="ac-sort-label">⇅ Сортировка:</span>
              {[
                { id: 'time_asc',   label: '⏱ Скоро' },
                { id: 'time_desc',  label: '⏱ Поздно' },
                { id: 'price_asc',  label: '💰 Дешёвые' },
                { id: 'price_desc', label: '💰 Дорогие' },
                { id: 'bids_desc',  label: '🔥 Ставки' },
              ].map(s => (
                <button
                  key={s.id}
                  className={`ac-sort-chip ${sortBy === s.id ? 'active' : ''}`}
                  onClick={() => setSortBy(s.id)}
                >{s.label}</button>
              ))}
            </div>
            {[...auctions].sort((a, b) => {
              switch (sortBy) {
                case 'time_asc':   return new Date(a.ends_at) - new Date(b.ends_at)
                case 'time_desc':  return new Date(b.ends_at) - new Date(a.ends_at)
                case 'price_asc':  return parseFloat(a.current_price) - parseFloat(b.current_price)
                case 'price_desc': return parseFloat(b.current_price) - parseFloat(a.current_price)
                case 'bids_desc':  return (parseInt(b.bid_count) || 0) - (parseInt(a.bid_count) || 0)
                default: return 0
              }
            }).map(a => (
              <AuctionCard key={a.id} auction={a} userId={userId} onBid={openBidModal} onCancel={handleCancel} onViewProfile={setProfileUserId} />
            ))}
          </>)}
        </>)}

        {/* Create auction */}
        {tab === 'create' && (
          <div className="auction-create">
            <div className="auction-create-title">➕ ВЫСТАВИТЬ РЕФЕРАЛА НА АУКЦИОН</div>

            <div className="ac-field">
              <span className="ac-field-label">ВЫБЕРИТЕ РЕФЕРАЛА</span>
              {myRefs.length === 0 ? (
                <div style={{padding:12,textAlign:'center',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans',fontSize:12}}>
                  У вас нет рефералов для продажи
                </div>
              ) : myRefs.filter(r => r.auction_eligible).length === 0 ? (
                <div style={{padding:12,textAlign:'center',color:'rgba(255,179,0,0.6)',fontFamily:'DM Sans',fontSize:12}}>
                  ⚠️ Нет подходящих рефералов. Требования: активность за {info?.min_activity_days || 7}д и мин. {info?.min_tasks || 50} заданий.
                </div>
              ) : null}

              {/* When referral is selected — show compact card with change button */}
              {selRef ? (
                <div className="ac-ref-item selected" style={{marginBottom:0}}>
                  <div className="ac-ref-avatar">{(selRef.username || selRef.first_name || '?')[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ac-ref-name">{selRef.username ? `@${selRef.username}` : selRef.first_name || 'Пользователь'}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'#00e676',marginTop:1}}>✅ {selRef.tasks_completed} заданий · активен</div>
                  </div>
                  <button
                    style={{padding:'5px 10px',border:'1px solid rgba(0,212,255,0.25)',borderRadius:8,background:'rgba(0,212,255,0.06)',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}
                    onClick={() => setSelRef(null)}
                  >✎ ИЗМЕНИТЬ</button>
                </div>
              ) : (
                /* Scrollable list sorted: eligible first */
                <div style={{maxHeight:240,overflowY:'auto'}}>
                  {[...myRefs].sort((a, b) => (b.auction_eligible ? 1 : 0) - (a.auction_eligible ? 1 : 0)).map((r, i) => {
                    const name = r.username ? `@${r.username}` : r.first_name || 'Пользователь'
                    const eligible = r.auction_eligible === true
                    return (
                      <div
                        key={i}
                        className={`ac-ref-item ${!eligible ? 'inactive' : ''}`}
                        onClick={() => eligible && setSelRef(r)}
                        style={!eligible ? {opacity:0.35,cursor:'not-allowed'} : {}}
                      >
                        <div className="ac-ref-avatar" style={eligible ? {} : {background:'rgba(255,77,106,0.08)',borderColor:'rgba(255,77,106,0.2)',color:'#ff4d6a'}}>{name[0].toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="ac-ref-name">{name}</div>
                          {eligible
                            ? <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'#00e676',marginTop:1}}>✅ {r.tasks_completed} заданий · активен</div>
                            : <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'#ff4d6a',marginTop:1}}>🚫 {r.auction_reason}</div>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="ac-field">
              <span className="ac-field-label">НАЧАЛЬНАЯ ЦЕНА (TON)</span>
              <input
                className="ac-field-input"
                type="number"
                step="0.01"
                min={info?.min_price || 0.1}
                placeholder={`мин. ${info?.min_price || 0.1} TON`}
                value={createPrice}
                onChange={e => setCreatePrice(e.target.value)}
              />
            </div>

            <div className="ac-field">
              <span className="ac-field-label">ДЛИТЕЛЬНОСТЬ</span>
              <div className="ac-dur-chips">
                {[1, 3, 6, 12, 24].map(h => (
                  <div
                    key={h}
                    className={`ac-dur-chip ${createDuration === h ? 'active' : ''}`}
                    onClick={() => setCreateDuration(h)}
                  >
                    {h}ч
                  </div>
                ))}
              </div>
            </div>

            <button
              className="ac-bid-btn"
              onClick={handleCreate}
              disabled={creating || !selRef}
              style={{marginTop:6}}
            >
              {creating ? '⏳ СОЗДАНИЕ...' : '🏛 ВЫСТАВИТЬ НА АУКЦИОН'}
            </button>
          </div>
        )}

        {/* My auctions (selling) */}
        {tab === 'selling' && (<>
          {myData.selling.length === 0 ? (
            <div className="auction-empty">
              <div className="auction-empty-icon">📦</div>
              <div className="auction-empty-text">Вы ещё не выставляли рефералов</div>
            </div>
          ) : myData.selling.map(a => (
            <AuctionCard key={a.id} auction={a} userId={userId} onBid={openBidModal} onCancel={handleCancel} onViewProfile={setProfileUserId} showSeller={false} />
          ))}
        </>)}

        {/* My bids */}
        {tab === 'bidding' && (<>
          {myData.bidding.length === 0 ? (
            <div className="auction-empty">
              <div className="auction-empty-icon">💰</div>
              <div className="auction-empty-text">Вы ещё не делали ставок</div>
            </div>
          ) : myData.bidding.map((b, i) => {
            const refName = b.ref_username ? `@${b.ref_username}` : b.ref_name || '?'
            const isWinner = b.auction_status === 'completed' && b.winner_id === userId
            const isTop = parseFloat(b.amount) >= parseFloat(b.current_price)
            return (
              <div key={i} className={`auction-card ${b.auction_status}`}>
                <div className="ac-header">
                  <div className="ac-avatar" style={{cursor:'pointer'}} onClick={() => setProfileUserId(b.referred_user_id)}>{refName[0].toUpperCase()}</div>
                  <div className="ac-info">
                    <div className="ac-name">
                      <span style={{cursor:'pointer'}} onClick={() => setProfileUserId(b.referred_user_id)}>{refName}</span>
                      {isWinner && <span className="ac-my-badge won">🏆 ПОБЕДА</span>}
                      {!isWinner && b.auction_status === 'completed' && <span className="ac-my-badge lost">ПРОИГРАНО</span>}
                      {b.auction_status === 'active' && isTop && <span className="ac-my-badge leading">ЛИДЕР</span>}
                    </div>
                    <div className="ac-seller">продавец: {b.seller_username ? `@${b.seller_username}` : b.seller_name}</div>
                  </div>
                </div>
                <div className="ac-stats">
                  <div className="ac-stat">
                    <div className="ac-stat-val price">{parseFloat(b.amount).toFixed(4)}</div>
                    <div className="ac-stat-label">ВАША СТАВКА</div>
                  </div>
                  <div className="ac-stat">
                    <div className="ac-stat-val">{parseFloat(b.current_price).toFixed(4)}</div>
                    <div className="ac-stat-label">ТЕКУЩАЯ ЦЕНА</div>
                  </div>
                </div>
                {b.auction_status === 'active' && <AuctionTimer endsAt={b.ends_at} />}
              </div>
            )
          })}
        </>)}
      </>)}

      {/* Bid Modal */}
      {bidModal && (
        <div className="bid-modal-overlay" onClick={() => setBidModal(null)}>
          <div className="bid-modal" onClick={e => e.stopPropagation()}>
            <div className="bid-modal-title">💰 СДЕЛАТЬ СТАВКУ</div>
            <div className="bid-modal-info">
              Реферал: <b>{bidModal.ref_username ? `@${bidModal.ref_username}` : bidModal.ref_name}</b><br/>
              Текущая цена: <b>{parseFloat(bidModal.current_price).toFixed(4)} TON</b><br/>
              Мин. шаг: <b>{parseFloat(bidModal.min_step).toFixed(4)} TON</b>
              {isTest && <><br/><span style={{color:'#ffb300'}}>🔬 Тестовый режим — баланс не списывается</span></>}
            </div>
            <button
              className="ac-view-profile-btn full"
              onClick={() => { setBidModal(null); setProfileUserId(bidModal.referred_user_id) }}
            >
              👤 ПОСМОТРЕТЬ АКТИВНОСТЬ РЕФЕРАЛА
            </button>
            <div className="ac-field">
              <span className="ac-field-label">СУММА СТАВКИ (TON)</span>
              <input
                className="ac-field-input"
                type="number"
                step="0.01"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="bid-modal-btns">
              <button className="ac-bid-btn cancel" onClick={() => setBidModal(null)}>ОТМЕНА</button>
              <button className="ac-bid-btn" onClick={handleBid} disabled={bidding}>
                {bidding ? '⏳...' : '✅ ПОДТВЕРДИТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Profile Modal */}
      {profileUserId && (
        <RefProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </div>
  )
}
