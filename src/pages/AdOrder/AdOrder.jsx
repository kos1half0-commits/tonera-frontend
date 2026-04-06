import { useState, useEffect } from 'react'
import api from '../../api/index'
import './AdOrder.css'

const PAGE_OPTIONS = [
  { id: 'home',    label: 'Главная' },
  { id: 'tasks',   label: 'Задания' },
  { id: 'games',   label: 'Игры' },
  { id: 'staking', label: 'Стейкинг' },
  { id: 'miner',   label: 'Майнер' },
  { id: 'wallet',  label: 'Кошелёк' },
]

export default function AdOrder({ onBack }) {
  const [form, setForm] = useState({ title:'', text:'', link:'', budget:'', pages:['home'] })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)

  const [submitted, setSubmitted] = useState(false)



  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 5000)
  }

  const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const togglePage = (page) => {
    setForm(f => ({
      ...f,
      pages: f.pages.includes(page) ? f.pages.filter(p=>p!==page) : [...f.pages, page]
    }))
  }

  const submit = async () => {
    if (!form.title.trim()) { showToast('Введите заголовок', true); return }
    if (form.pages.length === 0) { showToast('Выберите хотя бы одну страницу', true); return }

    setSubmitting(true)
    try {
      let image_url = null
      if (imageFile) {
        setUploading(true)
        image_url = await uploadImage(imageFile)
        setUploading(false)
      }

      await api.post('/api/ads/order', {
        title: form.title,
        text: form.text,
        link: form.link,
        budget: parseFloat(form.budget) || 0,
        pages: form.pages.join(','),
        image_url,
      })
      setSubmitted(true)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
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
        <div className="ads-title">ЗАЯВКА ОТПРАВЛЕНА</div>
        <div className="ads-desc">Мы рассмотрим вашу заявку и свяжемся с вами в Telegram</div>
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
        <div className="aoi-title">РАЗМЕСТИТЕ РЕКЛАМУ В TONERA</div>
        <div className="aoi-desc">Ваш баннер увидят тысячи активных пользователей TON. Выберите страницы и укажите бюджет.</div>
      </div>

      <div className="adorder-form">
        <label className="aof-label">ЗАГОЛОВОК *</label>
        <input className="aof-input" placeholder="Название вашего проекта" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>

        <label className="aof-label">ОПИСАНИЕ</label>
        <textarea className="aof-input" rows={3} placeholder="Краткое описание..." value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} style={{resize:'none'}}/>

        <label className="aof-label">ССЫЛКА (КУДА ВЕДЁТ)</label>
        <input className="aof-input" placeholder="https://t.me/yourproject" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))}/>

        <label className="aof-label">ФОТО БАННЕРА</label>
        {imagePreview ? (
          <div className="aof-preview">
            <img src={imagePreview} alt="" className="aof-preview-img"/>
            <button className="aof-remove-img" onClick={()=>{setImageFile(null);setImagePreview(null)}}>✕ Удалить</button>
          </div>
        ) : (
          <label className="aof-upload">
            📷 Выбрать фото
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
              const file = e.target.files[0]
              if (!file) return
              if (file.size > 5 * 1024 * 1024) { showToast('Файл слишком большой (макс. 5MB)', true); return }
              setImageFile(file)
              const reader = new FileReader()
              reader.onload = ev => setImagePreview(ev.target.result)
              reader.readAsDataURL(file)
            }}/>
          </label>
        )}

        <label className="aof-label">СТРАНИЦЫ ДЛЯ ПОКАЗА *</label>
        <div className="aof-pages">
          {PAGE_OPTIONS.map(p => (
            <button key={p.id} className={`aof-page-btn ${form.pages.includes(p.id)?'on':''}`} onClick={()=>togglePage(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        <label className="aof-label">БЮДЖЕТ (TON)</label>
        <input className="aof-input" type="number" step="0.1" placeholder="0.0" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}/>
        <div className="aof-hint">Укажите желаемый бюджет — мы свяжемся для обсуждения условий</div>

        <button className="adorder-btn" onClick={submit} disabled={submitting}>
          {uploading ? '⏳ ЗАГРУЗКА ФОТО...' : submitting ? 'ОТПРАВКА...' : '📤 ОТПРАВИТЬ ЗАЯВКУ'}
        </button>
      </div>
    </div>
  )
}
