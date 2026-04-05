import { useState, useEffect, useRef } from 'react'
import { useTonConnectUI } from '@tonconnect/ui-react'
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
  const [tonConnectUI] = useTonConnectUI()
  const [projectWallet, setProjectWallet] = useState('')
  const timerRef = useRef(null)

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  useEffect(() => { api.get('/api/deposit/info').then(r => setProjectWallet(r.data?.wallet || '')).catch(()=>{}) }, [])

  const load = async () => {
    try {
      const r = await api.get('/api/miner/status')
      setData(r.data)
      setPending(r.data.miner?.pendingTon || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (!data?.miner?.isActive) return
    const speed = parseFloat(data.miner.speed)
    timerRef.current = setInterval(() => {
      setPending(p => p + speed / 3600)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [data?.miner?.isActive, data?.miner?.speed])

  const buy = async () => {
    if (!projectWallet) { showToast('Кошелёк не настроен', true); return }
    setBuying(true)
    try {
      const amountNano = Math.floor(data.settings.price * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: projectWallet, amount: amountNano }]
      })
      await api.post('/api/miner/buy', { tx_hash: result?.boc || '' })
      await load()
      showToast('✅ Майнер куплен!')
    } catch (e) {
      if (e?.message?.includes('User rejects')) showToast('ОТМЕНЕНО', true)
      else showToast(e?.response?.data?.error || 'Ошибка', true)
    }
    setBuying(false)
  }

  const collect = async () => {
    setCollecting(true)
    try {
      const r = await api.post('/api/miner/collect')
      await load()
      showToast(`✅ Собрано ${parseFloat(r.data.earned).toFixed(6)} TON!`)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setCollecting(false)
  }

  const payElectricity = async () => {
    setPayingElec(true)
    try { await api.post('/api/miner/electricity'); await load(); showToast('✅ Электричество оплачено!') }
    catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setPayingElec(false)
  }

  const upgrade = async () => {
    setUpgrading(true)
    try {
      const r = await api.post('/api/miner/upgrade')
      await load()
      showToast(`✅ Апгрейд до уровня ${r.data.newLevel}!`)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setUpgrading(false)
  }

  if (loading) return (
    <div className="miner-wrap">
      <div className="miner-loading">⛏ Загрузка...</div>
    </div>
  )

  const { settings, hasDeposit, miner } = data || {}
  const enabled = settings?.enabled

  if (enabled === 0 || (enabled === 2 && !isAdmin)) {
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
            <div className="mb-stat">
              <div className="mb-sv">{settings?.speedBase} TON</div>
              <div className="mb-sl">в час</div>
            </div>
            <div className="mb-stat">
              <div className="mb-sv">{settings?.electricityCost} TON</div>
              <div className="mb-sl">электричество/{settings?.electricityHours}ч</div>
            </div>
          </div>
          <button className="mb-buy-btn" onClick={buy} disabled={buying}>
            {buying ? 'ПОКУПКА...' : `⛏ КУПИТЬ ЗА ${settings?.price} TON`}
          </button>
        </div>
      ) : (
        <>
          <div className={`miner-status-block ${miner.isActive ? 'active' : 'stopped'}`}>
            <div className="msb-icon">{miner.isActive ? '⛏' : '⏸'}</div>
            <div className="msb-status">{miner.isActive ? 'МАЙНИНГ АКТИВЕН' : 'МАЙНЕР ОСТАНОВЛЕН'}</div>
            {miner.electricityDue && <div className="msb-warn">⚡ Требуется оплата электричества</div>}
          </div>

          <div className="miner-pending">
            <div className="mp-label">НАМАЙНЕНО</div>
            <div className="mp-value">{pending.toFixed(8)} TON</div>
            <button className="mp-collect-btn" onClick={collect} disabled={collecting || !miner.isActive || pending < 0.000001}>
              {collecting ? '...' : '💰 СОБРАТЬ'}
            </button>
          </div>

          <div className="miner-info">
            <div className="mi-row"><span>Уровень</span><b>LVL {miner.level}</b></div>
            <div className="mi-row"><span>Скорость</span><b>{parseFloat(miner.speed).toFixed(6)} TON/час</b></div>
            <div className="mi-row"><span>Электричество</span><b>{miner.hoursElectricity}ч / {settings?.electricityHours}ч</b></div>
          </div>

          {miner.electricityDue && (
            <button className="miner-elec-btn" onClick={payElectricity} disabled={payingElec}>
              {payingElec ? '...' : `⚡ ОПЛАТИТЬ ${settings?.electricityCost} TON`}
            </button>
          )}

          <div className="miner-upgrade">
            <div className="mu-title">АПГРЕЙД МАЙНЕРА</div>
            <div className="mu-info">
              <span>Скорость: {parseFloat(miner.speed).toFixed(6)} → {parseFloat(miner.nextSpeed).toFixed(6)} TON/ч</span>
            </div>
            <button className="mu-btn" onClick={upgrade} disabled={upgrading}>
              {upgrading ? '...' : `⬆️ АПГРЕЙД ЗА ${parseFloat(miner.upgradePrice).toFixed(4)} TON`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
