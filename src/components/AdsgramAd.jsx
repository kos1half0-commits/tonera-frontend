import { useState, useEffect, useCallback } from 'react'
import api from '../api/index'
import './AdsgramAd.css'

export default function AdsgramAd({ onReward }) {
  const [blockId, setBlockId] = useState('')
  const [adController, setAdController] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  const [error, setError] = useState('')

  // Load block ID from settings
  useEffect(() => {
    api.get('/api/settings/adsgram_block_id')
      .then(r => {
        const id = r.data?.value
        if (id) setBlockId(id)
      })
      .catch(() => {})
  }, [])

  // Init Adsgram controller when blockId loads (SDK may load async)
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

    // Try immediately
    if (tryInit()) return

    // SDK may still be loading — poll for it (max ~10s)
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (tryInit() || attempts >= 20) clearInterval(interval)
    }, 500)

    return () => clearInterval(interval)
  }, [blockId])

  const showAd = useCallback(async () => {
    if (!adController || loading) return
    setLoading(true)
    setError('')
    try {
      const result = await adController.show()
      // Reward user
      setRewarded(true)
      if (onReward) onReward(result)
      // Notify backend
      api.post('/api/ads/adsgram-reward').catch(() => {})
      setTimeout(() => setRewarded(false), 5000)
    } catch (e) {
      if (e?.error === 'no-ads') {
        setError('Нет доступной рекламы')
      } else {
        setError('Реклама недоступна')
      }
      setTimeout(() => setError(''), 3000)
    }
    setLoading(false)
  }, [adController, loading, onReward])

  // Don't render if no blockId configured
  if (!blockId) return null

  return (
    <div className="adsgram-wrap">
      {rewarded && (
        <div className="adsgram-reward-toast">
          ✅ Награда получена!
        </div>
      )}
      {error && (
        <div className="adsgram-error-toast">{error}</div>
      )}
      <button
        className={`adsgram-btn ${loading ? 'loading' : ''}`}
        onClick={showAd}
        disabled={loading || !adController}
      >
        <div className="adsgram-btn-glow"/>
        <span className="adsgram-btn-icon">🎬</span>
        <div className="adsgram-btn-text">
          <span className="adsgram-btn-title">Смотреть рекламу</span>
          <span className="adsgram-btn-sub">Получите бонус TON</span>
        </div>
        <div className="adsgram-btn-arrow">
          {loading ? '⏳' : '▶'}
        </div>
      </button>
    </div>
  )
}
