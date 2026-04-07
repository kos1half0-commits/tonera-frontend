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
  const [upgrading, setUpgrading] = useState(false)
  const [pending, setPending] = useState(0)
  const [projectWallet, setProjectWallet] = useState('')
  const [minerEnabled, setMinerEnabled] = useState(1)
  const [collectWallet, setCollectWallet] = useState('')
  const [showCollectInput, setShowCollectInput] = useState(false)
  const [history, setHistory] = useState([])
  const timerRef = useRef(null)
  const speedRef = useRef(0)
  const isFirstLoad = useRef(true)
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
      if (isFirstLoad.current && r.data.miner) {
        setPending(r.data.miner.pendingTon || 0)
        isFirstLoad.current = false
      }
    } catch(e) { console.log('load err:', e.message) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    api.get('/api/deposit/info').then(r => setProjectWallet(r.data?.wallet||'')).catch(()=>{})
    api.get('/api/settings/miner_enabled').then(r => setMinerEnabled(parseInt(r.data?.value??1))).catch(()=>{})
    api.get('/api/miner/history').then(r => setHistory(r.data||[])).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!data?.miner) return
    const speed = parseFloat(data.miner.speed)
    speedRef.current = speed
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setPending(p => p + speedRef.current / 3600)
      }, 1000)
    }
    return () => {}
  }, [data?.miner?.speed])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const buy = async () => {
    if (!wallet) { tonConnectUI.openModal(); showToast('Підключіть гаманець TON', true); return }
    if (!projectWallet) { showToast('Гаманець проекту не налаштовано', true); return }
    setBuying(true)
    try {
      const price = data?.settings?.price ?? 1
      const amountNano = Math.floor(price * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: projectWallet, amount: amountNano }]
      })
      await api.post('/api/miner/buy', { tx_hash: result?.boc || '' })
      isFirstLoad.current = true
      await load()
      api.get('/api/miner/history').then(r => setHistory(r.data||[])).catch(()=>{})
      showToast('✅ Майнер куплено! LVL 1')
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('СКАСОВАНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Помилка', true)
    }
    setBuying(false)
  }

  const collect = async () => {
    if (!collectWallet.trim()) { showToast('Введіть адресу TON гаманця', true); return }
    setCollecting(true)
    try {
      const r = await api.post('/api/miner/collect', { wallet_address: collectWallet })
      setPending(0)
      isFirstLoad.current = false
      await load()
      api.get('/api/miner/history').then(r => setHistory(r.data||[])).catch(()=>{})
      showToast(`✅ Запит на вивід ${parseFloat(r.data.earned).toFixed(6)} TON створено!`)
      setShowCollectInput(false)
    } catch (e) { showToast(e?.response?.data?.error || 'Помилка', true) }
    setCollecting(false)
  }

  const upgrade = async () => {
    if (!wallet) { tonConnectUI.openModal(); showToast('Підключіть гаманець TON', true); return }
    if (!projectWallet) { showToast('Гаманець проекту не налаштовано', true); return }
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
      api.get('/api/miner/history').then(r => setHistory(r.data||[])).catch(()=>{})
      showToast('✅ Апгрейд виконано!')
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('СКАСОВАНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Помилка', true)
    }
    setUpgrading(false)
  }

  if (loading) return <div className="miner-wrap"><div className="miner-loading">⛏ Завантаження...</div></div>

  const settings = data?.settings || {}
  const miner = data?.miner
  const price = settings?.price ?? 1
  const speedBase = settings?.speedBase ?? 0.001
  const minCollect = settings?.minCollect ?? 0.01

  if (minerEnabled === 0) return (
    <div className="miner-wrap">
      <div className="miner-header">
        <button className="miner-back" onClick={onBack}>← НАЗАД</button>
        <div className="miner-title">⛏ МАЙНІНГ</div>
      </div>
      <div className="miner-locked">
        <div className="ml-icon">🔧</div>
        <div className="ml-title">В РОЗРОБЦІ</div>
        <div className="ml-desc">Розділ тимчасово недоступний</div>
      </div>
    </div>
  )

  return (
    <div className="miner-wrap">
      {toast && <div className={`miner-toast ${toastErr?'err':''}`}>{toast}</div>}
      <div className="miner-header">
        <button className="miner-back" onClick={onBack}>← НАЗАД</button>
        <div className="miner-title">⛏ МАЙНІНГ</div>
      </div>

      {!miner ? (
        <>
          <div className="miner-how">
            <div className="mhow-title">ЯК ПРАЦЮЄ МАЙНЕР</div>
            <div className="mhow-step"><span>1</span><div><b>Купи майнер</b> через TON Connect — разова оплата</div></div>
            <div className="mhow-step"><span>2</span><div><b>Майнер добуває TON</b> автоматично кожну годину</div></div>
            <div className="mhow-step"><span>3</span><div><b>Виводь дохід</b> на свій TON гаманець коли набереться мінімальна сума</div></div>
            <div className="mhow-step"><span>4</span><div><b>Покращуй майнер</b> через TON Connect — кожен апгрейд збільшує швидкість</div></div>
          </div>

          <div className="miner-buy-block">
            <div className="mb-icon">⛏</div>
            <div className="mb-title">КУПИТИ МАЙНЕР</div>
            <div className="mb-desc">Почни добувати TON автоматично 24/7</div>
            <div className="mb-stats">
              <div className="mb-stat"><div className="mb-sv">{speedBase} TON</div><div className="mb-sl">в годину</div></div>
              <div className="mb-stat"><div className="mb-sv">LVL 1</div><div className="mb-sl">початковий рівень</div></div>
            </div>
            <button className="mb-buy-btn" onClick={buy} disabled={buying}>
              {buying ? 'КУПІВЛЯ...' : `⛏ КУПИТИ ЗА ${price} TON`}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* СТАТУС */}
          <div className="miner-status-block active">
            <div className="msb-icon">⛏</div>
            <div className="msb-status">МАЙНЕР АКТИВНИЙ · LVL {miner.level}</div>
          </div>

          {/* НАМАЙНОВАНО */}
          <div className="miner-pending">
            <div className="mp-label">НАМАЙНОВАНО</div>
            <div className="mp-value">{pending.toFixed(8)} TON</div>
            <div className="mp-min">Мін. вивід: {parseFloat(minCollect).toFixed(4)} TON</div>
            {showCollectInput ? (
              <div className="mp-collect-form">
                <input value={collectWallet} onChange={e=>setCollectWallet(e.target.value)}
                  placeholder="Адреса TON гаманця" className="mp-wallet-input"/>
                <div className="mp-collect-btns">
                  <button className="mp-collect-btn" onClick={collect} disabled={collecting || pending < minCollect}>
                    {collecting ? '...' : '💰 ВИВЕСТИ'}
                  </button>
                  <button className="mp-cancel-btn" onClick={()=>setShowCollectInput(false)}>✕</button>
                </div>
              </div>
            ) : (
              <button className="mp-collect-btn" onClick={()=>setShowCollectInput(true)} disabled={pending < minCollect}>
                💰 ВИВЕСТИ НА ГАМАНЕЦЬ
              </button>
            )}
          </div>

          {/* ІНФО */}
          <div className="miner-info">
            <div className="mi-row"><span>Рівень</span><b>LVL {miner.level}</b></div>
            <div className="mi-row"><span>Швидкість</span><b>{parseFloat(miner.speed).toFixed(6)} TON/год</b></div>
            <div className="mi-row"><span>На день</span><b>{(parseFloat(miner.speed)*24).toFixed(6)} TON</b></div>
          </div>

          {/* АПГРЕЙД */}
          <div className="miner-upgrade">
            <div className="mu-title">АПГРЕЙД МАЙНЕРА</div>
            <div className="mu-info">
              LVL {miner.level} → LVL {miner.level+1} · {parseFloat(miner.speed).toFixed(6)} → {parseFloat(miner.nextSpeed??miner.speed).toFixed(6)} TON/год
            </div>
            <button className="mu-btn" onClick={upgrade} disabled={upgrading}>
              {upgrading ? '...' : `⬆️ АПГРЕЙД ЗА ${parseFloat(miner.upgradePrice??0.5).toFixed(4)} TON`}
            </button>
          </div>

          {/* ІСТОРІЯ */}
          <div className="miner-history">
            <div className="mh-title">📋 ІСТОРІЯ</div>
            {history.length === 0
              ? <div className="mh-empty">Немає записів</div>
              : history.map((h,i) => (
                <div key={i} className="mh-item">
                  <div className="mh-icon">
                    {h.type==='miner_buy'?'⛏':h.type==='miner_upgrade'?'⬆️':'💰'}
                  </div>
                  <div className="mh-info">
                    <div className="mh-label">{h.label?.split('→')[0] || h.label}</div>
                    <div className="mh-date">{new Date(h.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div className={`mh-amount ${parseFloat(h.amount)>0?'pos':'neg'}`}>
                    {parseFloat(h.amount)>0?'+':''}{parseFloat(h.amount).toFixed(4)} TON
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}
