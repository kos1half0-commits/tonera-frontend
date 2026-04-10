import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/index'
import AdBanner from '../../components/AdBanner'
import './Ads.css'

let monetagHandler = null

export default function Ads({ onBack }) {
  const [activeTab, setActiveTab] = useState('adsgram') // 'adsgram' | 'monetag'

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

  // Load settings
  useEffect(() => {
    api.get('/api/ads/adsgram-info').then(r => {
      const d = r.data || {}
      if (d.reward != null) setReward(parseFloat(d.reward))
      if (d.dailyLimit != null) setDailyLimit(parseInt(d.dailyLimit))
      setTodayCount(parseInt(d.todayCount) || 0)
      setTotalEarned(parseFloat(d.totalEarned) || 0)
      if (d.blockId) setBlockId(d.blockId)

      // Monetag
      if (d.monetagZoneId) setMontagZoneId(d.monetagZoneId)
      if (d.monetagReward != null) setMontagReward(parseFloat(d.monetagReward))
      if (d.monetagDailyLimit != null) setMontagDailyLimit(parseInt(d.monetagDailyLimit))
      setMontagTodayCount(parseInt(d.monetagTodayCount) || 0)
      setMontagTotalEarned(parseFloat(d.monetagTotalEarned) || 0)

      setInfoLoaded(true)
    }).catch(() => {
      api.get('/api/settings/adsgram_block_id').then(r => {
        if (r.data?.value) setBlockId(r.data.value)
      }).catch(() => {})
      setInfoLoaded(true)
    })
  }, [])

  // Init Adsgram controller (async-safe)
  useEffect(() => {
    if (!blockId) return

    const tryInit = () => {
      if (!window.Adsgram) return false
      try {
        const controller = window.Adsgram.init({ blockId, debug: false })
        setAdController(controller)
        return true
      } catch (e) {
        console.warn('Adsgram init error:', e)
        return true
      }
    }

    if (tryInit()) return

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (tryInit() || attempts >= 20) clearInterval(interval)
    }, 500)

    return () => clearInterval(interval)
  }, [blockId])

  // Init Monetag SDK
  useEffect(() => {
    if (!monetagZoneId) return

    const initMonetag = async () => {
      try {
        const { default: createAdHandler } = await import('monetag-tg-sdk')
        monetagHandler = createAdHandler(parseInt(monetagZoneId))
        setMontagReady(true)
      } catch (e) {
        console.warn('Monetag SDK init error:', e)
      }
    }

    initMonetag()
  }, [monetagZoneId])

  // Adsgram
  const remaining = Math.max(0, dailyLimit - todayCount)
  const limitPercent = dailyLimit > 0 ? Math.min(100, (todayCount / dailyLimit) * 100) : 100

  // Monetag
  const monetagRemaining = Math.max(0, monetagDailyLimit - monetagTodayCount)
  const monetagLimitPercent = monetagDailyLimit > 0 ? Math.min(100, (monetagTodayCount / monetagDailyLimit) * 100) : 100

  // Combined stats
  const combinedTotalEarned = totalEarned + monetagTotalEarned
  const combinedTodayViews = todayCount + monetagTodayCount

  const showAd = useCallback(async () => {
    if (!adController || loading || remaining <= 0) return
    setLoading(true)
    setError('')
    try {
      await adController.show()
      const r = await api.post('/api/ads/adsgram-reward')
      const earnedReward = parseFloat(r.data?.reward) || reward
      setRewarded(true)
      setTodayCount(prev => prev + 1)
      setTotalEarned(prev => prev + earnedReward)
      setTimeout(() => setRewarded(false), 5000)
    } catch (e) {
      if (e?.error === 'no-ads') {
        setError('Нет доступной рекламы')
      } else if (e?.response?.data?.error) {
        setError(e.response.data.error)
      } else {
        setError('Реклама недоступна')
      }
      setTimeout(() => setError(''), 4000)
    }
    setLoading(false)
  }, [adController, loading, remaining, reward])

  const showMonetag = useCallback(async () => {
    if (!monetagHandler || monetagLoading || monetagRemaining <= 0) return
    setMontagLoading(true)
    setMontagError('')
    try {
      await monetagHandler()
      const r = await api.post('/api/ads/monetag-reward')
      const earnedReward = parseFloat(r.data?.reward) || monetagReward
      setMontagRewarded(true)
      setMontagTodayCount(prev => prev + 1)
      setMontagTotalEarned(prev => prev + earnedReward)
      setTimeout(() => setMontagRewarded(false), 5000)
    } catch (e) {
      if (e?.response?.data?.error) {
        setMontagError(e.response.data.error)
      } else {
        setMontagError('Monetag реклама недоступна')
      }
      setTimeout(() => setMontagError(''), 4000)
    }
    setMontagLoading(false)
  }, [monetagLoading, monetagRemaining, monetagReward])

  const curRewarded = activeTab === 'adsgram' ? rewarded : monetagRewarded
  const curError = activeTab === 'adsgram' ? error : monetagError
  const curReward = activeTab === 'adsgram' ? reward : monetagReward

  return (
    <div className="ads-page fade-up">
      {/* Back */}
      <button className="ads-back" onClick={onBack}>
        ← НАЗАД
      </button>

      {/* Toast */}
      {curRewarded && (
        <div className="ads-toast success">✅ Награда +{curReward.toFixed(4)} TON получена!</div>
      )}
      {curError && (
        <div className="ads-toast error">{curError}</div>
      )}

      {/* Hero */}
      <div className="ads-hero">
        <div className="ads-hero-icon">🎬</div>
        <div className="ads-hero-title">Смотри & Зарабатывай</div>
        <div className="ads-hero-sub">Смотрите рекламные ролики и получайте TON на баланс</div>
      </div>

      {/* Combined Stats */}
      <div className="ads-stats">
        <div className="ads-stat cyan">
          <div className="ads-stat-val cyan">{combinedTodayViews}</div>
          <div className="ads-stat-lbl">Сегодня</div>
        </div>
        <div className="ads-stat green">
          <div className="ads-stat-val green">{combinedTotalEarned.toFixed(3)}</div>
          <div className="ads-stat-lbl">Заработано</div>
        </div>
        <div className="ads-stat gold">
          <div className="ads-stat-val gold">2</div>
          <div className="ads-stat-lbl">Сети</div>
        </div>
      </div>

      {/* Network Tabs */}
      <div className="ads-net-tabs">
        <button
          className={`ads-net-tab ${activeTab === 'adsgram' ? 'active adsgram' : ''}`}
          onClick={() => setActiveTab('adsgram')}
        >
          <span className="ads-net-tab-icon">🎬</span>
          <span className="ads-net-tab-name">Adsgram</span>
          <span className="ads-net-tab-badge">{remaining}</span>
        </button>
        <button
          className={`ads-net-tab ${activeTab === 'monetag' ? 'active monetag' : ''}`}
          onClick={() => setActiveTab('monetag')}
        >
          <span className="ads-net-tab-icon">📺</span>
          <span className="ads-net-tab-name">Monetag</span>
          <span className="ads-net-tab-badge">{monetagRemaining}</span>
        </button>
      </div>

      {/* === ADSGRAM TAB === */}
      {activeTab === 'adsgram' && (
        <div className="ads-network-content fade-up">
          {/* Reward info */}
          <div className="ads-reward-info">
            <div className="ads-reward-icon">💰</div>
            <div className="ads-reward-text">
              <div className="ads-reward-label">НАГРАДА ЗА ПРОСМОТР · ADSGRAM</div>
              <div className="ads-reward-val">
                +{reward.toFixed(4)}<span>TON</span>
              </div>
            </div>
          </div>

          {/* Daily limit bar */}
          <div className="ads-limit">
            <div className="ads-limit-header">
              <div className="ads-limit-label">ДНЕВНОЙ ЛИМИТ</div>
              <div className="ads-limit-count">{todayCount} / {dailyLimit}</div>
            </div>
            <div className="ads-limit-bar">
              <div
                className={`ads-limit-fill ${remaining <= 0 ? 'full' : ''}`}
                style={{ width: limitPercent + '%' }}
              />
            </div>
          </div>

          {/* Watch button */}
          <button
            className={`ads-watch-btn ${loading ? 'loading' : ''}`}
            onClick={showAd}
            disabled={loading || !adController || remaining <= 0}
          >
            <div className="ads-watch-glow" />
            <div className="ads-watch-icon">
              {loading ? '⏳' : remaining <= 0 ? '⏰' : '▶️'}
            </div>
            <div className="ads-watch-text">
              <span className="ads-watch-title">
                {loading ? 'Загрузка...' : remaining <= 0 ? 'Лимит исчерпан' : 'Смотреть Adsgram'}
              </span>
              <span className="ads-watch-sub">
                {remaining <= 0
                  ? 'Приходите завтра для новых просмотров'
                  : `Получите +${reward.toFixed(4)} TON за просмотр`}
              </span>
            </div>
            {remaining > 0 && !loading && (
              <div className="ads-watch-arrow">▸</div>
            )}
          </button>

          {/* Adsgram earnings */}
          <div className="ads-earnings">
            <div className="ads-earnings-title">ЗАРАБОТАНО С ADSGRAM</div>
            <div className="ads-earnings-val">{totalEarned.toFixed(4)} TON</div>
            <div className="ads-earnings-sub">Начислено на ваш баланс автоматически</div>
          </div>

          {!blockId && (
            <div style={{
              textAlign:'center', padding:'20px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
              color: 'rgba(232,242,255,0.25)'
            }}>
              Adsgram сейчас недоступен
            </div>
          )}
        </div>
      )}

      {/* === MONETAG TAB === */}
      {activeTab === 'monetag' && (
        <div className="ads-network-content fade-up">
          {/* Reward info */}
          <div className="ads-reward-info monetag">
            <div className="ads-reward-icon monetag-icon">💎</div>
            <div className="ads-reward-text">
              <div className="ads-reward-label">НАГРАДА ЗА ПРОСМОТР · MONETAG</div>
              <div className="ads-reward-val monetag-val">
                +{monetagReward.toFixed(4)}<span>TON</span>
              </div>
            </div>
          </div>

          {/* Daily limit bar */}
          <div className="ads-limit">
            <div className="ads-limit-header">
              <div className="ads-limit-label">ДНЕВНОЙ ЛИМИТ MONETAG</div>
              <div className="ads-limit-count monetag-count">{monetagTodayCount} / {monetagDailyLimit}</div>
            </div>
            <div className="ads-limit-bar">
              <div
                className={`ads-limit-fill monetag-fill ${monetagRemaining <= 0 ? 'full' : ''}`}
                style={{ width: monetagLimitPercent + '%' }}
              />
            </div>
          </div>

          {/* Watch button */}
          <button
            className={`ads-watch-btn monetag-btn ${monetagLoading ? 'loading' : ''}`}
            onClick={showMonetag}
            disabled={monetagLoading || !monetagReady || monetagRemaining <= 0}
          >
            <div className="ads-watch-glow monetag-glow" />
            <div className="ads-watch-icon">
              {monetagLoading ? '⏳' : monetagRemaining <= 0 ? '⏰' : '📺'}
            </div>
            <div className="ads-watch-text">
              <span className="ads-watch-title">
                {monetagLoading ? 'Загрузка...' : monetagRemaining <= 0 ? 'Лимит исчерпан' : 'Смотреть Monetag'}
              </span>
              <span className="ads-watch-sub">
                {monetagRemaining <= 0
                  ? 'Приходите завтра для новых просмотров'
                  : `Получите +${monetagReward.toFixed(4)} TON за просмотр`}
              </span>
            </div>
            {monetagRemaining > 0 && !monetagLoading && (
              <div className="ads-watch-arrow">▸</div>
            )}
          </button>

          {/* Monetag earnings */}
          <div className="ads-earnings monetag-earnings">
            <div className="ads-earnings-title">ЗАРАБОТАНО С MONETAG</div>
            <div className="ads-earnings-val monetag-earnings-gradient">{monetagTotalEarned.toFixed(4)} TON</div>
            <div className="ads-earnings-sub">Начислено на ваш баланс автоматически</div>
          </div>

          {!monetagZoneId && (
            <div style={{
              textAlign:'center', padding:'20px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
              color: 'rgba(232,242,255,0.25)'
            }}>
              Monetag сейчас недоступен
            </div>
          )}
        </div>
      )}

      {/* Banners */}
      <div className="ads-banners">
        <div className="ads-banners-title">📢 СПОНСОРЫ</div>
        <AdBanner page="home" />
      </div>

      {/* How it works */}
      <div className="ads-howto">
        <div className="ads-howto-title">КАК ЭТО РАБОТАЕТ</div>
        <div className="ads-howto-step">
          <div className="ads-howto-num">1</div>
          <div className="ads-howto-text">
            <div className="ads-howto-text-title">Выберите рекламную сеть</div>
            <div className="ads-howto-text-sub">Adsgram или Monetag — каждая с отдельным лимитом</div>
          </div>
        </div>
        <div className="ads-howto-step">
          <div className="ads-howto-num">2</div>
          <div className="ads-howto-text">
            <div className="ads-howto-text-title">Досмотрите рекламу</div>
            <div className="ads-howto-text-sub">Обычно это занимает 15–30 секунд</div>
          </div>
        </div>
        <div className="ads-howto-step">
          <div className="ads-howto-num">3</div>
          <div className="ads-howto-text">
            <div className="ads-howto-text-title">Получите TON</div>
            <div className="ads-howto-text-sub">Награда зачислится на баланс мгновенно</div>
          </div>
        </div>
      </div>

      {/* Total earnings */}
      <div className="ads-earnings total-earnings">
        <div className="ads-earnings-title">ВСЕГО ЗАРАБОТАНО С РЕКЛАМЫ</div>
        <div className="ads-earnings-val">{combinedTotalEarned.toFixed(4)} TON</div>
        <div className="ads-earnings-sub">Adsgram: {totalEarned.toFixed(4)} · Monetag: {monetagTotalEarned.toFixed(4)}</div>
      </div>
    </div>
  )
}
