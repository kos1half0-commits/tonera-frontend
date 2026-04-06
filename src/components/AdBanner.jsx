import { useState, useEffect } from 'react'
import api from '../api/index'
import './AdBanner.css'

export default function AdBanner({ page }) {
  const [ads, setAds] = useState([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    api.get(`/api/ads?page=${page}`).then(r => setAds(r.data||[])).catch(()=>{})
  }, [page])

  if (!ads.length) return null
  const ad = ads[current]

  return (
    <div className="ad-banner" onClick={() => {
      if (ad.link) {
        const tg = window.Telegram?.WebApp
        if (tg) tg.openLink(ad.link)
        else window.open(ad.link, '_blank')
      }
    }}>
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
              onClick={e=>{e.stopPropagation();setCurrent(i)}}/>
          ))}
        </div>
      )}
    </div>
  )
}
