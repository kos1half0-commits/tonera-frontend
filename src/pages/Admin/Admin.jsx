import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Admin.css'

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({})
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title:'', link:'', type:'tg', reward:'0.5', icon:'✈️' })
  const [saving, setSaving] = useState(false)

  const showToast = (msg, err) => {
    setToast({ msg, err })
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

  const saveSetting = async (key, value) => {
    setSaving(true)
    try {
      await api.post('/api/admin/settings', { key, value })
      showToast('СОХРАНЕНО')
    } catch { showToast('ОШИБКА', true) }
    setSaving(false)
  }

  const addTask = async () => {
    if (!form.title || !form.reward) return
    try {
      await api.post('/api/admin/tasks', form)
      showToast('ЗАДАНИЕ ДОБАВЛЕНО')
      setForm({ title:'', link:'', type:'tg', reward:'0.5', icon:'✈️' })
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
      {toast && <div className={`admin-toast ${toast.err ? 'err' : ''}`}>{toast.msg}</div>}

      <div className="admin-header">
        <div className="admin-title">⚙️ Админ панель</div>
      </div>

      <div className="admin-tabs">
        {['stats','settings','tasks','users'].map(t => (
          <button key={t} className={`atab ${tab===t?'on':''}`} onClick={() => setTab(t)}>
            {t==='stats'?'СТАТ':t==='settings'?'НАСТР':t==='tasks'?'ЗАДАНИЯ':'ЮЗЕРЫ'}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div className="admin-section">
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.total_users}</div><div className="astat-lbl">Пользователей</div></div>
            <div className="astat-card"><div className="astat-val">{stats.active_stakes}</div><div className="astat-lbl">Активных стейков</div></div>
            <div className="astat-card"><div className="astat-val">{parseFloat(stats.total_staked).toFixed(2)}</div><div className="astat-lbl">TON в стейкинге</div></div>
            <div className="astat-card"><div className="astat-val">{stats.total_referrals}</div><div className="astat-lbl">Рефералов</div></div>
            <div className="astat-card"><div className="astat-val">{stats.tasks_completed}</div><div className="astat-lbl">Заданий выполнено</div></div>
          </div>
          <button className="reload-btn" onClick={loadAll}>↻ Обновить</button>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div className="admin-section">
          <div className="setting-group">
            <div className="setting-label">Бонус за регистрацию (TON)</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="0.1"
                defaultValue={settings.ref_register_bonus || '0.5'}
                onBlur={e => setSettings(p => ({...p, ref_register_bonus: e.target.value}))}
              />
              <button className="save-btn" onClick={() => saveSetting('ref_register_bonus', settings.ref_register_bonus)}>
                {saving ? '...' : 'СОХРАНИТЬ'}
              </button>
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">% от задания реферала</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1"
                defaultValue={settings.ref_task_percent || '10'}
                onBlur={e => setSettings(p => ({...p, ref_task_percent: e.target.value}))}
              />
              <button className="save-btn" onClick={() => saveSetting('ref_task_percent', settings.ref_task_percent)}>
                {saving ? '...' : 'СОХРАНИТЬ'}
              </button>
            </div>
            <div className="setting-hint">Текущее: {settings.ref_task_percent || 10}%</div>
          </div>

          <div className="setting-group">
            <div className="setting-label">% от депозита реферала</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1"
                defaultValue={settings.ref_deposit_percent || '5'}
                onBlur={e => setSettings(p => ({...p, ref_deposit_percent: e.target.value}))}
              />
              <button className="save-btn" onClick={() => saveSetting('ref_deposit_percent', settings.ref_deposit_percent)}>
                {saving ? '...' : 'СОХРАНИТЬ'}
              </button>
            </div>
            <div className="setting-hint">Текущее: {settings.ref_deposit_percent || 5}%</div>
          </div>
        </div>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <div className="admin-section">
          <div className="add-task-form">
            <div className="atf-title">ДОБАВИТЬ ЗАДАНИЕ</div>
            <div className="atf-row">
              <input className="atf-input" placeholder="Название" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}/>
            </div>
            <div className="atf-row">
              <input className="atf-input" placeholder="Ссылка (https://...)" value={form.link} onChange={e => setForm(p=>({...p,link:e.target.value}))}/>
            </div>
            <div className="atf-cols">
              <select className="atf-select" value={form.type} onChange={e => {
                const icons = { tg:'✈️', yt:'▶️', tw:'🐦', stake:'💰', custom:'⭐' }
                setForm(p=>({...p, type:e.target.value, icon: icons[e.target.value]||'⭐'}))
              }}>
                <option value="tg">Telegram</option>
                <option value="yt">YouTube</option>
                <option value="tw">Twitter</option>
                <option value="stake">Стейкинг</option>
                <option value="custom">Другое</option>
              </select>
              <input className="atf-input" type="number" step="0.1" placeholder="Награда TON"
                value={form.reward} onChange={e => setForm(p=>({...p,reward:e.target.value}))}/>
            </div>
            <button className="atf-add-btn" onClick={addTask}>+ ДОБАВИТЬ</button>
          </div>

          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task.id} className="admin-task-item">
                <div className="ati-icon">{task.icon}</div>
                <div className="ati-info">
                  <div className="ati-name">{task.title}</div>
                  <div className="ati-reward">+{task.reward} TON</div>
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
