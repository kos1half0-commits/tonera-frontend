import { useState, useEffect, useRef } from 'react'
import api from '../../api/index'
import './Admin.css'

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({})
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [form, setForm] = useState({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
  const linkTimer = useRef(null)

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [s, se, t, u] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/settings'),
        api.get('/api/admin/tasks'),
        api.get('/api/admin/users'),
      ])
      setStats(s.data)
      setSettings(se.data)
      setTasks(t.data)
      setUsers(u.data)
    } catch {}
  }

  const saveSetting = async (key) => {
    setSaving(true)
    try {
      await api.post('/api/admin/settings', { key, value: settings[key] })
      showToast('СОХРАНЕНО')
    } catch { showToast('ОШИБКА', true) }
    setSaving(false)
  }

  // Автозагрузка данных канала при вводе ссылки
  const handleLinkChange = (link) => {
    setForm(p => ({...p, link}))
    if (linkTimer.current) clearTimeout(linkTimer.current)
    if (!link.includes('t.me/')) return
    linkTimer.current = setTimeout(async () => {
      setLoadingChannel(true)
      try {
        const r = await api.get(`/api/channels/info?link=${encodeURIComponent(link)}`)
        const d = r.data
        setForm(p => ({
          ...p,
          title: d.title || p.title,
          channel_title: d.title || '',
          channel_photo: d.photo || '',
          icon: p.type === 'bot' ? '🤖' : '✈️',
        }))
      } catch {}
      setLoadingChannel(false)
    }, 800)
  }

  const addTask = async () => {
    if (!form.title.trim()) { showToast('ВВЕДИ НАЗВАНИЕ', true); return }
    try {
      await api.post('/api/admin/tasks', form)
      showToast('ЗАДАНИЕ ДОБАВЛЕНО')
      setForm({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
      const r = await api.get('/api/admin/tasks')
      setTasks(r.data)
    } catch { showToast('ОШИБКА', true) }
  }

  const deleteTask = async (id) => {
    try {
      await api.delete(`/api/admin/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
      showToast('УДАЛЕНО')
    } catch { showToast('ОШИБКА', true) }
  }

  return (
    <div className="admin-wrap">
      {toast && <div className={`admin-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="admin-header">
        <div className="admin-title">⚙️ Админ панель</div>
      </div>

      <div className="admin-tabs">
        {[
          {id:'stats', label:'СТАТ'},
          {id:'settings', label:'НАСТРОЙКИ'},
          {id:'tasks', label:'ЗАДАНИЯ'},
          {id:'users', label:'ЮЗЕРЫ'},
        ].map(t => (
          <button key={t.id} className={`atab ${tab===t.id?'on':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div className="admin-section">
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.total_users}</div><div className="astat-lbl">Пользователей</div></div>
            <div className="astat-card"><div className="astat-val">{stats.active_stakes}</div><div className="astat-lbl">Стейков</div></div>
            <div className="astat-card"><div className="astat-val">{parseFloat(stats.total_staked).toFixed(2)}</div><div className="astat-lbl">TON в стейке</div></div>
            <div className="astat-card"><div className="astat-val">{stats.total_referrals}</div><div className="astat-lbl">Рефералов</div></div>
            <div className="astat-card"><div className="astat-val">{stats.tasks_completed}</div><div className="astat-lbl">Заданий выполнено</div></div>
          </div>
          <button className="reload-btn" onClick={loadAll}>↻ Обновить</button>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div className="admin-section">
          {[
            { key: 'task_reward',          label: 'Награда за задание (TON)', hint: 'Фиксированная цена для всех заданий' },
            { key: 'ref_register_bonus',   label: 'Бонус за регистрацию (TON)', hint: 'Разовый бонус пригласившему' },
            { key: 'ref_task_percent',     label: '% от задания реферала', hint: `Сейчас: ${settings.ref_task_percent || 10}%` },
            { key: 'ref_deposit_percent',  label: '% от депозита реферала', hint: `Сейчас: ${settings.ref_deposit_percent || 5}%` },
          ].map(s => (
            <div key={s.key} className="setting-group">
              <div className="setting-label">{s.label}</div>
              <div className="setting-row">
                <input
                  className="setting-input"
                  type="number"
                  step="0.1"
                  value={settings[s.key] || ''}
                  onChange={e => setSettings(p => ({...p, [s.key]: e.target.value}))}
                />
                <button className="save-btn" onClick={() => saveSetting(s.key)}>
                  {saving ? '...' : 'СОХР'}
                </button>
              </div>
              {s.hint && <div className="setting-hint">{s.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <div className="admin-section">
          <div className="add-task-form">
            <div className="atf-title">ДОБАВИТЬ ЗАДАНИЕ</div>

            <div className="atf-row">
              <label className="atf-label">ТИП</label>
              <div className="type-btns">
                <button
                  className={`type-btn ${form.type === 'subscribe' ? 'on' : ''}`}
                  onClick={() => setForm(p=>({...p, type:'subscribe', icon:'✈️'}))}
                >✈️ Подписка</button>
                <button
                  className={`type-btn ${form.type === 'bot' ? 'on' : ''}`}
                  onClick={() => setForm(p=>({...p, type:'bot', icon:'🤖'}))}
                >🤖 Бот</button>
              </div>
            </div>

            <div className="atf-row">
              <label className="atf-label">ССЫЛКА</label>
              <div className="atf-link-wrap">
                <input
                  className="atf-input"
                  placeholder="https://t.me/username"
                  value={form.link}
                  onChange={e => handleLinkChange(e.target.value)}
                />
                {loadingChannel && <div className="atf-spinner"/>}
              </div>
            </div>

            {form.channel_photo && (
              <div className="channel-preview">
                <img src={form.channel_photo} className="ch-photo" onError={e=>e.target.style.display='none'}/>
                <div className="ch-info">
                  <div className="ch-title">{form.channel_title}</div>
                  <div className="ch-link">{form.link}</div>
                </div>
              </div>
            )}

            <div className="atf-row">
              <label className="atf-label">НАЗВАНИЕ</label>
              <input
                className="atf-input"
                placeholder="Название задания"
                value={form.title}
                onChange={e => setForm(p=>({...p, title:e.target.value}))}
              />
            </div>

            <div className="atf-reward-info">
              Награда: <span>{settings.task_reward || '0.5'} TON</span> (из настроек)
            </div>

            <button className="atf-add-btn" onClick={addTask}>+ ДОБАВИТЬ</button>
          </div>

          <div className="tasks-list">
            {tasks.length === 0 && <div className="no-tasks">Нет заданий</div>}
            {tasks.map(task => (
              <div key={task.id} className="admin-task-item">
                {task.channel_photo
                  ? <img src={task.channel_photo} className="ati-photo" onError={e=>e.target.style.display='none'}/>
                  : <div className="ati-icon">{task.icon}</div>
                }
                <div className="ati-info">
                  <div className="ati-name">{task.title}</div>
                  <div className="ati-meta">
                    <span className={`ati-type ${task.type === 'bot' ? 'type-bot' : 'type-sub'}`}>
                      {task.type === 'bot' ? 'БОТ' : 'ПОДПИСКА'}
                    </span>
                    <span className="ati-reward">+{task.reward} TON</span>
                  </div>
                </div>
                <button className="ati-del" onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="admin-section">
          <div className="users-count">{users.length} пользователей</div>
          {users.map(u => (
            <div key={u.id} className="admin-user-item">
              <div className="aui-avatar">{(u.username||u.first_name||'?')[0].toUpperCase()}</div>
              <div className="aui-info">
                <div className="aui-name">{u.username || u.first_name || 'Пользователь'}</div>
                <div className="aui-meta">ID: {u.telegram_id} · Рефов: {u.referral_count}</div>
              </div>
              <div className="aui-balance">{parseFloat(u.balance_ton).toFixed(2)} TON</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
