import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import api from '../../api/index'
import './Miner.css'

const PLAN_LABELS = {
  free:     { name: 'FREE',     icon: '🆓', gradient: 'linear-gradient(135deg,#065a24,#04401a)' },
  starter:  { name: 'STARTER',  icon: '💚', gradient: 'linear-gradient(135deg,#074d38,#053828)' },
  advanced: { name: 'ADVANCED', icon: '💙', gradient: 'linear-gradient(135deg,#0a2d75,#061850)' },
  pro:      { name: 'PRO',      icon: '💜', gradient: 'linear-gradient(135deg,#42206e,#2a1055)' },
  elite:    { name: 'ELITE',    icon: '💛', gradient: 'linear-gradient(135deg,#7a4805,#4d2e03)' },
  legacy:   { name: 'LEGACY',   icon: '⛏',  gradient: 'linear-gradient(135deg,#3a4558,#232d3e)' },
}

// ========== REAL-TIME LIVE COUNTER ==========
const LiveCounter = memo(function LiveCounter({ baseValue, earnPerMs }) {
  const ref = useRef(null)
  const startTimeRef = useRef(performance.now())
  const baseRef = useRef(baseValue)
  const rateRef = useRef(earnPerMs)
  const rafRef = useRef(null)
  const prevDigitsRef = useRef('')

  // Update refs when props change
  useEffect(() => {
    baseRef.current = baseValue
    rateRef.current = earnPerMs
    startTimeRef.current = performance.now()
  }, [baseValue, earnPerMs])

  useEffect(() => {
    const update = () => {
      const elapsed = performance.now() - startTimeRef.current
      const current = baseRef.current + rateRef.current * elapsed
      if (ref.current) {
        const str = current.toFixed(10)
        // Only update DOM if digits actually changed
        if (str !== prevDigitsRef.current) {
          prevDigitsRef.current = str
          // Split into integer and decimal parts
          const [intPart, decPart] = str.split('.')
          let html = ''
          // Integer part
          for (const d of intPart) {
            html += `<span class="mn-digit">${d}</span>`
          }
          html += '<span class="mn-dot">.</span>'
          // Decimal part — first 4 digits brighter, last 6 dimmer and faster
          for (let i = 0; i < decPart.length; i++) {
            const cls = i < 4 ? 'mn-digit' : i < 7 ? 'mn-digit dim' : 'mn-digit tick'
            html += `<span class="${cls}">${decPart[i]}</span>`
          }
          ref.current.innerHTML = html
        }
      }
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return <div ref={ref} className="mn-live-digits" />
})

// Speed indicator component
function MiningSpeed({ earnPerSecond }) {
  const perMin = earnPerSecond * 60
  const perHour = earnPerSecond * 3600
  const perDay = earnPerSecond * 86400
  return (
    <div className="mn-speed-grid">
      <div className="mn-speed-item">
        <div className="mn-speed-val">{earnPerSecond.toFixed(10)}</div>
        <div className="mn-speed-unit">TON / сек</div>
      </div>
      <div className="mn-speed-item">
        <div className="mn-speed-val">{perMin.toFixed(8)}</div>
        <div className="mn-speed-unit">TON / мин</div>
      </div>
      <div className="mn-speed-item">
        <div className="mn-speed-val">{perHour.toFixed(6)}</div>
        <div className="mn-speed-unit">TON / час</div>
      </div>
      <div className="mn-speed-item">
        <div className="mn-speed-val">{perDay.toFixed(4)}</div>
        <div className="mn-speed-unit">TON / день</div>
      </div>
    </div>
  )
}

export default function Miner({ onBack, isAdmin }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [buying, setBuying] = useState(null)
  const [activatingFree, setActivatingFree] = useState(false)
  const [screen, setScreen] = useState('dashboard') // dashboard | plans | history
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawWallet, setWithdrawWallet] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [minerEnabled, setMinerEnabled] = useState(1)
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  // Realtime mining calculation values
  const [baseEarned, setBaseEarned] = useState(0)
  const [baseAvailable, setBaseAvailable] = useState(0)
  const [earnPerMs, setEarnPerMs] = useState(0)
  const [earnPerSecond, setEarnPerSecond] = useState(0)

  const showToast = (msg, err = false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const load = async () => {
    try {
      const r = await api.get('/api/miner/dashboard')
      setData(r.data)
      setMinerEnabled(r.data.enabled)
      // Calculate real-time rate
      const activeCons = (r.data.contracts || []).filter(
        c => c.status === 'active' && new Date(c.expires_at) > new Date()
      )
      const totalHashrate = activeCons.reduce((s, c) => s + parseFloat(c.hashrate), 0)
      const ratePerGh = r.data.ratePerGh || 0.0000001
      const eps = totalHashrate * ratePerGh / 3600
      setEarnPerSecond(eps)
      setEarnPerMs(eps / 1000)
      setBaseEarned(r.data.totalEarned || 0)
      setBaseAvailable(r.data.availableBalance || 0)
    } catch (e) { console.log('load err:', e.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Refresh data every 60 seconds to stay in sync with server
  useEffect(() => {
    const interval = setInterval(() => { load() }, 60000)
    return () => clearInterval(interval)
  }, [])

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

  const activateFreePlan = async () => {
    setActivatingFree(true)
    try {
      await api.post('/api/miner/free')
      await load()
      setScreen('dashboard')
      showToast('✅ Бесплатный тариф активирован!')
    } catch (e) {
      showToast(e?.response?.data?.error || 'Ошибка', true)
    }
    setActivatingFree(false)
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
  const availableBalance = data?.availableBalance || 0
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
              {data?.freePlan?.enabled && !data?.freeUsed && (
                <button
                  className="mn-empty-btn free"
                  onClick={activateFreePlan}
                  disabled={activatingFree}
                >
                  {activatingFree ? 'АКТИВАЦИЯ...' : `🆓 НАЧАТЬ БЕСПЛАТНО · ${data.freePlan.hashrate} GH/s`}
                </button>
              )}
              <button className="mn-empty-btn secondary" onClick={() => setScreen('plans')}>
                🛒 ВЫБРАТЬ ПЛАН
              </button>
            </div>
          ) : (
            <>
              {/* MINING STATUS */}
              <div className="mn-status-card">
                <div className="mn-status-pulse"></div>
                <div className="mn-status-label">МАЙНИНГ АКТИВЕН</div>
                <div className="mn-hash-ring">
                  <div className="mn-hash-ring-inner">
                    <div className="mn-hash-counter">{totalHashrate.toFixed(0)}</div>
                    <div className="mn-hash-label">GH/s</div>
                  </div>
                </div>
              </div>

              {/* EARNINGS — REAL-TIME */}
              <div className="mn-earnings">
                <div className="mn-earn-label">ДОБЫТО ВСЕГО</div>
                <div className="mn-live-wrap">
                  <LiveCounter baseValue={baseEarned} earnPerMs={earnPerMs} />
                  <span className="mn-live-currency">TON</span>
                </div>
                <MiningSpeed earnPerSecond={earnPerSecond} />
                <div className="mn-earn-divider" />
                <div className="mn-earn-label avail">ДОСТУПНО К ВЫВОДУ</div>
                <div className="mn-live-wrap avail">
                  <LiveCounter baseValue={baseAvailable} earnPerMs={earnPerMs} />
                  <span className="mn-live-currency">TON</span>
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

          {/* FREE PLAN CARD */}
          {data?.freePlan?.enabled && (() => {
            const fp = data.freePlan
            const ratePerGh = data?.ratePerGh || 0.0000001
            const dailyEarning = fp.hashrate * ratePerGh * 24
            const totalEarning = dailyEarning * fp.days
            const alreadyUsed = data?.freeUsed
            return (
              <div className="mn-plan-card mn-plan-free" style={{ '--plan-gradient': 'linear-gradient(135deg,#065a24,#04401a)' }}>
                <div className="mn-plan-header" style={{ background: 'linear-gradient(135deg,#065a24,#04401a)' }}>
                  <span className="mn-plan-icon">🆓</span>
                  <span className="mn-plan-name">FREE</span>
                  <span className="mn-free-badge">БЕСПЛАТНО</span>
                </div>
                <div className="mn-plan-body">
                  <div className="mn-plan-stats">
                    <div className="mn-plan-stat">
                      <div className="mn-ps-val">{fp.hashrate} GH/s</div>
                      <div className="mn-ps-lbl">хешрейт</div>
                    </div>
                    <div className="mn-plan-stat">
                      <div className="mn-ps-val">{fp.days} дн.</div>
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
                    className="mn-plan-buy mn-plan-buy-free"
                    style={{ background: 'linear-gradient(135deg,#065a24,#0a7e34)' }}
                    onClick={activateFreePlan}
                    disabled={alreadyUsed || activatingFree}
                  >
                    {alreadyUsed ? '✅ УЖЕ АКТИВИРОВАН' : activatingFree ? 'АКТИВАЦИЯ...' : '🆓 НАЧАТЬ БЕСПЛАТНО'}
                  </button>
                </div>
              </div>
            )
          })()}

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
