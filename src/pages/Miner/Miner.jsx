import { useState, useEffect, useRef } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import api from '../../api/index'
import './Miner.css'

const PLAN_LABELS = {
  starter:  { name: 'STARTER',  icon: '💚', gradient: 'linear-gradient(135deg,#0d9668,#0f766e)' },
  advanced: { name: 'ADVANCED', icon: '💙', gradient: 'linear-gradient(135deg,#1a5fff,#0930cc)' },
  pro:      { name: 'PRO',      icon: '💜', gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
  elite:    { name: 'ELITE',    icon: '💛', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  legacy:   { name: 'LEGACY',   icon: '⛏',  gradient: 'linear-gradient(135deg,#64748b,#475569)' },
}

export default function Miner({ onBack, isAdmin }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [buying, setBuying] = useState(null)
  const [screen, setScreen] = useState('dashboard') // dashboard | plans | history
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawWallet, setWithdrawWallet] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [liveEarned, setLiveEarned] = useState(0)
  const [minerEnabled, setMinerEnabled] = useState(1)
  const timerRef = useRef(null)
  const dataRef = useRef(null)
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const showToast = (msg, err = false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const load = async () => {
    try {
      const r = await api.get('/api/miner/dashboard')
      setData(r.data)
      dataRef.current = r.data
      setMinerEnabled(r.data.enabled)
      // Set initial live earned
      setLiveEarned(r.data.totalEarned || 0)
    } catch (e) { console.log('load err:', e.message) }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  // Live earnings ticker
  useEffect(() => {
    if (!data?.contracts?.length) return
    const activeCons = data.contracts.filter(c => c.status === 'active' && new Date(c.expires_at) > new Date())
    const totalHashrate = activeCons.reduce((s, c) => s + parseFloat(c.hashrate), 0)
    const ratePerGh = data.ratePerGh || 0.0000001
    const earnPerSecond = totalHashrate * ratePerGh / 3600

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setLiveEarned(prev => prev + earnPerSecond)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [data])

  const buyPlan = async (plan) => {
    if (!wallet) { tonConnectUI.openModal(); showToast('Подключите кошелёк TON', true); return }
    const minerWallet = data?.minerWallet
    if (!minerWallet) { showToast('Кошелёк майнера не настроен', true); return }
    setBuying(plan.id)
    try {
      const amountNano = Math.floor(plan.price * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: minerWallet, amount: amountNano }]
      })
      await api.post('/api/miner/buy', { plan_id: plan.id, tx_hash: result?.boc || '' })
      await load()
      setScreen('dashboard')
      showToast(`✅ Контракт ${plan.id.toUpperCase()} активирован!`)
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('ОТМЕНЕНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Ошибка', true)
    }
    setBuying(null)
  }

  const handleWithdraw = async () => {
    if (!withdrawWallet.trim()) { showToast('Укажите адрес кошелька', true); return }
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) { showToast('Укажите сумму', true); return }
    setWithdrawing(true)
    try {
      await api.post('/api/miner/withdraw', { amount: amt, wallet_address: withdrawWallet })
      await load()
      setShowWithdraw(false)
      setWithdrawAmount('')
      setWithdrawWallet('')
      showToast(`✅ Запрос на вывод ${amt.toFixed(6)} TON создан!`)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setWithdrawing(false)
  }

  if (loading) return <div className="mn-wrap"><div className="mn-loading">⛏ Загрузка...</div></div>

  // 0=off, 1=on, 2=admin only
  if (minerEnabled === 0 || (minerEnabled === 2 && !isAdmin)) return (
    <div className="mn-wrap">
      <div className="mn-header">
        <button className="mn-back" onClick={onBack}>← НАЗАД</button>
        <div className="mn-title">⛏ МАЙНИНГ</div>
      </div>
      <div className="mn-locked">
        <div className="mn-locked-icon">{minerEnabled === 0 ? '🔒' : '🔧'}</div>
        <div className="mn-locked-title">{minerEnabled === 0 ? 'ОТКЛЮЧЕНО' : 'В РАЗРАБОТКЕ'}</div>
        <div className="mn-locked-desc">Раздел временно недоступен</div>
      </div>
    </div>
  )

  const activeContracts = (data?.contracts || []).filter(c => c.status === 'active' && new Date(c.expires_at) > new Date())
  const totalHashrate = activeContracts.reduce((s, c) => s + parseFloat(c.hashrate), 0)
  const availableBalance = (data?.availableBalance || 0) + (liveEarned - (data?.totalEarned || 0))
  const minWithdraw = data?.minWithdraw || 0.01
  const plans = data?.plans || []
  const network = data?.network || {}

  return (
    <div className="mn-wrap">
      {toast && <div className={`mn-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="mn-header">
        <button className="mn-back" onClick={onBack}>← НАЗАД</button>
        <div className="mn-title">⛏ МАЙНИНГ</div>
        {minerEnabled === 2 && <span className="mn-admin-badge">ТЕСТ</span>}
      </div>

      {/* NAVIGATION */}
      <div className="mn-nav">
        <button className={`mn-nav-btn ${screen === 'dashboard' ? 'on' : ''}`} onClick={() => setScreen('dashboard')}>📊 ДАШБОРД</button>
        <button className={`mn-nav-btn ${screen === 'plans' ? 'on' : ''}`} onClick={() => setScreen('plans')}>🛒 ПЛАНЫ</button>
        <button className={`mn-nav-btn ${screen === 'history' ? 'on' : ''}`} onClick={() => setScreen('history')}>📋 ИСТОРИЯ</button>
      </div>

      {/* ========== DASHBOARD ========== */}
      {screen === 'dashboard' && (
        <>
          {activeContracts.length === 0 ? (
            <div className="mn-empty">
              <div className="mn-empty-icon">⛏</div>
              <div className="mn-empty-title">ОБЛАЧНЫЙ МАЙНИНГ TON</div>
              <div className="mn-empty-desc">
                Покупайте хешрейт и зарабатывайте TON автоматически 24/7.
                Без оборудования, без затрат на электричество.
              </div>
              <button className="mn-empty-btn" onClick={() => setScreen('plans')}>
                🛒 ВЫБРАТЬ ПЛАН
              </button>
            </div>
          ) : (
            <>
              {/* MINING STATUS */}
              <div className="mn-status-card">
                <div className="mn-status-pulse"></div>
                <div className="mn-status-label">МАЙНИНГ АКТИВЕН</div>
                <div className="mn-hash-counter">{totalHashrate.toFixed(0)} GH/s</div>
                <div className="mn-hash-label">ОБЩИЙ ХЕШРЕЙТ</div>
              </div>

              {/* EARNINGS */}
              <div className="mn-earnings">
                <div className="mn-earn-label">ДОБЫТО</div>
                <div className="mn-earn-value">{liveEarned.toFixed(8)} TON</div>
                <div className="mn-earn-available">
                  Доступно к выводу: <strong>{Math.max(0, availableBalance).toFixed(6)} TON</strong>
                </div>

                {showWithdraw ? (
                  <div className="mn-withdraw-form">
                    <input
                      value={withdrawWallet}
                      onChange={e => setWithdrawWallet(e.target.value)}
                      placeholder="Адрес TON кошелька"
                      className="mn-input"
                    />
                    <input
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder={`Сумма (мин. ${minWithdraw})`}
                      type="number"
                      className="mn-input"
                    />
                    <div className="mn-withdraw-btns">
                      <button className="mn-btn-withdraw" onClick={handleWithdraw} disabled={withdrawing}>
                        {withdrawing ? '...' : '💰 ОТПРАВИТЬ'}
                      </button>
                      <button className="mn-btn-cancel" onClick={() => setShowWithdraw(false)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="mn-btn-withdraw"
                    onClick={() => setShowWithdraw(true)}
                    disabled={availableBalance < minWithdraw}
                  >
                    💰 ВЫВЕСТИ НА КОШЕЛЁК
                  </button>
                )}
              </div>

              {/* PENDING WITHDRAWALS */}
              {data?.pendingWithdrawals?.length > 0 && (
                <div className="mn-pending-wd">
                  <div className="mn-section-title">⏳ ОЖИДАЮТ ВЫПЛАТЫ</div>
                  {data.pendingWithdrawals.map(w => (
                    <div key={w.id} className="mn-wd-item">
                      <div className="mn-wd-amount">{parseFloat(w.amount).toFixed(6)} TON</div>
                      <div className="mn-wd-addr">{w.wallet_address.slice(0, 12)}...{w.wallet_address.slice(-6)}</div>
                      <div className="mn-wd-date">{new Date(w.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIVE CONTRACTS */}
              <div className="mn-section-title">⛏ АКТИВНЫЕ КОНТРАКТЫ</div>
              {activeContracts.map(c => {
                const daysLeft = Math.max(0, Math.ceil((new Date(c.expires_at) - new Date()) / 86400000))
                const progress = Math.min(100, ((c.duration_days - daysLeft) / c.duration_days) * 100)
                const label = PLAN_LABELS[c.plan_id] || PLAN_LABELS.legacy
                return (
                  <div key={c.id} className="mn-contract-card">
                    <div className="mn-contract-header">
                      <span className="mn-contract-plan" style={{ background: label.gradient }}>
                        {label.icon} {label.name}
                      </span>
                      <span className="mn-contract-days">{daysLeft}д осталось</span>
                    </div>
                    <div className="mn-contract-stats">
                      <div>
                        <div className="mn-cs-val">{parseFloat(c.hashrate).toFixed(0)} GH/s</div>
                        <div className="mn-cs-lbl">хешрейт</div>
                      </div>
                      <div>
                        <div className="mn-cs-val earned">{parseFloat(c.totalContractEarned || c.earned).toFixed(6)}</div>
                        <div className="mn-cs-lbl">добыто TON</div>
                      </div>
                    </div>
                    <div className="mn-progress-bar">
                      <div className="mn-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )
              })}

              {/* NETWORK STATS */}
              <div className="mn-section-title">🌐 СТАТИСТИКА СЕТИ</div>
              <div className="mn-network">
                <div className="mn-net-item">
                  <div className="mn-net-val">{parseFloat(network.hashrate || 0).toFixed(0)}</div>
                  <div className="mn-net-lbl">GH/s сеть</div>
                </div>
                <div className="mn-net-item">
                  <div className="mn-net-val">{network.miners || 0}</div>
                  <div className="mn-net-lbl">майнеров</div>
                </div>
                <div className="mn-net-item">
                  <div className="mn-net-val">{parseFloat(network.totalMined || 0).toFixed(4)}</div>
                  <div className="mn-net-lbl">добыто TON</div>
                </div>
              </div>

              <button className="mn-btn-buy-more" onClick={() => setScreen('plans')}>
                🛒 КУПИТЬ ЕЩЁ КОНТРАКТ
              </button>
            </>
          )}
        </>
      )}

      {/* ========== PLANS ========== */}
      {screen === 'plans' && (
        <div className="mn-plans">
          <div className="mn-plans-title">ВЫБЕРИТЕ ПЛАН</div>
          <div className="mn-plans-subtitle">Покупайте хешрейт и зарабатывайте TON автоматически</div>
          {plans.map(plan => {
            const label = PLAN_LABELS[plan.id] || PLAN_LABELS.starter
            const ratePerGh = data?.ratePerGh || 0.0000001
            const dailyEarning = plan.hashrate * ratePerGh * 24
            const totalEarning = dailyEarning * plan.days
            return (
              <div key={plan.id} className="mn-plan-card" style={{ '--plan-gradient': label.gradient }}>
                <div className="mn-plan-header" style={{ background: label.gradient }}>
                  <span className="mn-plan-icon">{label.icon}</span>
                  <span className="mn-plan-name">{label.name}</span>
                </div>
                <div className="mn-plan-body">
                  <div className="mn-plan-stats">
                    <div className="mn-plan-stat">
                      <div className="mn-ps-val">{plan.hashrate} GH/s</div>
                      <div className="mn-ps-lbl">хешрейт</div>
                    </div>
                    <div className="mn-plan-stat">
                      <div className="mn-ps-val">{plan.days} дн.</div>
                      <div className="mn-ps-lbl">срок</div>
                    </div>
                    <div className="mn-plan-stat">
                      <div className="mn-ps-val">{dailyEarning.toFixed(6)}</div>
                      <div className="mn-ps-lbl">TON/день</div>
                    </div>
                  </div>
                  <div className="mn-plan-forecast">
                    Прогноз дохода: <strong>{totalEarning.toFixed(6)} TON</strong>
                  </div>
                  <button
                    className="mn-plan-buy"
                    style={{ background: label.gradient }}
                    onClick={() => buyPlan(plan)}
                    disabled={buying === plan.id}
                  >
                    {buying === plan.id ? 'ПОКУПКА...' : `⛏ КУПИТЬ ЗА ${plan.price} TON`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========== HISTORY ========== */}
      {screen === 'history' && <MinerHistory />}
    </div>
  )
}

function MinerHistory() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('contracts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/miner/history').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="mn-loading">Загрузка...</div>

  const contracts = data?.contracts || []
  const withdrawals = data?.withdrawals || []

  return (
    <div>
      <div className="mn-hist-tabs">
        <button className={`mn-hist-tab ${tab === 'contracts' ? 'on' : ''}`} onClick={() => setTab('contracts')}>
          ⛏ Контракты ({contracts.length})
        </button>
        <button className={`mn-hist-tab ${tab === 'withdrawals' ? 'on' : ''}`} onClick={() => setTab('withdrawals')}>
          💰 Выводы ({withdrawals.length})
        </button>
      </div>

      {tab === 'contracts' && (
        contracts.length === 0
          ? <div className="mn-hist-empty">Нет контрактов</div>
          : contracts.map(c => {
            const label = PLAN_LABELS[c.plan_id] || PLAN_LABELS.legacy
            const isActive = c.status === 'active' && new Date(c.expires_at) > new Date()
            return (
              <div key={c.id} className={`mn-hist-item ${isActive ? 'active' : 'expired'}`}>
                <div className="mn-hi-icon" style={{ background: label.gradient }}>{label.icon}</div>
                <div className="mn-hi-info">
                  <div className="mn-hi-title">{label.name} · {parseFloat(c.hashrate).toFixed(0)} GH/s</div>
                  <div className="mn-hi-sub">{c.duration_days}д · {isActive ? 'Активен' : 'Истёк'}</div>
                </div>
                <div className="mn-hi-earned">
                  <div className="mn-hi-amt">{parseFloat(c.earned).toFixed(6)}</div>
                  <div className="mn-hi-cur">TON</div>
                </div>
              </div>
            )
          })
      )}

      {tab === 'withdrawals' && (
        withdrawals.length === 0
          ? <div className="mn-hist-empty">Нет выводов</div>
          : withdrawals.map(w => (
            <div key={w.id} className={`mn-hist-item ${w.status}`}>
              <div className={`mn-hi-icon status-${w.status}`}>
                {w.status === 'completed' ? '✅' : w.status === 'pending' ? '⏳' : '❌'}
              </div>
              <div className="mn-hi-info">
                <div className="mn-hi-title">{parseFloat(w.amount).toFixed(6)} TON</div>
                <div className="mn-hi-sub">
                  {w.wallet_address.slice(0, 10)}...
                  · {new Date(w.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className={`mn-hi-status ${w.status}`}>
                {w.status === 'completed' ? 'ВЫПЛАЧЕНО' : w.status === 'pending' ? 'ОЖИДАЕТ' : 'ОТКЛОНЕНО'}
              </div>
            </div>
          ))
      )}
    </div>
  )
}
