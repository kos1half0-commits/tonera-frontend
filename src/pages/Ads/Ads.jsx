import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/index'
import AdBanner from '../../components/AdBanner'
import './Ads.css'

let monetagHandler = null

export default function Ads() {
  const [activeTab, setActiveTab] = useState('')

  // Enabled flags
  const [adsgramEnabled, setAdsgramEnabled] = useState(true)
  const [monetagEnabled, setMontagEnabled] = useState(true)
  const [onclickaEnabled, setOnclickaEnabled] = useState(true)
  const [richadsEnabled, setRichadsEnabled] = useState(true)
  const [tadsEnabled, setTadsEnabled] = useState(true)

  // Per-network cooldowns
  const [cooldownSeconds, setCooldownSeconds] = useState(60)
  const [cooldowns, setCooldowns] = useState({
    adsgram: 0,
    monetag: 0,
    onclicka: 0,
    richads: 0,
    tads: 0,
  })
  const cooldownRefs = useRef({})

  // Adsgram state
  const [blockId, setBlockId] = useState('')
  const [adController, setAdController] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  const [error, setError] = useState('')
  const [reward, setReward] = useState(0)
  const [infoLoaded, setInfoLoaded] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [todayCount, setTodayCount] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)

  // Monetag state
  const [monetagZoneId, setMontagZoneId] = useState('')
  const [monetagReward, setMontagReward] = useState(0)
  const [monetagDailyLimit, setMontagDailyLimit] = useState(10)
  const [monetagTodayCount, setMontagTodayCount] = useState(0)
  const [monetagTotalEarned, setMontagTotalEarned] = useState(0)
  const [monetagLoading, setMontagLoading] = useState(false)
  const [monetagRewarded, setMontagRewarded] = useState(false)
  const [monetagError, setMontagError] = useState('')
  const [monetagReady, setMontagReady] = useState(false)

  // OnClickA state
  const [onclickaSpotId, setOnclickaSpotId] = useState('')
  const [onclickaReward, setOnclickaReward] = useState(0)
  const [onclickaDailyLimit, setOnclickaDailyLimit] = useState(10)
  const [onclickaTodayCount, setOnclickaTodayCount] = useState(0)
  const [onclickaTotalEarned, setOnclickaTotalEarned] = useState(0)
  const [onclickaLoading, setOnclickaLoading] = useState(false)
  const [onclickaRewarded, setOnclickaRewarded] = useState(false)
  const [onclickaError, setOnclickaError] = useState('')
  const [onclickaReady, setOnclickaReady] = useState(false)
  const onclickaShowRef = useRef(null)

  // RichAds state
  const [richadsWidgetId, setRichadsWidgetId] = useState('')
  const [richadsReward, setRichadsReward] = useState(0)
  const [richadsDailyLimit, setRichadsDailyLimit] = useState(10)
  const [richadsTodayCount, setRichadsTodayCount] = useState(0)
  const [richadsTotalEarned, setRichadsTotalEarned] = useState(0)
  const [richadsLoading, setRichadsLoading] = useState(false)
  const [richadsRewarded, setRichadsRewarded] = useState(false)
  const [richadsError, setRichadsError] = useState('')
  const [richadsReady, setRichadsReady] = useState(false)

  // Tads state
  const [tadsWidgetId, setTadsWidgetId] = useState('')
  const [tadsReward, setTadsReward] = useState(0)
  const [tadsDailyLimit, setTadsDailyLimit] = useState(10)
  const [tadsTodayCount, setTadsTodayCount] = useState(0)
  const [tadsTotalEarned, setTadsTotalEarned] = useState(0)
  const [tadsLoading, setTadsLoading] = useState(false)
  const [tadsRewarded, setTadsRewarded] = useState(false)
  const [tadsError, setTadsError] = useState('')
  const [tadsReady, setTadsReady] = useState(false)

  // Load settings
  useEffect(() => {
    api.get('/api/ads/adsgram-info').then(r => {
      const d = r.data || {}
      if (d.reward != null) setReward(parseFloat(d.reward))
      if (d.dailyLimit != null) setDailyLimit(parseInt(d.dailyLimit))
      setTodayCount(parseInt(d.todayCount) || 0)
      setTotalEarned(parseFloat(d.totalEarned) || 0)
      if (d.blockId) setBlockId(d.blockId)

      // Cooldown
      if (d.cooldownSeconds != null) setCooldownSeconds(parseInt(d.cooldownSeconds) || 60)

      // Enabled flags
      setAdsgramEnabled(d.adsgramEnabled !== false)
      setMontagEnabled(d.monetagEnabled !== false)
      setOnclickaEnabled(d.onclickaEnabled !== false)
      setRichadsEnabled(d.richadsEnabled !== false)
      setTadsEnabled(d.tadsEnabled !== false)

      // Auto-select first enabled tab
      const tabs = [
        ['adsgram', d.adsgramEnabled !== false],
        ['monetag', d.monetagEnabled !== false],
        ['onclicka', d.onclickaEnabled !== false],
        ['richads', d.richadsEnabled !== false],
        ['tads', d.tadsEnabled !== false],
      ]
      const first = tabs.find(([, en]) => en)
      setActiveTab(prev => prev || (first ? first[0] : 'adsgram'))

      // Monetag
      if (d.monetagZoneId) setMontagZoneId(d.monetagZoneId)
      if (d.monetagReward != null) setMontagReward(parseFloat(d.monetagReward))
      if (d.monetagDailyLimit != null) setMontagDailyLimit(parseInt(d.monetagDailyLimit))
      setMontagTodayCount(parseInt(d.monetagTodayCount) || 0)
      setMontagTotalEarned(parseFloat(d.monetagTotalEarned) || 0)

      // OnClickA
      if (d.onclickaSpotId) setOnclickaSpotId(d.onclickaSpotId)
      if (d.onclickaReward != null) setOnclickaReward(parseFloat(d.onclickaReward))
      if (d.onclickaDailyLimit != null) setOnclickaDailyLimit(parseInt(d.onclickaDailyLimit))
      setOnclickaTodayCount(parseInt(d.onclickaTodayCount) || 0)
      setOnclickaTotalEarned(parseFloat(d.onclickaTotalEarned) || 0)

      // RichAds
      if (d.richadsWidgetId) setRichadsWidgetId(d.richadsWidgetId)
      if (d.richadsReward != null) setRichadsReward(parseFloat(d.richadsReward))
      if (d.richadsDailyLimit != null) setRichadsDailyLimit(parseInt(d.richadsDailyLimit))
      setRichadsTodayCount(parseInt(d.richadsTodayCount) || 0)
      setRichadsTotalEarned(parseFloat(d.richadsTotalEarned) || 0)

      // Tads
      if (d.tadsWidgetId) setTadsWidgetId(d.tadsWidgetId)
      if (d.tadsReward != null) setTadsReward(parseFloat(d.tadsReward))
      if (d.tadsDailyLimit != null) setTadsDailyLimit(parseInt(d.tadsDailyLimit))
      setTadsTodayCount(parseInt(d.tadsTodayCount) || 0)
      setTadsTotalEarned(parseFloat(d.tadsTotalEarned) || 0)

      setInfoLoaded(true)
    }).catch(() => {
      setInfoLoaded(true)
    })
  }, [])

  // Init Adsgram
  useEffect(() => {
    if (!blockId) return
    const tryInit = () => {
      if (!window.Adsgram) return false
      try { setAdController(window.Adsgram.init({ blockId, debug: false })); return true } catch { return true }
    }
    if (tryInit()) return
    let a = 0; const i = setInterval(() => { a++; if (tryInit() || a >= 20) clearInterval(i) }, 500)
    return () => clearInterval(i)
  }, [blockId])

  // Init Monetag
  useEffect(() => {
    if (!monetagZoneId) return
    ;(async () => {
      try { const { default: c } = await import('monetag-tg-sdk'); monetagHandler = c(parseInt(monetagZoneId)); setMontagReady(true) } catch (e) { console.warn('Monetag init:', e) }
    })()
  }, [monetagZoneId])

  // Init OnClickA
  useEffect(() => {
    if (!onclickaSpotId) return
    ;(async () => {
      try {
        if (!document.querySelector('script[src*="onclckmn"]')) {
          const s = document.createElement('script'); s.src = 'https://js.onclckmn.com/static/onclicka.js'; s.async = true; document.head.appendChild(s)
          await new Promise((r, j) => { s.onload = r; s.onerror = j; setTimeout(r, 3000) })
        }
        let a = 0
        const i = setInterval(async () => {
          a++
          if (window.initCdTma) { clearInterval(i); try { onclickaShowRef.current = await window.initCdTma({ id: onclickaSpotId }); setOnclickaReady(true) } catch {} }
          if (a >= 15) clearInterval(i)
        }, 500)
      } catch (e) { console.warn('OnClickA init:', e) }
    })()
  }, [onclickaSpotId])

  // Init RichAds — TelegramAdsController SDK
  useEffect(() => {
    if (!richadsWidgetId) return
    const parts = richadsWidgetId.split('-')
    const pubId = parts[0]; const appId = parts[1] || ''
    if (!pubId) return
    if (document.querySelector('script[data-richads]')) { setRichadsReady(true); return }

    const s = document.createElement('script')
    s.src = 'https://richinfo.co/richpartners/telegram/js/tg-ob.js'
    s.setAttribute('data-richads', '1')
    s.onload = () => {
      // Run init in global scope via inline script, exactly as RichAds docs
      const initScript = document.createElement('script')
      initScript.textContent = `
        try {
          window._richAdsCtrl = new TelegramAdsController();
          window._richAdsCtrl.initialize({ pubId: "${pubId}", appId: "${appId}" });
        } catch(e) { console.warn('RichAds init:', e); }
      `
      document.head.appendChild(initScript)
      setRichadsReady(true)
    }
    s.onerror = () => { setRichadsReady(true) }
    document.head.appendChild(s)
  }, [richadsWidgetId])

  // Init Tads — React widget
  useEffect(() => {
    if (!tadsWidgetId) return
    setTadsReady(true)
  }, [tadsWidgetId])

  // Computed
  const remaining = Math.max(0, dailyLimit - todayCount)
  const limitPercent = dailyLimit > 0 ? Math.min(100, (todayCount / dailyLimit) * 100) : 100
  const monetagRemaining = Math.max(0, monetagDailyLimit - monetagTodayCount)
  const monetagLimitPercent = monetagDailyLimit > 0 ? Math.min(100, (monetagTodayCount / monetagDailyLimit) * 100) : 100
  const onclickaRemaining = Math.max(0, onclickaDailyLimit - onclickaTodayCount)
  const onclickaLimitPercent = onclickaDailyLimit > 0 ? Math.min(100, (onclickaTodayCount / onclickaDailyLimit) * 100) : 100
  const richadsRemaining = Math.max(0, richadsDailyLimit - richadsTodayCount)
  const richadsLimitPercent = richadsDailyLimit > 0 ? Math.min(100, (richadsTodayCount / richadsDailyLimit) * 100) : 100
  const tadsRemaining = Math.max(0, tadsDailyLimit - tadsTodayCount)
  const tadsLimitPercent = tadsDailyLimit > 0 ? Math.min(100, (tadsTodayCount / tadsDailyLimit) * 100) : 100

  const enabledFlags = [adsgramEnabled, monetagEnabled, onclickaEnabled, richadsEnabled, tadsEnabled]
  const networkCount = enabledFlags.filter(Boolean).length
  const combinedTotalEarned = totalEarned + monetagTotalEarned + onclickaTotalEarned + richadsTotalEarned + tadsTotalEarned
  const combinedTodayViews = todayCount + monetagTodayCount + onclickaTodayCount + richadsTodayCount + tadsTodayCount

  // Start per-network cooldown timer
  const startCooldown = useCallback((networkKey) => {
    if (cooldownRefs.current[networkKey]) clearInterval(cooldownRefs.current[networkKey])
    setCooldowns(prev => ({ ...prev, [networkKey]: cooldownSeconds }))
    cooldownRefs.current[networkKey] = setInterval(() => {
      setCooldowns(prev => {
        const val = prev[networkKey]
        if (val <= 1) { clearInterval(cooldownRefs.current[networkKey]); cooldownRefs.current[networkKey] = null; return { ...prev, [networkKey]: 0 } }
        return { ...prev, [networkKey]: val - 1 }
      })
    }, 1000)
  }, [cooldownSeconds])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(cooldownRefs.current).forEach(id => { if (id) clearInterval(id) })
    }
  }, [])

  // Show handlers
  const showAd = useCallback(async () => {
    if (!adController || loading || remaining <= 0 || cooldowns.adsgram > 0) return
    setLoading(true); setError('')
    try {
      await adController.show()
      const r = await api.post('/api/ads/adsgram-reward')
      setRewarded(true); setTodayCount(p => p + 1); setTotalEarned(p => p + (parseFloat(r.data?.reward) || reward))
      setTimeout(() => setRewarded(false), 5000)
      startCooldown('adsgram')
    } catch (e) {
      console.warn('Adsgram:', JSON.stringify(e))
      const dd = e?.description || e?.error || e?.message || ''
      if (dd === 'no-ads' || dd.includes('No ads')) setError('Нет доступной рекламы. Попробуйте позже')
      else if (dd === 'dismissed' || dd.includes('close')) setError('Досмотрите до конца для награды')
      else setError(e?.response?.data?.error || 'Реклама недоступна')
      setTimeout(() => setError(''), 5000)
    }
    setLoading(false)
  }, [adController, loading, remaining, reward, cooldowns.adsgram, startCooldown])

  const showMonetag = useCallback(async () => {
    if (!monetagHandler || monetagLoading || monetagRemaining <= 0 || cooldowns.monetag > 0) return
    setMontagLoading(true); setMontagError('')
    try {
      await monetagHandler()
      const r = await api.post('/api/ads/monetag-reward')
      setMontagRewarded(true); setMontagTodayCount(p => p + 1); setMontagTotalEarned(p => p + (parseFloat(r.data?.reward) || monetagReward))
      setTimeout(() => setMontagRewarded(false), 5000)
      startCooldown('monetag')
    } catch (e) { setMontagError(e?.response?.data?.error || 'Monetag недоступна'); setTimeout(() => setMontagError(''), 4000) }
    setMontagLoading(false)
  }, [monetagLoading, monetagRemaining, monetagReward, cooldowns.monetag, startCooldown])

  const showOnClickA = useCallback(async () => {
    if (!onclickaShowRef.current || onclickaLoading || onclickaRemaining <= 0 || cooldowns.onclicka > 0) return
    setOnclickaLoading(true); setOnclickaError('')
    try {
      await onclickaShowRef.current()
      const r = await api.post('/api/ads/onclicka-reward')
      setOnclickaRewarded(true); setOnclickaTodayCount(p => p + 1); setOnclickaTotalEarned(p => p + (parseFloat(r.data?.reward) || onclickaReward))
      setTimeout(() => setOnclickaRewarded(false), 5000)
      startCooldown('onclicka')
    } catch (e) { setOnclickaError(e?.response?.data?.error || 'OnClickA недоступна'); setTimeout(() => setOnclickaError(''), 4000) }
    setOnclickaLoading(false)
  }, [onclickaLoading, onclickaRemaining, onclickaReward, cooldowns.onclicka, startCooldown])

  const showRichAds = useCallback(async () => {
    if (richadsLoading || richadsRemaining <= 0 || cooldowns.richads > 0) return
    setRichadsLoading(true); setRichadsError('')
    try {
      const ctrl = window._richAdsCtrl
      if (!ctrl || !ctrl.showAd) throw { message: 'RichAds SDK ещё загружается. Подождите 5 сек и попробуйте снова' }
      let adShown = false
      await new Promise((resolve, reject) => {
        ctrl.showAd({
          onReward: () => { adShown = true; resolve() },
          onError: (e) => reject(e || { message: 'Нет доступной рекламы' }),
          onSkip: () => reject({ message: 'Досмотрите до конца для награды' }),
          onClose: () => { adShown = true; resolve() },
        })
        setTimeout(() => { if (!adShown) reject({ message: 'Реклама не загрузилась. Попробуйте позже' }) }, 30000)
      })
      const r = await api.post('/api/ads/richads-reward')
      setRichadsRewarded(true); setRichadsTodayCount(p => p + 1); setRichadsTotalEarned(p => p + (parseFloat(r.data?.reward) || richadsReward))
      setTimeout(() => setRichadsRewarded(false), 5000)
      startCooldown('richads')
    } catch (e) { setRichadsError(e?.response?.data?.error || e?.message || 'RichAds недоступна'); setTimeout(() => setRichadsError(''), 4000) }
    setRichadsLoading(false)
  }, [richadsLoading, richadsRemaining, richadsReward, cooldowns.richads, startCooldown])

  const showTads = useCallback(async () => {
    if (tadsLoading || tadsRemaining <= 0 || cooldowns.tads > 0) return
    setTadsLoading(true); setTadsError('')
    try {
      const r = await api.post('/api/ads/tads-reward')
      setTadsRewarded(true); setTadsTodayCount(p => p + 1); setTadsTotalEarned(p => p + (parseFloat(r.data?.reward) || tadsReward))
      setTimeout(() => setTadsRewarded(false), 5000)
      startCooldown('tads')
    } catch (e) { setTadsError(e?.response?.data?.error || 'Tads недоступна'); setTimeout(() => setTadsError(''), 4000) }
    setTadsLoading(false)
  }, [tadsLoading, tadsRemaining, tadsReward, cooldowns.tads, startCooldown])

  // Current tab state
  const tabMap = {
    adsgram: { rewarded, error, reward: reward },
    monetag: { rewarded: monetagRewarded, error: monetagError, reward: monetagReward },
    onclicka: { rewarded: onclickaRewarded, error: onclickaError, reward: onclickaReward },
    richads: { rewarded: richadsRewarded, error: richadsError, reward: richadsReward },
    tads: { rewarded: tadsRewarded, error: tadsError, reward: tadsReward },
  }
  const cur = tabMap[activeTab] || tabMap.adsgram

  // Helper to format cooldown as mm:ss
  const fmtCooldown = (secs) => {
    if (secs <= 0) return ''
    const m = Math.floor(secs / 60)
    const s = secs % 60
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`
    return `${s}`
  }

  // Helper to render a network tab content
  const renderNetworkContent = (cfg) => {
    const netCooldown = cooldowns[cfg.networkKey] || 0
    const isNetCooldown = netCooldown > 0
    const cooldownProgress = isNetCooldown ? ((cooldownSeconds - netCooldown) / cooldownSeconds) * 100 : 0

    return (
      <div className="ads-network-content fade-up">
        <div className={`ads-reward-info ${cfg.cls}`}>
          <div className={`ads-reward-icon ${cfg.iconCls}`}>{cfg.icon}</div>
          <div className="ads-reward-text">
            <div className="ads-reward-label">НАГРАДА ЗА ПРОСМОТР · {cfg.name}</div>
            <div className={`ads-reward-val ${cfg.valCls}`}>+{cfg.reward.toFixed(4)}<span>TON</span></div>
          </div>
        </div>
        <div className="ads-limit">
          <div className="ads-limit-header">
            <div className="ads-limit-label">ДНЕВНОЙ ЛИМИТ {cfg.name}</div>
            <div className={`ads-limit-count ${cfg.countCls}`}>{cfg.todayCount} / {cfg.dailyLimit}</div>
          </div>
          <div className="ads-limit-bar">
            <div className={`ads-limit-fill ${cfg.fillCls} ${cfg.remaining <= 0 ? 'full' : ''}`} style={{ width: cfg.limitPercent + '%' }} />
          </div>
        </div>

        {/* Cooldown progress bar */}
        {isNetCooldown && (
          <div className="ads-cooldown-bar">
            <div className="ads-cooldown-header">
              <div className="ads-cooldown-label">⏱ КУЛДАУН {cfg.name}</div>
              <div className={`ads-cooldown-time ${cfg.countCls}`}>{fmtCooldown(netCooldown)}</div>
            </div>
            <div className="ads-cooldown-track">
              <div className={`ads-cooldown-fill ${cfg.fillCls}`} style={{ width: cooldownProgress + '%' }} />
            </div>
          </div>
        )}

        <button className={`ads-watch-btn ${cfg.btnCls} ${cfg.loading ? 'loading' : ''} ${isNetCooldown ? 'cooldown' : ''}`} onClick={cfg.onClick} disabled={cfg.loading || cfg.disabled || cfg.remaining <= 0 || isNetCooldown}>
          <div className={`ads-watch-glow ${cfg.glowCls}`} />
          <div className="ads-watch-icon">{cfg.loading ? '⏳' : isNetCooldown ? '⏱' : cfg.remaining <= 0 ? '⏰' : cfg.btnIcon}</div>
          <div className="ads-watch-text">
            <span className="ads-watch-title">{cfg.loading ? 'Загрузка...' : isNetCooldown ? `Подождите ${fmtCooldown(netCooldown)}` : cfg.remaining <= 0 ? 'Лимит исчерпан' : `Смотреть ${cfg.name}`}</span>
            <span className="ads-watch-sub">{isNetCooldown ? 'Кулдаун перед следующей рекламой' : cfg.remaining <= 0 ? 'Приходите завтра' : `+${cfg.reward.toFixed(4)} TON за просмотр`}</span>
          </div>
          {cfg.remaining > 0 && !cfg.loading && !isNetCooldown && <div className="ads-watch-arrow">▸</div>}
        </button>
        <div className={`ads-earnings ${cfg.earningsCls}`}>
          <div className="ads-earnings-title">ЗАРАБОТАНО С {cfg.name}</div>
          <div className={`ads-earnings-val ${cfg.earningsGradient}`}>{cfg.totalEarned.toFixed(4)} TON</div>
          <div className="ads-earnings-sub">Начислено автоматически</div>
        </div>
        {!cfg.hasId && (
          <div style={{ textAlign:'center', padding:'20px', fontFamily:'DM Sans, sans-serif', fontSize:'12px', color:'rgba(232,242,255,0.25)' }}>
            {cfg.name} сейчас недоступен
          </div>
        )}
      </div>
    )
  }

  // Tab configs — add cooldown badge
  const tabs = [
    { key: 'adsgram', enabled: adsgramEnabled, icon: '🎬', name: 'Adsgram', badge: remaining },
    { key: 'monetag', enabled: monetagEnabled, icon: '📺', name: 'Monetag', badge: monetagRemaining },
    { key: 'onclicka', enabled: onclickaEnabled, icon: '🔵', name: 'OnClickA', badge: onclickaRemaining },
    { key: 'richads', enabled: richadsEnabled, icon: '💚', name: 'RichAds', badge: richadsRemaining },
    { key: 'tads', enabled: tadsEnabled, icon: '🟠', name: 'Tads', badge: tadsRemaining },
  ]
  const visibleTabs = tabs.filter(t => t.enabled)

  return (
    <div className="ads-page fade-up">

      {cur.rewarded && <div className="ads-toast success">✅ Награда +{cur.reward.toFixed(4)} TON получена!</div>}
      {cur.error && <div className="ads-toast error">{cur.error}</div>}

      <div className="ads-hero">
        <div className="ads-hero-icon">🎬</div>
        <div className="ads-hero-title">Смотри & Зарабатывай</div>
        <div className="ads-hero-sub">Смотрите рекламные ролики и получайте TON на баланс</div>
      </div>

      <div className="ads-stats">
        <div className="ads-stat cyan"><div className="ads-stat-val cyan">{combinedTodayViews}</div><div className="ads-stat-lbl">Сегодня</div></div>
        <div className="ads-stat green"><div className="ads-stat-val green">{combinedTotalEarned.toFixed(3)}</div><div className="ads-stat-lbl">Заработано</div></div>
        <div className="ads-stat gold"><div className="ads-stat-val gold">{networkCount}</div><div className="ads-stat-lbl">Сети</div></div>
      </div>

      {/* Network Tabs */}
      <div className="ads-net-tabs" style={{ gridTemplateColumns: `repeat(${visibleTabs.length || 1}, 1fr)` }}>
        {visibleTabs.map(t => {
          const cd = cooldowns[t.key] || 0
          return (
            <button key={t.key} className={`ads-net-tab ${activeTab === t.key ? `active ${t.key}` : ''} ${cd > 0 ? 'has-cooldown' : ''}`} onClick={() => setActiveTab(t.key)}>
              <span className="ads-net-tab-icon">{t.icon}</span>
              <span className="ads-net-tab-name">{t.name}</span>
              {cd > 0 ? (
                <span className="ads-net-tab-badge cooldown-badge">⏱{fmtCooldown(cd)}</span>
              ) : (
                <span className="ads-net-tab-badge">{t.badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Network Contents */}
      {activeTab === 'adsgram' && adsgramEnabled && renderNetworkContent({
        networkKey: 'adsgram', cls: '', iconCls: '', icon: '💰', name: 'ADSGRAM', valCls: '', countCls: '', fillCls: '', btnCls: '', glowCls: '', btnIcon: '▶️',
        earningsCls: '', earningsGradient: '', reward, todayCount, dailyLimit, remaining, limitPercent, loading, totalEarned,
        onClick: showAd, disabled: !adController, hasId: !!blockId,
      })}

      {activeTab === 'monetag' && monetagEnabled && renderNetworkContent({
        networkKey: 'monetag', cls: 'monetag', iconCls: 'monetag-icon', icon: '💎', name: 'MONETAG', valCls: 'monetag-val', countCls: 'monetag-count',
        fillCls: 'monetag-fill', btnCls: 'monetag-btn', glowCls: 'monetag-glow', btnIcon: '📺',
        earningsCls: 'monetag-earnings', earningsGradient: 'monetag-earnings-gradient',
        reward: monetagReward, todayCount: monetagTodayCount, dailyLimit: monetagDailyLimit, remaining: monetagRemaining,
        limitPercent: monetagLimitPercent, loading: monetagLoading, totalEarned: monetagTotalEarned,
        onClick: showMonetag, disabled: !monetagReady, hasId: !!monetagZoneId,
      })}

      {activeTab === 'onclicka' && onclickaEnabled && renderNetworkContent({
        networkKey: 'onclicka', cls: 'onclicka', iconCls: 'onclicka-icon', icon: '🔵', name: 'ONCLICKA', valCls: 'onclicka-val', countCls: 'onclicka-count',
        fillCls: 'onclicka-fill', btnCls: 'onclicka-btn', glowCls: 'onclicka-glow', btnIcon: '🔵',
        earningsCls: 'onclicka-earnings', earningsGradient: 'onclicka-earnings-gradient',
        reward: onclickaReward, todayCount: onclickaTodayCount, dailyLimit: onclickaDailyLimit, remaining: onclickaRemaining,
        limitPercent: onclickaLimitPercent, loading: onclickaLoading, totalEarned: onclickaTotalEarned,
        onClick: showOnClickA, disabled: !onclickaReady, hasId: !!onclickaSpotId,
      })}

      {activeTab === 'richads' && richadsEnabled && renderNetworkContent({
        networkKey: 'richads', cls: 'richads', iconCls: 'richads-icon', icon: '💚', name: 'RICHADS', valCls: 'richads-val', countCls: 'richads-count',
        fillCls: 'richads-fill', btnCls: 'richads-btn', glowCls: 'richads-glow', btnIcon: '💚',
        earningsCls: 'richads-earnings', earningsGradient: 'richads-earnings-gradient',
        reward: richadsReward, todayCount: richadsTodayCount, dailyLimit: richadsDailyLimit, remaining: richadsRemaining,
        limitPercent: richadsLimitPercent, loading: richadsLoading, totalEarned: richadsTotalEarned,
        onClick: showRichAds, disabled: !richadsReady, hasId: !!richadsWidgetId,
      })}

      {activeTab === 'tads' && tadsEnabled && renderNetworkContent({
        networkKey: 'tads', cls: 'tads', iconCls: 'tads-icon', icon: '🟠', name: 'TADS', valCls: 'tads-val', countCls: 'tads-count',
        fillCls: 'tads-fill', btnCls: 'tads-btn', glowCls: 'tads-glow', btnIcon: '🟠',
        earningsCls: 'tads-earnings', earningsGradient: 'tads-earnings-gradient',
        reward: tadsReward, todayCount: tadsTodayCount, dailyLimit: tadsDailyLimit, remaining: tadsRemaining,
        limitPercent: tadsLimitPercent, loading: tadsLoading, totalEarned: tadsTotalEarned,
        onClick: showTads, disabled: !tadsReady, hasId: !!tadsWidgetId,
      })}

      <div className="ads-banners">
        <div className="ads-banners-title">📢 СПОНСОРЫ</div>
        <AdBanner page="home" />
      </div>

      <div className="ads-howto">
        <div className="ads-howto-title">КАК ЭТО РАБОТАЕТ</div>
        <div className="ads-howto-step"><div className="ads-howto-num">1</div><div className="ads-howto-text"><div className="ads-howto-text-title">Выберите рекламную сеть</div><div className="ads-howto-text-sub">До 5 сетей — каждая с отдельным лимитом и кулдауном</div></div></div>
        <div className="ads-howto-step"><div className="ads-howto-num">2</div><div className="ads-howto-text"><div className="ads-howto-text-title">Досмотрите рекламу</div><div className="ads-howto-text-sub">Обычно это занимает 15–30 секунд</div></div></div>
        <div className="ads-howto-step"><div className="ads-howto-num">3</div><div className="ads-howto-text"><div className="ads-howto-text-title">Получите TON</div><div className="ads-howto-text-sub">Награда зачислится на баланс мгновенно</div></div></div>
      </div>

      <div className="ads-earnings total-earnings">
        <div className="ads-earnings-title">ВСЕГО ЗАРАБОТАНО С РЕКЛАМЫ</div>
        <div className="ads-earnings-val">{combinedTotalEarned.toFixed(4)} TON</div>
        <div className="ads-earnings-sub">
          {[
            adsgramEnabled && `Adsgram: ${totalEarned.toFixed(4)}`,
            monetagEnabled && `Monetag: ${monetagTotalEarned.toFixed(4)}`,
            onclickaEnabled && `OnClickA: ${onclickaTotalEarned.toFixed(4)}`,
            richadsEnabled && `RichAds: ${richadsTotalEarned.toFixed(4)}`,
            tadsEnabled && `Tads: ${tadsTotalEarned.toFixed(4)}`,
          ].filter(Boolean).join(' · ')}
        </div>
      </div>
    </div>
  )
}
