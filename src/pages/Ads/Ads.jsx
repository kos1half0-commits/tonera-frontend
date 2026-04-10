import { useState, useEffect, useCallback } from 'react'
import api from '../../api/index'
import AdBanner from '../../components/AdBanner'
import './Ads.css'

export default function Ads({ onBack }) {
  const [blockId, setBlockId] = useState('')
  const [adController, setAdController] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  const [error, setError] = useState('')
  const [reward, setReward] = useState(0.001)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [todayCount, setTodayCount] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)

  // Load settings
  useEffect(() => {
    api.get('/api/ads/adsgram-info').then(r => {
      const d = r.data || {}
      setReward(parseFloat(d.reward) || 0.001)
      setDailyLimit(parseInt(d.dailyLimit) || 10)
      setTodayCount(parseInt(d.todayCount) || 0)
      setTotalEarned(parseFloat(d.totalEarned) || 0)
      if (d.blockId) setBlockId(d.blockId)
    }).catch(() => {
      // Fallback: load block ID separately
      api.get('/api/settings/adsgram_block_id').then(r => {
        if (r.data?.value) setBlockId(r.data.value)
      }).catch(() => {})
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

  const remaining = Math.max(0, dailyLimit - todayCount)
  const limitPercent = dailyLimit > 0 ? Math.min(100, (todayCount / dailyLimit) * 100) : 100

  const showAd = useCallback(async () => {
    if (!adController || loading || remaining <= 0) return
    setLoading(true)
    setError('')
    try {
      await adController.show()
      // Notify backend and get reward
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

  return (
    <div className="ads-page fade-up">
      {/* Back */}
      <button className="ads-back" onClick={onBack}>
        ← НАЗАД
      </button>

      {/* Toast */}
      {rewarded && (
        <div className="ads-toast success">✅ Награда +{reward.toFixed(4)} TON получена!</div>
      )}
      {error && (
        <div className="ads-toast error">{error}</div>
      )}

      {/* Hero */}
      <div className="ads-hero">
        <div className="ads-hero-icon">🎬</div>
        <div className="ads-hero-title">Смотри & Зарабатывай</div>
        <div className="ads-hero-sub">Смотрите рекламные ролики и получайте TON на баланс</div>
      </div>

      {/* Stats */}
      <div className="ads-stats">
        <div className="ads-stat cyan">
          <div className="ads-stat-val cyan">{remaining}</div>
          <div className="ads-stat-lbl">Осталось</div>
        </div>
        <div className="ads-stat green">
          <div className="ads-stat-val green">{todayCount}</div>
          <div className="ads-stat-lbl">Сегодня</div>
        </div>
        <div className="ads-stat gold">
          <div className="ads-stat-val gold">{totalEarned.toFixed(3)}</div>
          <div className="ads-stat-lbl">Заработано</div>
        </div>
      </div>

      {/* Reward info */}
      <div className="ads-reward-info">
        <div className="ads-reward-icon">💰</div>
        <div className="ads-reward-text">
          <div className="ads-reward-label">НАГРАДА ЗА ПРОСМОТР</div>
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
            {loading ? 'Загрузка...' : remaining <= 0 ? 'Лимит исчерпан' : 'Смотреть рекламу'}
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

      {/* Total earnings */}
      <div className="ads-earnings">
        <div className="ads-earnings-title">ВСЕГО ЗАРАБОТАНО С РЕКЛАМЫ</div>
        <div className="ads-earnings-val">{totalEarned.toFixed(4)} TON</div>
        <div className="ads-earnings-sub">Начислено на ваш баланс автоматически</div>
      </div>

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
            <div className="ads-howto-text-title">Нажмите «Смотреть рекламу»</div>
            <div className="ads-howto-text-sub">Откроется короткий рекламный ролик</div>
          </div>
        </div>
        <div className="ads-howto-step">
          <div className="ads-howto-num">2</div>
          <div className="ads-howto-text">
            <div className="ads-howto-text-title">Досмотрите до конца</div>
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

      {!blockId && (
        <div style={{
          textAlign:'center', padding:'20px',
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
          color: 'rgba(232,242,255,0.25)'
        }}>
          Реклама сейчас недоступна
        </div>
      )}
    </div>
  )
}
