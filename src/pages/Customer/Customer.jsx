import { useState, useEffect, useRef } from 'react'
import { createTask, getMyTasks } from '../../api/index'
import api from '../../api/index'
import { useUserStore } from '../../store/userStore'
import './Customer.css'

const COUNTS = [50, 100, 200, 500, 1000]
const PRICE_PER = 0.002

export default function Customer() {
  const { user, updateBalance } = useUserStore()
  const [tab, setTab] = useState('create')
  const [myTasks, setMyTasks] = useState([])
  const [form, setForm] = useState({ type: 'subscribe', link: '', title: '', channel_title: '', channel_photo: '', count: 100 })
  const [loading, setLoading] = useState(false)
  const [loadingCh, setLoadingCh] = useState(false)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const linkTimer = useRef(null)

  const balance = parseFloat(user?.balance_ton ?? 0)
  const totalCost = form.count * PRICE_PER

  const showToast = (msg, err = false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    getMyTasks().then(r => setMyTasks(r.data || [])).catch(() => {})
  }, [])

  const handleLinkChange = (link) => {
    setForm(p => ({ ...p, link }))
    if (linkTimer.current) clearTimeout(linkTimer.current)
    if (!link.includes('t.me/')) return
    linkTimer.current = setTimeout(async () => {
      setLoadingCh(true)
      try {
        const r = await api.get(`/api/channels/info?link=${encodeURIComponent(link)}`)
        setForm(p => ({
          ...p,
          title: r.data.title || p.title,
          channel_title: r.data.title || '',
          channel_photo: r.data.photo || '',
        }))
      } catch {}
      setLoadingCh(false)
    }, 800)
  }

  const handleCreate = async () => {
    if (!form.link) { showToast('ВВЕДИ ССЫЛКУ', true); return }
    if (!form.title) { showToast('ВВЕДИ НАЗВАНИЕ', true); return }
    if (balance < totalCost) { showToast('НЕДОСТАТОЧНО СРЕДСТВ', true); return }

    setLoading(true)
    try {
      await createTask({
        type: form.type,
        title: form.title,
        link: form.link,
        channel_title: form.channel_title,
        channel_photo: form.channel_photo,
        max_executions: form.count,
      })
      updateBalance(-totalCost)
      showToast('ЗАДАНИЕ СОЗДАНО!')
      setForm({ type: 'subscribe', link: '', title: '', channel_title: '', channel_photo: '', count: 100 })
      const r = await getMyTasks()
      setMyTasks(r.data || [])
      setTab('my')
    } catch (e) {
      showToast(e?.response?.data?.error || 'ОШИБКА', true)
    }
    setLoading(false)
  }

  return (
    <div className="customer-wrap">
      {toast && <div className={`cust-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="cust-header">
        <div className="cust-title">Заказчик</div>
        <div className="cust-balance">
          <svg width="16" height="16" viewBox="0 0 56 56" fill="none"><path d="M28 0C12.536 0 0 12.536 0 28s12.536 28 28 28 28-12.536 28-28S43.464 0 28 0z" fill="#0098EA"/><path d="M37.56 15.63H18.44c-3.52 0-5.74 3.79-3.98 6.86l11.8 20.45c.77 1.34 2.7 1.34 3.47 0l11.8-20.45c1.77-3.06-.45-6.86-3.97-6.86zM26.26 36.28l-2.86-5.16-6.56-11.3c-.37-.63.07-1.42.8-1.42h8.62v17.88zm12.9-16.48-6.56 11.32-2.86 5.16V18.38h8.61c.73 0 1.17.79.81 1.42z" fill="#fff"/></svg>
          <span>{balance.toFixed(4)}</span>
        </div>
      </div>

      <div className="cust-tabs">
        <button className={`ctab ${tab === 'create' ? 'on' : ''}`} onClick={() => setTab('create')}>СОЗДАТЬ</button>
        <button className={`ctab ${tab === 'my' ? 'on' : ''}`} onClick={() => setTab('my')}>МОИ ЗАДАНИЯ ({myTasks.length})</button>
      </div>

      {/* CREATE */}
      {tab === 'create' && (
        <div className="create-form">
          {/* Type selector */}
          <div className="cf-row">
            <div className="cf-label">ТИП ЗАДАНИЯ</div>
            <div className="type-btns">
              <button className={`type-btn ${form.type === 'subscribe' ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'subscribe' }))}>
                ✈️ Подписка
              </button>
              <button className={`type-btn ${form.type === 'bot' ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'bot' }))}>
                🤖 Бот
              </button>
            </div>
          </div>

          {/* Link */}
          <div className="cf-row">
            <div className="cf-label">ССЫЛКА</div>
            <div className="cf-input-wrap">
              <input
                className="cf-input"
                placeholder="https://t.me/username"
                value={form.link}
                onChange={e => handleLinkChange(e.target.value)}
              />
              {loadingCh && <div className="cf-spinner" />}
            </div>
          </div>

          {/* Channel preview */}
          {form.channel_photo && (
            <div className="ch-preview">
              <img src={form.channel_photo} className="ch-img" onError={e => e.target.style.display = 'none'} />
              <div>
                <div className="ch-name">{form.channel_title}</div>
                <div className="ch-url">{form.link}</div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="cf-row">
            <div className="cf-label">НАЗВАНИЕ</div>
            <input
              className="cf-input"
              placeholder="Название задания"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Count selector */}
          <div className="cf-row">
            <div className="cf-label">КОЛИЧЕСТВО ВЫПОЛНЕНИЙ</div>
            <div className="count-btns">
              {COUNTS.map(c => (
                <button
                  key={c}
                  className={`count-btn ${form.count === c ? 'on' : ''}`}
                  onClick={() => setForm(p => ({ ...p, count: c }))}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="price-card">
            <div className="price-row">
              <span>Выполнений</span>
              <span>{form.count}</span>
            </div>
            <div className="price-row">
              <span>Цена за выполнение</span>
              <span>{PRICE_PER} TON</span>
            </div>
            <div className="price-divider" />
            <div className="price-row total">
              <span>ИТОГО</span>
              <span className={balance < totalCost ? 'not-enough' : 'ok'}>{totalCost.toFixed(4)} TON</span>
            </div>
            {balance < totalCost && (
              <div className="price-warn">Недостаточно средств. Нужно ещё {(totalCost - balance).toFixed(4)} TON</div>
            )}
          </div>

          {/* Distribution info */}
          <div className="dist-card">
            <div className="dist-title">РАСПРЕДЕЛЕНИЕ ЗА 1 ВЫПОЛНЕНИЕ</div>
            <div className="dist-row"><span>👤 Исполнитель</span><span>0.001 TON</span></div>
            <div className="dist-row"><span>👥 Реферал</span><span>0.0005 TON</span></div>
            <div className="dist-row"><span>🏦 Комиссия</span><span>0.0005 TON</span></div>
          </div>

          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={loading || balance < totalCost || !form.link || !form.title}
          >
            {loading ? 'СОЗДАНИЕ...' : `СОЗДАТЬ ЗА ${totalCost.toFixed(4)} TON`}
          </button>
        </div>
      )}

      {/* MY TASKS */}
      {tab === 'my' && (
        <div className="my-tasks">
          {myTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Нет заданий</div>
            </div>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="my-task-card">
                <div className="mt-header">
                  {task.channel_photo
                    ? <img src={task.channel_photo} className="mt-photo" onError={e => e.target.style.display = 'none'} />
                    : <div className="mt-icon">{task.icon}</div>
                  }
                  <div className="mt-info">
                    <div className="mt-title">{task.channel_title || task.title}</div>
                    <div className="mt-link">{task.link}</div>
                  </div>
                  <div className={`mt-status ${task.active ? 'active' : 'done'}`}>
                    {task.active ? 'АКТИВНО' : 'ЗАВЕРШЕНО'}
                  </div>
                </div>
                <div className="mt-progress">
                  <div className="mt-prog-bar">
                    <div
                      className="mt-prog-fill"
                      style={{ width: `${Math.min((task.executions / task.max_executions) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-prog-text">{task.executions} / {task.max_executions} выполнений</div>
                </div>
                <div className="mt-stats">
                  <div className="mt-stat"><span>Бюджет</span><span>{parseFloat(task.budget).toFixed(4)} TON</span></div>
                  <div className="mt-stat"><span>Потрачено</span><span>{(task.executions * parseFloat(task.price_per_exec)).toFixed(4)} TON</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
