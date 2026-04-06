import { useState, useEffect } from 'react'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import api from '../../api/index'
import './AdOrder.css'

const DURATIONS = [
  { id: 'week',    label: '1 неделя',  days: 7,  priceKey: 'week' },
  { id: '2weeks',  label: '2 недели',  days: 14, priceKey: 'twoWeeks' },
  { id: 'month',   label: '1 месяц',   days: 30, priceKey: 'month' },
]

export default function AdOrder({ onBack }) {
  const [form, setForm] = useState({ title:'', text:'', link:'', duration:'week' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [prices, setPrices] = useState({ week:5, twoWeeks:9, month:15 })
  const [projectWallet, setProjectWallet] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  useEffect(() => {
    api.get('/api/ads/prices').then(r => setPrices(r.data)).catch(()=>{})
    api.get('/api/deposit/info').then(r => setProjectWallet(r.data?.wallet||'')).catch(()=>{})
  }, [])

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 5000)
  }

  const currentPrice = prices[DURATIONS.find(d=>d.id===form.duration)?.priceKey || 'week'] || 5

  const submit = async () => {
    if (!form.title.trim()) { showToast('Введите заголовок', true); return }
    if (!wallet) { tonConnectUI.openModal(); showToast('Подключите кошелёк TON', true); return }
    if (!projectWallet) { showToast('Кошелёк проекта не настроен', true); return }

    setSubmitting(true)
    try {
      // Конвертируем фото в base64
      let image_url = null
      if (imageFile) {
        image_url = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = ev => res(ev.target.result)
          reader.onerror = rej
          reader.readAsDataURL(imageFile)
        })
      }

      // Оплата через TON Connect
      const amountNano = Math.floor(currentPrice * 1e9).toString()
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: projectWallet, amount: amountNano }]
      })

      // Отправляем заявку
      await api.post('/api/ads/order', {
        title: form.title,
        text: form.text,
        link: form.link,
        pages: 'home,tasks,games,staking,miner,wallet',
        budget: currentPrice,
        duration: form.duration,
        tx_hash: result?.boc || '',
        image_url,
      })
      setSubmitted(true)
    } catch (e) {
      if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) showToast('ОТМЕНЕНО', true)
      else showToast(e?.response?.data?.error || e?.message || 'Ошибка', true)
    }
    setSubmitting(false)
  }

  if (submitted) return (
    <div className="adorder-wrap">
      <div className="adorder-header">
        <button className="adorder-back" onClick={onBack}>← НАЗАД</button>
        <div className="adorder-title">📣 РЕКЛАМА</div>
      </div>
      <div className="adorder-success">
        <div className="ads-icon">✅</div>
        <div className="ads-title">ЗАЯВКА ОПЛАЧЕНА</div>
        <div className="ads-desc">Ваша реклама будет размещена после проверки. Обычно это занимает до 24 часов.</div>
        <button className="adorder-btn" onClick={onBack}>ВЕРНУТЬСЯ</button>
      </div>
    </div>
  )

  return (
    <div className="adorder-wrap">
      {toast && <div className={`adorder-toast ${toastErr?'err':''}`}>{toast}</div>}
      <div className="adorder-header">
        <button className="adorder-back" onClick={onBack}>← НАЗАД</button>
        <div className="adorder-title">📣 ЗАКАЗАТЬ РЕКЛАМУ</div>
      </div>

      <div className="adorder-info">
        <div className="aoi-title">РЕКЛАМА В TONERA</div>
        <div className="aoi-desc">Ваш баннер увидят тысячи активных пользователей TON. Выберите период и страницы.</div>
      </div>

      {/* ПЕРИОД */}
      <div className="adorder-section">
        <div className="aos-title">ПЕРИОД РАЗМЕЩЕНИЯ</div>
        <div className="aof-durations">
          {DURATIONS.map(d => (
            <button key={d.id} className={`aof-dur-btn ${form.duration===d.id?'on':''}`} onClick={()=>setForm(f=>({...f,duration:d.id}))}>
              <div className="adf-label">{d.label}</div>
              <div className="adf-price">{prices[d.priceKey]} TON</div>
            </button>
          ))}
        </div>
      </div>

      <div className="adorder-form">
        <label className="aof-label">ЗАГОЛОВОК *</label>
        <input className="aof-input" placeholder="Название вашего проекта" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>

        <label className="aof-label">ОПИСАНИЕ</label>
        <textarea className="aof-input" rows={3} placeholder="Краткое описание..." value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} style={{resize:'none'}}/>

        <label className="aof-label">ССЫЛКА (КУДА ВЕДЁТ)</label>
        <input className="aof-input" placeholder="https://t.me/yourproject" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))}/>

        <label className="aof-label">ФОТО БАННЕРА</label>
        <div className="aof-size-hint">📐 Рекомендуемый размер: <b>800×300 px</b> (соотношение 8:3) · Макс. 5MB · JPG, PNG</div>
        {imagePreview ? (
          <div className="aof-preview">
            <img src={imagePreview} alt="" className="aof-preview-img"/>
            <button className="aof-remove-img" onClick={()=>{setImageFile(null);setImagePreview(null)}}>✕</button>
          </div>
        ) : (
          <label className="aof-upload">
            📷 Выбрать фото
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
              const file = e.target.files[0]
              if (!file) return
              if (file.size > 5*1024*1024) { showToast('Файл слишком большой (макс. 5MB)', true); return }
              setImageFile(file)
              const reader = new FileReader()
              reader.onload = ev => setImagePreview(ev.target.result)
              reader.readAsDataURL(file)
            }}/>
          </label>
        )}

        <label className="aof-label">СТРАНИЦЫ ДЛЯ ПОКАЗА *</label>
        <div className="aof-pages">
        </div>
      </div>

      {/* ПРЕДПРОСМОТР */}
      {(form.title || imagePreview) && (
        <div className="adorder-section" style={{marginBottom:12}}>
          <div className="aos-title">ПРЕДПРОСМОТР БАННЕРА</div>
          <div className="ad-banner" style={{cursor:'default',marginBottom:0}}>
            {imagePreview && <img src={imagePreview} className="ad-img" alt="" style={{maxHeight:140,objectFit:'cover'}}/>}
            <div className="ad-body">
              <div className="ad-label">РЕКЛАМА</div>
              {form.title && <div className="ad-title">{form.title}</div>}
              {form.text && <div className="ad-text">{form.text}</div>}
              {form.link && <div className="ad-link">Подробнее →</div>}
            </div>
          </div>
        </div>
      )}

      {/* ОПИСАНИЕ ОПЛАТЫ */}
      <div className="adorder-pay-info">
        <div className="api-title">💳 КАК ПРОИСХОДИТ ОПЛАТА</div>
        <div className="api-item">✅ Оплата через TON Connect — напрямую на кошелёк TonEra</div>
        <div className="api-item">✅ Никаких комиссий и внутреннего баланса</div>
        <div className="api-item">✅ Реклама публикуется после проверки модератором</div>
        <div className="api-item">⏱ Обычно в течение 24 часов</div>
      </div>

      <div className="adorder-total">
        <span>ИТОГО К ОПЛАТЕ</span>
        <span className="adorder-total-price">{currentPrice} TON</span>
      </div>

      <button className="adorder-btn" onClick={submit} disabled={submitting}>
        {submitting ? 'ОБРАБОТКА...' : `💳 ОПЛАТИТЬ ${currentPrice} TON И ОТПРАВИТЬ`}
      </button>
    </div>
  )
}
