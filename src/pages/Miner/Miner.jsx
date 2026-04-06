import { useState, useEffect, useRef } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import api from '../../api/index'
import './Miner.css'

export default function Miner({ onBack, isAdmin }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [buying, setBuying] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [payingElec, setPayingElec] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [pending, setPending] = useState(0)
  const [projectWallet, setProjectWallet] = useState('')
  const [elecDays, setElecDays] = useState(1)
  const [collectWallet, setCollectWallet] = useState('')
  const [showCollectInput, setShowCollectInput] = useState(false)
  const [minerEnabled, setMinerEnabled] = useState(1)
  const [history, setHistory] = useState([])
  const timerRef = useRef(null)
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const load = async () => {
    try {
      const r = await api.get('/api/miner/status')
      setData(r.data)
      setPending(r.data.miner?.pendingTon || 0)
    } catch(e) { console.log('load err:', e.message) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    api.get('/api/deposit/info').then(r => setProjectWallet(r.data?.wallet || '')).catch(()=>{})
    api.get('/api/settings/miner_enabled').then(r => setMinerEnabled(parseInt(r.data?.value ?? 1))).catch(()=>{})
    api.get('/api/miner/history').then(r => setHistory(r.data || [])).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!data?.miner?.isActive) return
    const speed = parseFloat(data.miner.speed)
    timerRef.current = setInterval(() => {
      setPending(p => p + speed / 3600)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [data?.miner?.isActive, data?.miner?.speed])

  const buy = async () => {
    if (!wallet) { tonConnectUI.openModal(); showToast('Подключите кошелёк TON', true); return }
    if (!projectWallet) { showToast('Кошелёк проекта не настроен', true); return }
    setBuying(true)
    try {
      const price = data?.settings?.price ?? 1
      const amountNano = Math.floor(price * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: projectWallet, amount: amountNano }]
      })
      await api.post('/api/miner/buy', { tx_hash: result?.boc || '' })
      await load()
      api.get('/api/miner/history').then(r => setHistory(r.data || [])).catch(()=>{})
      showToast('✅ Майнер куплен!')
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('ОТМЕНЕНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Ошибка', true)
    }
    setBuying(false)
  }

  const collect = async () => {
    if (!collectWallet.trim()) { showToast('Введите адрес TON кошелька', true); return }
    setCollecting(true)
    try {
      const r = await api.post('/api/miner/collect', { wallet_address: collectWallet })
      await load()
      showToast(`✅ Запрос на вывод ${parseFloat(r.data.earned).toFixed(6)} TON создан!`)
      setShowCollectInput(false)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setCollecting(false)
  }

  const payElectricity = async (days) => {
    setPayingElec(true)
    try {
      const r = await api.post('/api/miner/electricity', { days })
      await load()
      showToast(`✅ Оплачено на ${days} дн. (${parseFloat(r.data.cost).toFixed(4)} TON)`)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setPayingElec(false)
  }

  const upgrade = async () => {
    if (!wallet) { tonConnectUI.openModal(); showToast('Подключите кошелёк TON', true); return }
    if (!projectWallet) { showToast('Кошелёк проекта не настроен', true); return }
    setUpgrading(true)
    try {
      const upgradePrice = miner?.upgradePrice ?? data?.settings?.upgradePrice ?? 0.5
      const amountNano = Math.floor(upgradePrice * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: projectWallet, amount: amountNano }]
      })
      await api.post('/api/miner/upgrade', { tx_hash: result?.boc || '' })
      await load()
      showToast('✅ Апгрейд выполнен!')
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('ОТМЕНЕНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Ошибка', true)
    }
    setUpgrading(false)
  }

  if (loading) return <div className="miner-wrap"><div className="miner-loading">⛏ Загрузка...</div></div>

  const settings = data?.settings || {}
  const miner = data?.miner
  const price = settings?.price ?? 1
  const speedBase = settings?.speedBase ?? 0.001
  const electricityHours = settings?.electricityHours ?? 24
  const minCollect = settings?.minCollect ?? 0.01

  if (minerEnabled === 0) {
    return (
      <div className="miner-wrap">
        <div className="miner-header">
          <button className="miner-back" onClick={onBack}>← НАЗАД</button>
          <div className="miner-title">⛏ МАЙНИНГ</div>
        </div>
        <div className="miner-locked">
          <div className="ml-icon">🔧</div>
          <div className="ml-title">В РАЗРАБОТКЕ</div>
          <div className="ml-desc">Раздел временно недоступен</div>
        </div>
      </div>
    )
  }

  return (
    <div className="miner-wrap">
      {toast && <div className={`miner-toast ${toastErr?'err':''}`}>{toast}</div>}
      <div className="miner-header">
        <button className="miner-back" onClick={onBack}>← НАЗАД</button>
        <div className="miner-title">⛏ МАЙНИНГ</div>
      </div>

      {!miner ? (
        <div className="miner-buy-block">
          <div className="mb-icon">⛏</div>
          <div className="mb-title">КУПИТЬ МАЙНЕР</div>
          <div className="mb-desc">Начни добывать TON автоматически 24/7</div>
          <div className="mb-stats">
            <div className="mb-stat"><div className="mb-sv">{speedBase} TON</div><div className="mb-sl">в час</div></div>
            <div className="mb-stat"><div className="mb-sv">{settings.electricityPercent ?? 10}%</div><div className="mb-sl">от заработка/день</div></div>
          </div>
          <button className="mb-buy-btn" onClick={buy} disabled={buying}>
            {buying ? 'ПОКУПКА...' : `⛏ КУПИТЬ ЗА ${price} TON`}
          </button>
        </div>
      ) : (
        <>
          {/* СТАТУС */}
          <div className={`miner-status-block ${miner.isActive ? 'active' : 'stopped'}`}>
            <div className="msb-icon">{miner.isActive ? '⛏' : '⏸'}</div>
            <div className="msb-status">{miner.isActive ? 'МАЙНИНГ АКТИВЕН' : 'МАЙНЕР ОСТАНОВЛЕН'}</div>
            {miner.electricityDue && <div className="msb-warn">⚡ Требуется оплата электричества</div>}
          </div>

          {/* НАМАЙНЕНО */}
          <div className="miner-pending">
            <div className="mp-label">НАМАЙНЕНО</div>
            <div className="mp-value">{pending.toFixed(8)} TON</div>
            <div className="mp-min">Мин. вывод: {parseFloat(minCollect).toFixed(4)} TON</div>
            {showCollectInput ? (
              <div className="mp-collect-form">
                <input
                  value={collectWallet}
                  onChange={e=>setCollectWallet(e.target.value)}
                  placeholder="Адрес TON кошелька"
                  className="mp-wallet-input"
                />
                <div className="mp-collect-btns">
                  <button className="mp-collect-btn" onClick={collect} disabled={collecting || !miner.isActive || pending < minCollect}>
                    {collecting ? '...' : '💰 ВЫВЕСТИ'}
                  </button>
                  <button className="mp-cancel-btn" onClick={()=>setShowCollectInput(false)}>✕</button>
                </div>
              </div>
            ) : (
              <button className="mp-collect-btn" onClick={()=>setShowCollectInput(true)} disabled={!miner.isActive || pending < minCollect}>
                💰 ВЫВЕСТИ НА КОШЕЛЁК
              </button>
            )}
          </div>

          {/* ИНФО */}
          <div className="miner-info">
            <div className="mi-row"><span>Уровень</span><b>LVL {miner.level}</b></div>
            <div className="mi-row"><span>Скорость</span><b>{parseFloat(miner.speed).toFixed(6)} TON/час</b></div>
            <div className="mi-row"><span>Электричество</span><b>{miner.hoursElectricity}ч / {electricityHours}ч</b></div>
            <div className="mi-row"><span>Стоимость эл-ва</span><b>{parseFloat(miner.electricityCostPerDay ?? 0).toFixed(6)} TON/день</b></div>
          </div>

          {/* ЭЛЕКТРИЧЕСТВО */}
          <div className="miner-elec-block">
            <div className="meb-title">⚡ ОПЛАТА ЭЛЕКТРИЧЕСТВА</div>
            <div className="meb-info">
              {miner.electricityDue ? '⚠️ Майнер остановлен — требуется оплата' : '✅ Активно. Можно продлить заранее'}
            </div>
            <div className="meb-cost">
              {parseFloat(miner.electricityCostPerDay ?? 0).toFixed(6)} TON/день ({miner.electricityPercent ?? 10}% от заработка)
            </div>
            <div className="meb-days">
              {[1,2,4,8,16,32].map(d => (
                <button key={d} className={`meb-day-btn ${elecDays===d?'on':''}`} onClick={()=>setElecDays(d)}>
                  {d}д
                </button>
              ))}
            </div>
            <button className="miner-elec-btn" onClick={()=>payElectricity(elecDays)} disabled={payingElec}>
              {payingElec ? '...' : `⚡ ОПЛАТИТЬ НА ${elecDays} ДНЕЙ — ${(parseFloat(miner.electricityCostPerDay ?? 0)*elecDays).toFixed(4)} TON`}
            </button>
          </div>

          {/* АПГРЕЙД */}
          <div className="miner-upgrade">
            <div className="mu-title">АПГРЕЙД МАЙНЕРА</div>
            <div className="mu-info">
              Скорость: {parseFloat(miner.speed).toFixed(6)} → {parseFloat(miner.nextSpeed ?? miner.speed).toFixed(6)} TON/ч
            </div>
            <button className="mu-btn" onClick={upgrade} disabled={upgrading}>
              {upgrading ? '...' : `⬆️ АПГРЕЙД ЗА ${parseFloat(miner.upgradePrice ?? 0.5).toFixed(4)} TON`}
            </button>
          </div>
          {/* ИСТОРИЯ */}
          <div className="miner-history">
            <div className="mh-title">📋 ИСТОРИЯ</div>
            {history.length === 0 ? (
              <div className="mh-empty">Нет записей</div>
            ) : history.map((h, i) => (
              <div key={i} className="mh-item">
                <div className="mh-icon">
                  {h.label?.includes('Куплен') ? '⛏' :
                   h.label?.includes('Апгрейд') ? '⬆️' :
                   h.label?.includes('электр') ? '⚡' :
                   h.label?.includes('Майнинг') ? '💰' : '📋'}
                </div>
                <div className="mh-info">
                  <div className="mh-label">{h.label}</div>
                  <div className="mh-date">{new Date(h.created_at).toLocaleDateString('ru', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div className={`mh-amount ${parseFloat(h.amount) > 0 ? 'pos' : 'neg'}`}>
                  {parseFloat(h.amount) > 0 ? '+' : ''}{parseFloat(h.amount).toFixed(4)} TON
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
