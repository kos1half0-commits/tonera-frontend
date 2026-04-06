import { useState, useEffect, useRef } from 'react'
import api from '../api/index'
import './AdBanner.css'

export default function AdBanner({ page }) {
  const [ads, setAds] = useState([])
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    api.get(`/api/ads?page=${page}`).then(r => {
      // Перемешиваем рандомно
      const shuffled = (r.data||[]).sort(() => Math.random() - 0.5)
      setAds(shuffled)
      setCurrent(0)
    }).catch(()=>{})
  }, [page])

  useEffect(() => {
    if (ads.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % ads.length)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [ads.length])

  if (!ads.length) return null
  const ad = ads[current]

  const handleClick = () => {
    if (!ad.link) return
    if (ad.link === '__adorder__') {
      // Открываем страницу заказа внутри приложения
      window.dispatchEvent(new CustomEvent('openAdOrder'))
      return
    }
    const tg = window.Telegram?.WebApp
    if (tg) tg.openLink(ad.link)
    else window.open(ad.link, '_blank')
  }

  return (
    <div className="ad-banner" onClick={handleClick} style={{cursor: ad.link ? 'pointer' : 'default'}}>
      {ad.image_url && <img src={ad.image_url} className="ad-img" alt="" onError={e=>e.target.style.display='none'}/>}
      <div className="ad-body">
        <div className="ad-label">РЕКЛАМА</div>
        {ad.title && <div className="ad-title">{ad.title}</div>}
        {ad.text && <div className="ad-text">{ad.text}</div>}
        {ad.link && <div className="ad-link">Подробнее →</div>}
      </div>
      {ads.length > 1 && (
        <div className="ad-dots">
          {ads.map((_, i) => (
            <button key={i} className={`ad-dot ${i===current?'on':''}`}
              onClick={e=>{e.stopPropagation(); setCurrent(i); clearInterval(timerRef.current)}}/>
          ))}
        </div>
      )}
    </div>
  )
}
