import { useState, useEffect, useRef } from 'react'
import api from '../api/index'
import './AdBanner.css'

export default function AdBanner({ page }) {
  const [ads, setAds] = useState([])
  const [current, setCurrent] = useState(0)
  const [interval_, setInterval_] = useState(4000)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    api.get('/api/settings/ad_banner_interval').then(r => setInterval_((parseInt(r.data?.value)||4)*1000)).catch(()=>{})
    api.get(`/api/ads?page=${page}`).then(r => {
      const shuffled = (r.data||[]).sort(() => Math.random() - 0.5)
      setAds(shuffled)
      setCurrent(0)
    }).catch(()=>{})
  }, [page])

  useEffect(() => {
    if (ads.length <= 1) return
    timerRef.current = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setCurrent(c => (c + 1) % ads.length)
        setAnimating(false)
      }, 300)
    }, interval_)
    return () => clearInterval(timerRef.current)
  }, [ads.length, interval_])

  if (!ads.length) return null
  const ad = ads[current]

  const handleClick = () => {
    if (!ad.link) return
    // Track click
    api.post('/api/ads/click', { ad_id: ad.id }).catch(() => {})
    if (ad.link === '__adorder__') {
      window.dispatchEvent(new CustomEvent('openAdOrder'))
      return
    }
    const tg = window.Telegram?.WebApp
    if (tg) tg.openLink(ad.link)
    else window.open(ad.link, '_blank')
  }

  return (
    <div className={`ad-banner ${animating ? 'ad-fade-out' : 'ad-fade-in'}`} onClick={handleClick} style={{cursor: ad.link ? 'pointer' : 'default'}}>
      <div className="ad-glow"/>
      <div className="ad-shimmer"/>
      {ad.image_url && <img src={ad.image_url} className="ad-img" alt="" onError={e=>e.target.style.display='none'}/>}
      <div className="ad-body">
        <div className="ad-label-row">
          <div className="ad-label">РЕКЛАМА</div>
          <div className="ad-pulse"/>
        </div>
        {ad.title && <div className="ad-title">{ad.title}</div>}
        {ad.text && <div className="ad-text">{ad.text}</div>}
        {ad.link && <div className="ad-link">Подробнее →</div>}
      </div>
      {ads.length > 1 && (
        <div className="ad-dots">
          {ads.map((_, i) => (
            <button key={i} className={`ad-dot ${i===current?'on':''}`}
              onClick={e=>{e.stopPropagation(); setCurrent(i); clearInterval(timerRef.current); setAnimating(false)}}/>
          ))}
        </div>
      )}
    </div>
  )
}
