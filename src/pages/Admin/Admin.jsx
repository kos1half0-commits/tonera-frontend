import { useState, useEffect, useRef } from 'react'
import api from '../../api/index'
import './Admin.css'

const SETTING_GROUPS = [
  {
    id: 'spin_custom',
    title: '🎰 Спин',
    settings: []
  },
  {
    id: 'trading',
    title: '📈 Трейдинг',
    settings: [
      { key: 'trading_enabled', label: 'Статус (0=откл, 1=вкл, 2=тех.работы, 3=только админ)' },
      { key: 'trading_multiplier', label: 'Процент выплаты (%, напр. 90)' },
      { key: 'trading_bank',        label: 'Банк трейдинга (TON)' },
      { key: 'trading_commission',  label: 'Комиссия с каждой ставки (%)' },
      { key: 'trading_profit_fee',  label: '% с комиссии — чистая прибыль' },
    ]
  },
  {
    id: 'slots',
    title: '🎰 Слоты',
    settings: [
      { key: 'slots_enabled', label: 'Статус (0=откл, 1=вкл, 2=тех.работы, 3=только админ)' },
      { key: 'slots_min_bet', label: 'Мин. ставка (TON)' },
      { key: 'slots_bank',       label: 'Банк слотов (TON)' },
      { key: 'slots_win_chance', label: 'Шанс выигрыша (%)' },
    ]
  },
  {
    id: 'partnership',
    title: '🤝 Партнёрство',
    settings: [
      { key: 'partnership_enabled',     label: 'Статус (0=откл, 1=вкл, 2=только админ)' },
      { key: 'partnership_ref_percent',  label: 'Реф. % для партнёров' },
      { key: 'partnership_min_subs',     label: 'Мин. подписчиков канала' },
    ]
  },
  {
    id: 'staking',
    title: '📈 Стейкинг',
    settings: [
      { key: 'min_deposit',  label: 'Минимальный депозит (TON)' },
      { key: 'min_withdraw', label: 'Минимальный вывод (TON)' },
      { key: 'min_reinvest', label: 'Минимальный реинвест (TON)' },
      { key: 'min_collect',          label: 'Минимальный сбор (TON)' },
      { key: 'staking_withdraw_fee', label: 'Комиссия вывода из стейка (%)' },
    ]
  },
  {
    id: 'tasks',
    title: '✅ Задания',
    settings: [
      { key: 'task_reward',      label: 'Награда исполнителю (TON)' },
      { key: 'task_price',       label: 'Цена для заказчика (TON)' },
      { key: 'task_ref_bonus',   label: 'Реф. бонус за задание (TON)' },
      { key: 'task_project_fee', label: 'Комиссия проекта (TON)' },
    ]
  },

  {
    id: 'wallet',
    title: '💎 Кошелёк проекта',
    settings: [
      { key: 'project_wallet',  label: 'Адрес кошелька (TON)' },
      { key: 'min_deposit_ton', label: 'Мин. сумма депозита (TON)' },
      { key: 'withdraw_fee',    label: 'Комиссия за вывод (TON)' },
      { key: 'min_withdraw_ton', label: 'Минимальный вывод (TON)' },
    ]
  },
  {
    id: 'referrals',
    title: '👥 Рефералы',
    settings: [
      { key: 'ref_register_bonus',  label: 'Бонус за регистрацию (TON)' },
      { key: 'ref_task_percent',    label: '% от задания реферала' },
      { key: 'ref_deposit_percent', label: '% от депозита реферала' },
    ]
  },
]

function PartnershipAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/api/partnership/all').then(r => { setItems(r.data||[]); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const approve = async (id) => { await api.post(`/api/partnership/approve/${id}`); load() }
  const reject  = async (id) => { await api.post(`/api/partnership/reject/${id}`);  load() }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>
  if (!items.length) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет заявок</div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {items.map(p => (
        <div key={p.id} style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff'}}>#{p.id}</span>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1}}>{p.username ? '@'+p.username : p.first_name}</span>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,padding:'3px 8px',borderRadius:6,
              background: p.status==='approved' ? 'rgba(0,230,118,0.15)' : p.status==='rejected' ? 'rgba(255,77,106,0.15)' : 'rgba(255,179,0,0.15)',
              color: p.status==='approved' ? '#00e676' : p.status==='rejected' ? '#ff4d6a' : '#ffb300'
            }}>{p.status==='approved'?'ОДОБРЕН':p.status==='rejected'?'ОТКЛ':'ОЖИДАЕТ'}</span>
          </div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.5)',marginBottom:4}}>📢 {p.channel_url}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:8}}>🔗 {p.post_url}</div>
          {p.status === 'pending' && (
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => approve(p.id)} style={{flex:1,padding:'7px',border:'none',borderRadius:8,background:'rgba(0,230,118,0.2)',color:'#00e676',fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer'}}>✅ ОДОБРИТЬ</button>
              <button onClick={() => reject(p.id)}  style={{flex:1,padding:'7px',border:'none',borderRadius:8,background:'rgba(255,77,106,0.15)',color:'#ff4d6a',fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer'}}>❌ ОТКЛОНИТЬ</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminChart({ data, metric }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#060f2a'
    ctx.fillRect(0, 0, W, H)

    const values = data.map(d => parseFloat(d[metric]) || 0)
    const maxV = Math.max(...values, 1)
    const pad = { l: 36, r: 12, t: 16, b: 28 }
    const chartW = W - pad.l - pad.r
    const chartH = H - pad.t - pad.b

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * i / 4
      ctx.strokeStyle = 'rgba(26,95,255,0.1)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke()
      ctx.fillStyle = 'rgba(232,242,255,0.3)'
      ctx.font = '8px Orbitron,sans-serif'
      ctx.textAlign = 'right'
      const lbl = maxV * (1 - i/4)
      ctx.fillText(lbl >= 1 ? Math.round(lbl) : lbl.toFixed(2), pad.l - 4, y + 3)
    }

    // Bars
    const bw = chartW / data.length * 0.6
    const gap = chartW / data.length

    data.forEach((d, i) => {
      const v = parseFloat(d[metric]) || 0
      const x = pad.l + i * gap + gap * 0.2
      const bh = (v / maxV) * chartH
      const y = pad.t + chartH - bh

      const grad = ctx.createLinearGradient(0, y, 0, pad.t + chartH)
      grad.addColorStop(0, '#1a5fff')
      grad.addColorStop(1, 'rgba(26,95,255,0.2)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, bw, bh, 3)
      ctx.fill()

      // Date label
      const date = new Date(d.date)
      ctx.fillStyle = 'rgba(232,242,255,0.4)'
      ctx.font = '7px DM Sans,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${date.getDate()}.${date.getMonth()+1}`, x + bw/2, H - 6)

      // Value on top
      if (v > 0) {
        ctx.fillStyle = '#00d4ff'
        ctx.font = '8px Orbitron,sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(v >= 1 ? Math.round(v) : v.toFixed(2), x + bw/2, y - 4)
      }
    })
  }, [data, metric])

  return <canvas ref={canvasRef} width={340} height={180} style={{width:'100%',height:'auto',borderRadius:12,display:'block'}} />
}

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const [settingsTab, setSettingsTab] = useState('staking')
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({})
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [saving, setSaving] = useState(null)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [botCheck, setBotCheck] = useState(null) // null | {ok, status}
  const [form, setForm] = useState({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at') // created_at | balance_ton | referral_count
  const [sortDir, setSortDir] = useState('desc')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [usersTab, setUsersTab] = useState('all')
  const [tickets, setTickets] = useState([])
  const [news, setNews] = useState([])
  const [newsTitle, setNewsTitle] = useState('')
  const [newsBody, setNewsBody] = useState('')
  const [activeTicket, setActiveTicket] = useState(null)
  const [replyMsg, setReplyMsg] = useState('') // all | donors
  const [chartData, setChartData] = useState([])
  const [replyText, setReplyText] = useState('')
  const [replyId, setReplyId] = useState(null)
  const [chartDays, setChartDays] = useState(7)
  const [chartMetric, setChartMetric] = useState('new_users')
  const chartRef = useRef(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [maintenance, setMaintenance] = useState(false)
  const [spinSectors, setSpinSectors] = useState([])
  const [editSector, setEditSector] = useState(null)
  const [uptime, setUptime] = useState('')
  const [dbBackup, setDbBackup] = useState(null)
  const linkTimer = useRef(null)

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [s, se, t, u, w, maint] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/settings'),
        api.get('/api/admin/tasks'),
        api.get('/api/admin/users'),
        api.get('/api/admin/withdrawals'),
        api.get('/api/admin/maintenance'),
      ])
      setStats(s.data)
      setSettings(se.data)
      setTasks(t.data)
      setUsers(u.data)
      setWithdrawals(w.data || [])
      try {
        const spinInfo = await api.get('/api/spin/info')
        setSpinSectors(spinInfo.data.sectors || [])
      } catch {}
      setMaintenance(maint.data?.maintenance === '1')
      const chart = await api.get('/api/admin/chart?days=7')
      setChartData(chart.data || [])
      const sup = await api.get('/api/support/all')
      setTickets(sup.data || [])
      const nws = await api.get('/api/news')
      setNews(nws.data || [])
    } catch {}
  }

  const saveSetting = async (key) => {
    setSaving(key)
    try {
      await api.post('/api/admin/settings', { key, value: settings[key] })
      showToast('СОХРАНЕНО ✓')
    } catch { showToast('ОШИБКА', true) }
    setSaving(null)
  }

  const handleLinkChange = async (link) => {
    if (!link) return
    let normalizedLink = link.trim()
    if (normalizedLink.startsWith('@')) {
      normalizedLink = 'https://t.me/' + normalizedLink.slice(1)
    } else if (!normalizedLink.includes('t.me/')) {
      normalizedLink = 'https://t.me/' + normalizedLink
    } else if (!normalizedLink.startsWith('http')) {
      normalizedLink = 'https://' + normalizedLink
    }
    link = normalizedLink
    setForm(p => ({...p, link}))
    setLoadingChannel(true)
    setBotCheck(null)
    try {
      const infoRes = await api.get(`/api/channels/info?link=${encodeURIComponent(link)}`)
      setForm(p => ({ ...p, title: infoRes.data.title || p.title, channel_title: infoRes.data.title || '', channel_photo: infoRes.data.photo || '', icon: p.type === 'bot' ? '🤖' : '✈️' }))
      if (form.type === 'subscribe') {
        const checkRes = await api.get(`/api/channels/check?link=${encodeURIComponent(link)}`)
        setBotCheck(checkRes.data)
      }
    } catch {}
    setLoadingChannel(false)
  }

  const addTask = async () => {
    if (!form.title.trim()) { showToast('ВВЕДИ НАЗВАНИЕ', true); return }
    try {
      await api.post('/api/admin/tasks', form)
      showToast('ЗАДАНИЕ ДОБАВЛЕНО ✓')
      setForm({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
      setBotCheck(null)
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

  const blockUser = async (user) => {
    try {
      await api.post(`/api/admin/users/${user.id}/block`)
      setUsers(prev => prev.map(u => u.id === user.id ? {...u, is_blocked: true} : u))
      showToast('ЗАБЛОКИРОВАН')
    } catch { showToast('ОШИБКА', true) }
  }

  const unblockUser = async (user) => {
    try {
      await api.post(`/api/admin/users/${user.id}/unblock`)
      setUsers(prev => prev.map(u => u.id === user.id ? {...u, is_blocked: false} : u))
      showToast('РАЗБЛОКИРОВАН')
    } catch { showToast('ОШИБКА', true) }
  }

  useEffect(() => {
    const launchDate = settings?.launch_date || '2025-03-01'
    const START = new Date(launchDate)
    const update = () => {
      const diff = Date.now() - START.getTime()
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setUptime(`${days}д ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [settings?.launch_date])

  const toggleMaintenance = async () => {
    try {
      const newVal = !maintenance
      await api.post('/api/admin/maintenance', { value: newVal ? '1' : '0' })
      setMaintenance(newVal)
      showToast(newVal ? 'ТЕХ ОБСЛУЖИВАНИЕ ВКЛЮЧЕНО' : 'ПРОЕКТ АКТИВЕН')
    } catch { showToast('ОШИБКА', true) }
  }

  const restoreBackup = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.users) { showToast('НЕВЕРНЫЙ ФАЙЛ', true); return }
      if (!window.confirm(`Восстановить из бэкапа от ${data.date?.slice(0,10)}? Данные будут перезаписаны.`)) return
      const r = await api.post('/api/admin/restore', data)
      showToast(`ВОССТАНОВЛЕНО: ${r.data.restored.users} юзеров, ${r.data.restored.stakes} стейков`)
      await loadAll()
    } catch (e) { showToast(e?.response?.data?.error || 'ОШИБКА', true) }
  }

  const downloadBackup = async () => {
    try {
      const r = await api.get('/api/admin/backup')
      const url = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `tonera-backup-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('БЭКАП СКАЧАН')
    } catch { showToast('ОШИБКА БЭКАПА', true) }
  }

  const openUserStats = async (user) => {
    setSelectedUser(user)
    try {
      const r = await api.get(`/api/admin/users/${user.id}/stats`)
      setUserStats(r.data)
    } catch {}
  }

  const markWithdrawalDone = async (id) => {
    try {
      await api.post(`/api/admin/withdrawals/${id}/complete`)
      setWithdrawals(prev => prev.map(w => w.id === id ? {...w, status:'completed'} : w))
      showToast('ОТМЕЧЕНО КАК ВЫПЛАЧЕНО')
    } catch { showToast('ОШИБКА', true) }
  }

  const deleteUser = async (user) => {
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setConfirmDelete(null)
      showToast('УДАЛЁН')
    } catch (e) { showToast(e?.response?.data?.error || 'ОШИБКА', true) }
  }

  const currentGroup = SETTING_GROUPS.find(g => g.id === settingsTab)

  return (
    <>
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-title">УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ?</div>
            <div className="confirm-name">{confirmDelete.username || confirmDelete.first_name}</div>
            <div className="confirm-warn">Это действие нельзя отменить</div>
            <div className="confirm-btns">
              <button className="mbtn mb-c" type="button" onClick={() => { setConfirmDelete(null) }}>Отмена</button>
              <button className="mbtn mb-del" type="button" onClick={() => { const u = confirmDelete; setConfirmDelete(null); deleteUser(u) }}>УДАЛИТЬ</button>
            </div>
          </div>
        </div>
      )}
    <div className="admin-wrap">
      {toast && <div className={`admin-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="admin-header">
        <div className="admin-title">⚙️ Админ панель</div>
        <div className="admin-only-note">🔒 Только для администратора</div>
      </div>

      <div className="admin-tabs">
        {[
          {id:'stats',icon:'📊',label:'СТАТ'},
          {id:'settings',icon:'⚙️',label:'НАСТР'},
          {id:'tasks',icon:'✅',label:'ЗАДАНИЯ'},
          {id:'users',icon:'👥',label:'ЮЗЕРЫ'},
          {id:'support',icon:'💬',label:'ТИКЕТЫ'},
          {id:'news',icon:'📢',label:'НОВОСТИ'},
          {id:'partnerships',icon:'🤝',label:'ПАРТНЁРЫ'},
          {id:'withdrawals',icon:'💸',label:`ЗАЯВКИ${withdrawals.filter(w=>w.status==='pending').length > 0 ? ' ('+withdrawals.filter(w=>w.status==='pending').length+')' : ''}`},
          {id:'system',icon:'🔧',label:'СИСТЕМА'},
        ].map(t => (
          <button key={t.id} className={`atab ${tab===t.id?'on':''}`} onClick={() => setTab(t.id)}>
            <span style={{fontSize:18,display:'block',lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:7,display:'block',marginTop:2,letterSpacing:'.05em'}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div className="admin-section">
          <div className="stats-section-title">👥 ПОЛЬЗОВАТЕЛИ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.total_users}</div><div className="astat-lbl">Всего</div></div>
            <div className="astat-card"><div className="astat-val">{stats.blocked_users}</div><div className="astat-lbl">Заблокировано</div></div>
            <div className="astat-card"><div className="astat-val">{stats.total_referrals}</div><div className="astat-lbl">Рефералов</div></div>
            <div className="astat-card"><div className="astat-val">{stats.tasks_completed}</div><div className="astat-lbl">Заданий выполнено</div></div>
          </div>

          <div className="stats-section-title">📈 СТЕЙКИНГ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.active_stakes}</div><div className="astat-lbl">Активных стейков</div></div>
            <div className="astat-card"><div className="astat-val">{parseFloat(stats.total_staked).toFixed(2)}</div><div className="astat-lbl">TON в стейке</div></div>
            <div className="astat-card fee"><div className="astat-val">{parseFloat(stats.staking_fee_earned||0).toFixed(4)}</div><div className="astat-lbl">Комиссия стейкинга</div></div>
          </div>

          <div className="stats-section-title">✅ ЗАДАНИЯ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.active_tasks||0}</div><div className="astat-lbl">Активных заданий</div></div>
            <div className="astat-card fee"><div className="astat-val">{parseFloat(stats.task_fee_earned||0).toFixed(4)}</div><div className="astat-lbl">Комиссия заданий</div></div>
          </div>

          {/* CHART */}
          <div className="stats-section-title">📊 ГРАФИК</div>
          <div className="chart-controls">
            {[7,14,30].map(d => (
              <button key={d} className={`chart-day-btn ${chartDays===d?'on':''}`} onClick={async()=>{
                setChartDays(d)
                const r = await api.get(`/api/admin/chart?days=${d}`)
                setChartData(r.data || [])
              }}>{d}д</button>
            ))}
            <select className="chart-metric-sel" value={chartMetric} onChange={e=>setChartMetric(e.target.value)}>
              <option value="new_users">Новые юзеры</option>
              <option value="active_users">Активные юзеры</option>
              <option value="deposits">Депозиты (TON)</option>
              <option value="withdrawals">Выводы (TON)</option>
              <option value="profit">Доход проекта</option>
              <option value="trading_bets">Ставки трейдинга</option>
              <option value="spins">Спины</option>
              <option value="ads_viewed">Просмотры рекламы</option>
            </select>
          </div>
          <AdminChart data={chartData} metric={chartMetric} />

          <div className="stats-section-title">📈 ТРЕЙДИНГ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.trading_total||0}</div><div className="astat-lbl">Всего ставок</div></div>
            <div className="astat-card green"><div className="astat-val">{stats.trading_wins||0}</div><div className="astat-lbl">Выигрышей</div></div>
            <div className="astat-card red"><div className="astat-val">{stats.trading_loses||0}</div><div className="astat-lbl">Проигрышей</div></div>
            <div className="astat-card"><div className="astat-val">{stats.trading_refunds||0}</div><div className="astat-lbl">Возвратов</div></div>
            <div className="astat-card" style={{borderColor:'rgba(0,212,255,0.3)',background:'rgba(0,212,255,0.05)'}}><div className="astat-val" style={{color:'#00d4ff'}}>{parseFloat(stats.trading_bank||0).toFixed(4)}</div><div className="astat-lbl">Банк трейдинга</div></div>
            <div className="astat-card fee"><div className="astat-val">{parseFloat(stats.trading_profit||0).toFixed(4)}</div><div className="astat-lbl">Чистая прибыль</div></div>
          </div>

          <div className="stats-section-title">🎰 СЛОТЫ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.slots_total||0}</div><div className="astat-lbl">Всего спинов</div></div>
            <div className="astat-card green"><div className="astat-val">{stats.slots_wins||0}</div><div className="astat-lbl">Выигрышей</div></div>
            <div className="astat-card" style={{borderColor:'rgba(0,212,255,0.3)',background:'rgba(0,212,255,0.05)'}}><div className="astat-val" style={{color:'#00d4ff'}}>{parseFloat(stats.slots_bank||0).toFixed(4)}</div><div className="astat-lbl">Банк слотов</div></div>
          </div>

          <div className="stats-section-title">🎰 СПИН</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-val">{stats.total_spins||0}</div><div className="astat-lbl">Всего спинов</div></div>
            <div className="astat-card fee"><div className="astat-val">{parseFloat(stats.spin_revenue||0).toFixed(4)}</div><div className="astat-lbl">Доход со спинов</div></div>
            <div className="astat-card green"><div className="astat-val">{parseFloat(stats.spin_profit||0).toFixed(4)}</div><div className="astat-lbl">Чистая прибыль</div></div>
            <div className="astat-card" style={{borderColor:'rgba(255,179,0,0.3)',background:'rgba(255,179,0,0.05)'}}><div className="astat-val" style={{color:'#ffb300'}}>{parseFloat(stats.current_jackpot||0).toFixed(4)}</div><div className="astat-lbl">Джекпот сейчас</div></div>
            <div className="astat-card green"><div className="astat-val">{parseFloat(stats.spin_pool||0).toFixed(4)}</div><div className="astat-lbl">Пул выплат</div></div>
          </div>

          <div className="stats-section-title">💰 ФИНАНСЫ ПРОЕКТА</div>
          <div className="stats-cards">
            <div className="astat-card green"><div className="astat-val">+{parseFloat(stats.total_deposited||0).toFixed(2)}</div><div className="astat-lbl">Пополнено</div></div>
            <div className="astat-card red"><div className="astat-val">-{parseFloat(stats.total_withdrawn||0).toFixed(2)}</div><div className="astat-lbl">Выведено</div></div>
            <div className="astat-card fee"><div className="astat-val">{(parseFloat(stats.total_deposited||0) - parseFloat(stats.total_withdrawn||0)).toFixed(2)}</div><div className="astat-lbl">Баланс проекта</div></div>
          </div>

          <button className="reload-btn" onClick={loadAll}>↻ Обновить</button>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div className="admin-section">
          <div className="settings-tabs">
            {SETTING_GROUPS.map(g => (
              <button key={g.id} className={`stab ${settingsTab===g.id?'on':''}`} onClick={() => setSettingsTab(g.id)}>
                {g.title}
              </button>
            ))}
          </div>

          {currentGroup && (
            <div className="settings-group-card">
              <div className="sg-title">{currentGroup.title}</div>
              {currentGroup.settings.map(s => (
                <div key={s.key} className="setting-item">
                  <div className="setting-label">{s.label}</div>
                  <div className="setting-row">
                    {s.key === 'project_wallet' ? (
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                        <div style={{padding:'10px 14px',background:'#0b1630',border:'1px solid rgba(26,95,255,0.4)',borderRadius:10,fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00d4ff',wordBreak:'break-all',lineHeight:1.6,minHeight:40}}>
                          {settings[s.key] || 'Не задан'}
                        </div>
                        <button style={{padding:'9px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.4)',borderRadius:10,fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',cursor:'pointer'}}
                          onClick={() => {
                            const val = prompt('Введите адрес TON кошелька:', settings['project_wallet'] || '')
                            if (val !== null) setSettings(p => ({...p, project_wallet: val.trim()}))
                          }}>
                          ✏️ ИЗМЕНИТЬ АДРЕС
                        </button>
                      </div>
                    ) : (
                      <input
                        className="setting-input"
                        type="number"
                        step="0.0001"
                        value={settings[s.key] ?? ''}
                        onChange={e => setSettings(p => ({...p, [s.key]: e.target.value}))}
                      />
                    )}
                    <button
                      className="save-btn"
                      onClick={() => saveSetting(s.key)}
                    >
                      {saving === s.key ? '...' : 'СОХР'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <button className={`type-btn ${form.type==='subscribe'?'on':''}`} onClick={() => { setForm({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' }); setBotCheck(null) }}>✈️ Подписка</button>
                <button className={`type-btn ${form.type==='bot'?'on':''}`} onClick={() => { setForm({ title:'', link:'', type:'bot', icon:'🤖', channel_title:'', channel_photo:'' }); setBotCheck(null) }}>🤖 Бот</button>
              </div>
            </div>
            <div className="atf-row">
              <label className="atf-label">ССЫЛКА</label>
              <div className="atf-link-wrap">
                <input className="atf-input" placeholder="https://t.me/username" value={form.link} onChange={e => setForm(p=>({...p,link:e.target.value}))}/>
                <button className="atf-check-btn" onClick={() => handleLinkChange(form.link)} disabled={loadingChannel || !form.link}>
                  {loadingChannel ? '...' : '→'}
                </button>
              </div>
            </div>
            {form.channel_photo && (
              <div className="channel-preview">
                <img src={form.channel_photo} className="ch-photo" onError={e=>e.target.style.display='none'}/>
                <div className="ch-info"><div className="ch-title">{form.channel_title}</div><div className="ch-link">{form.link}</div></div>
              </div>
            )}
            {botCheck !== null && form.type === 'subscribe' && (
              <div className={`bot-check ${botCheck.ok ? 'ok' : 'fail'}`}>
                {botCheck.ok ? (
                  <span>✅ Бот является администратором канала</span>
                ) : (
                  <div>
                    <div>❌ Бот не является администратором</div>
                    <div className="bot-check-hint">
                      Добавь @tonera_bot в канал как администратора:<br/>
                      1. Открой настройки канала<br/>
                      2. Администраторы → Добавить администратора<br/>
                      3. Найди @tonera_bot и добавь
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="atf-row">
              <label className="atf-label">НАЗВАНИЕ</label>
              <input className="atf-input" placeholder="Название задания" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}/>
            </div>
            <div className="atf-reward-info">Награда: <span>{settings.task_reward || '0.001'} TON</span></div>
            <button className="atf-add-btn" onClick={addTask}>+ ДОБАВИТЬ</button>
          </div>

          <div className="tasks-list">
            {tasks.length === 0 && <div className="no-tasks">Нет заданий</div>}
            {tasks.map(task => (
              <div key={task.id} className="admin-task-item">
                {task.channel_photo ? <img src={task.channel_photo} className="ati-photo" onError={e=>e.target.style.display='none'}/> : <div className="ati-icon">{task.icon}</div>}
                <div className="ati-info">
                  <div className="ati-name">{task.title}</div>
                  <div className="ati-meta">
                    <span className={`ati-type ${task.type==='bot'?'type-bot':'type-sub'}`}>{task.type==='bot'?'БОТ':'ПОДПИСКА'}</span>
                    <span className="ati-reward">+{task.reward} TON</span>
                    <span className="ati-exec">{task.executions || 0} выполнений</span>
                  </div>
                </div>
                <button className="ati-del" onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WITHDRAWALS */}
      {tab === 'withdrawals' && (
        <div className="admin-section">
          <div className="users-count">{withdrawals.filter(w=>w.status==='pending').length} ожидают обработки</div>
          {withdrawals.length === 0 && <div className="no-tasks">Нет заявок</div>}
          {withdrawals.map(w => {
            // Парсим адрес и net сумму из label
            const labelParts = (w.label || '').split('|net:')
            const addr = labelParts[0]?.replace('Вывод на ', '') || '—'
            const netAmount = labelParts[1] ? parseFloat(labelParts[1]).toFixed(4) : Math.abs(parseFloat(w.amount)).toFixed(4)
            const amount = netAmount
            return (
              <div key={w.id} className={`withdrawal-item ${w.status}`}>
                <div className="wi-info">
                  <div className="wi-user">{w.username || w.first_name || 'Пользователь'}</div>
                  <div className="wi-date">{new Date(w.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  <div className="wi-copy-row">
                    <div className="wi-addr-short">{addr.length > 20 ? addr.slice(0,10)+'...'+addr.slice(-6) : addr}</div>
                    <button className="wi-copy-btn" onClick={() => { navigator.clipboard.writeText(addr); showToast('АДРЕС СКОПИРОВАН') }}>📋 Адрес</button>
                    <button className="wi-copy-btn wi-copy-amt" onClick={() => { navigator.clipboard.writeText(amount); showToast('СУММА СКОПИРОВАНА') }}>📋 {amount}</button>
                  </div>
                </div>
                <div className="wi-right">
                  <div className={`wi-status ${w.status}`}>{w.status === 'pending' ? 'ОЖИДАЕТ' : 'ВЫПЛАЧЕНО'}</div>
                  {w.status === 'pending' && (
                    <button className="wi-done-btn" onClick={() => markWithdrawalDone(w.id)}>✓</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SPIN SETTINGS */}
      {tab === 'settings' && settingsTab === 'spin_custom' && (
        <div className="admin-section">
          <div className="stats-section-title">🎰 НАСТРОЙКИ СПИНА</div>
          <div className="setting-item">
            <div className="setting-label">Цена спина (TON)</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="0.01" value={settings['spin_price']||''} onChange={e=>setSettings(p=>({...p,spin_price:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_price')}>{saving==='spin_price'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">Включён (1/0)</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_enabled']||''} onChange={e=>setSettings(p=>({...p,spin_enabled:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_enabled')}>{saving==='spin_enabled'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">% от спина в джекпот</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_jackpot_fee']||''} onChange={e=>setSettings(p=>({...p,spin_jackpot_fee:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_jackpot_fee')}>{saving==='spin_jackpot_fee'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">% чистой прибыли проекту</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_profit_fee']||''} onChange={e=>setSettings(p=>({...p,spin_profit_fee:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_profit_fee')}>{saving==='spin_profit_fee'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="stats-section-title" style={{marginTop:16}}>СЕКТОРЫ</div>
          {spinSectors.map((s,i) => (
            <div key={i} className="sector-item">
              <div className="si-info">
                <div className="si-label">{s.label}</div>
                <div className="si-meta">Шанс: {s.chance}% · Приз: {s.type==='jackpot'?'ДЖЕКПОТ':`${s.value} TON`}</div>
              </div>
              <button className="si-edit" onClick={()=>setEditSector({...s,index:i})}>✏️</button>
            </div>
          ))}
        </div>
      )}

      {/* SECTOR EDIT MODAL */}
      {editSector && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setEditSector(null)}>
          <div className="modal-inner">
            <div className="modal-title">РЕДАКТОР СЕКТОРА</div>
            <div className="cf-row"><div className="cf-label">НАЗВАНИЕ</div>
              <input className="cf-input" value={editSector.label} onChange={e=>setEditSector(p=>({...p,label:e.target.value}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ТИП (ton/nothing/jackpot)</div>
              <input className="cf-input" value={editSector.type} onChange={e=>setEditSector(p=>({...p,type:e.target.value}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ПРИЗ (TON)</div>
              <input className="cf-input" type="number" step="0.01" value={editSector.value} onChange={e=>setEditSector(p=>({...p,value:parseFloat(e.target.value)||0}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ШАНС (%)</div>
              <input className="cf-input" type="number" step="1" value={editSector.chance} onChange={e=>setEditSector(p=>({...p,chance:parseFloat(e.target.value)||0}))}/>
            </div>
            <div className="mbtns" style={{marginTop:14}}>
              <button className="mbtn mb-c" onClick={()=>setEditSector(null)}>Отмена</button>
              <button className="mbtn mb-ok" onClick={async()=>{
                const updated = [...spinSectors]
                updated[editSector.index] = {label:editSector.label,type:editSector.type,value:editSector.value,chance:editSector.chance}
                await api.post('/api/admin/settings',{key:'spin_sectors',value:JSON.stringify(updated)})
                setSpinSectors(updated)
                setEditSector(null)
                showToast('СЕКТОР СОХРАНЁН')
              }}>СОХРАНИТЬ</button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT */}
      {tab === 'partnerships' && (
        <div className="admin-section">
          <div className="stats-section-title">🤝 ЗАЯВКИ НА ПАРТНЁРСТВО</div>
          <PartnershipAdmin />
        </div>
      )}

      {tab === 'news' && (
        <div className="admin-section">
          <div className="stats-section-title">📢 НОВОСТИ ПРОЕКТА</div>
          <div className="news-admin-form">
            <input className="news-admin-input" placeholder="Заголовок" value={newsTitle} onChange={e=>setNewsTitle(e.target.value)}/>
            <textarea className="news-admin-textarea" placeholder="Текст новости..." value={newsBody} onChange={e=>setNewsBody(e.target.value)} rows={3}/>
            <button className="news-admin-btn" onClick={async()=>{
              if(!newsTitle.trim()||!newsBody.trim()) return
              await api.post('/api/news',{title:newsTitle,body:newsBody})
              setNewsTitle(''); setNewsBody('')
              const r = await api.get('/api/news'); setNews(r.data||[])
              showToast('НОВОСТЬ ОПУБЛИКОВАНА')
            }}>📢 ОПУБЛИКОВАТЬ</button>
          </div>
          {news.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.3)',padding:20,fontFamily:'DM Sans'}}>Нет новостей</div>}
          {news.map(n => (
            <div key={n.id} className="news-admin-item">
              <div className="news-admin-header">
                <div className="news-admin-title">{n.title}</div>
                <button className="news-del-btn" onClick={async()=>{
                  await api.delete(`/api/news/${n.id}`)
                  const r = await api.get('/api/news'); setNews(r.data||[])
                }}>✕</button>
              </div>
              <div className="news-admin-body">{n.body}</div>
              <div className="news-item-date">{new Date(n.created_at).toLocaleDateString('ru',{day:'numeric',month:'long'})}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && !activeTicket && (
        <div className="admin-section">
          <div className="stats-section-title">💬 ОБРАЩЕНИЯ</div>
          {tickets.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.3)',padding:20,fontFamily:'DM Sans'}}>Нет обращений</div>}
          {tickets.map(t => (
            <div key={t.id} className="sup-ticket" style={{cursor:'pointer'}} onClick={() => setActiveTicket(t)}>
              <div className="sup-t-header">
                <span className="sup-t-id">#{t.id} · {t.username ? '@'+t.username : t.first_name}</span>
                <span className="sup-t-status" style={{color: t.status==='answered'?'#26a69a':t.status==='closed'?'#888':'#ffb300'}}>
                  {t.status==='answered'?'Отвечено':t.status==='closed'?'Закрыто':'Открыт'}
                </span>
              </div>
              <div className="sup-t-msg">{t.message}</div>
              <div className="sup-t-date">{new Date(t.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && activeTicket && (
        <div className="admin-section">
          <button className="sup-back" onClick={() => setActiveTicket(null)} style={{marginBottom:12}}>← Назад</button>
          <div className="stats-section-title">Тикет #{activeTicket.id} · {activeTicket.username ? '@'+activeTicket.username : activeTicket.first_name}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            <div className="sup-msg user"><div className="sup-msg-text">{activeTicket.message}</div></div>
            {(activeTicket.replies||[]).map((r,i) => (
              <div key={i} className={`sup-msg ${r.from_admin?'admin':'user'}`}>
                {r.from_admin && <div className="sup-admin-label">Поддержка</div>}
                <div className="sup-msg-text">{r.message}</div>
              </div>
            ))}
          </div>
          {activeTicket.status !== 'closed' && (
            <>
              <textarea className="sup-textarea" placeholder="Ответ..." value={replyMsg} onChange={e=>setReplyMsg(e.target.value)} rows={3}/>
              <div className="mbtns" style={{marginTop:10}}>
                <button className="mbtn mb-c" onClick={async()=>{
                  await api.post('/api/support/admin/close',{ticket_id:activeTicket.id})
                  setActiveTicket(null)
                  const r = await api.get('/api/support/admin/all')
                  setTickets(r.data||[])
                }}>Закрыть</button>
                <button className="mbtn mb-ok" disabled={!replyMsg.trim()} onClick={async()=>{
                  await api.post('/api/support/admin/reply',{ticket_id:activeTicket.id,message:replyMsg})
                  setReplyMsg('')
                  const r = await api.get('/api/support/admin/all')
                  setTickets(r.data||[])
                  setActiveTicket(r.data?.find(t=>t.id===activeTicket.id)||null)
                }}>Отправить</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SYSTEM */}
      {tab === 'system' && (
        <div className="admin-section">
          <div className="system-card">
            <div className="sys-title">⏱ ПРОЕКТ РАБОТАЕТ</div>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:22,fontWeight:700,color:'#00d4ff',textAlign:'center',padding:'10px 0',letterSpacing:'.05em'}}>{uptime}</div>
            <div style={{textAlign:'center',marginTop:4}}>
              <button className="sys-btn" style={{width:'auto',padding:'8px 16px',fontSize:9}} onClick={() => {
                const val = prompt('Дата запуска (ГГГГ-ММ-ДД):', settings?.launch_date || '2025-03-01')
                if (val) { api.post('/api/admin/settings', { key: 'launch_date', value: val }).then(() => setSettings(p => ({...p, launch_date: val}))).catch(() => {}) }
              }}>✏️ ИЗМЕНИТЬ ДАТУ</button>
            </div>
          </div>
          <div className="system-card">
            <div className="sys-title">🔧 ТЕХ ОБСЛУЖИВАНИЕ</div>
            <div className="sys-desc">При включении юзеры не смогут зайти в приложение</div>
            <button className={`sys-toggle ${maintenance ? 'on' : ''}`} onClick={toggleMaintenance}>
              {maintenance ? '🔴 ВЫКЛЮЧИТЬ (сейчас активно)' : '🟢 ВКЛЮЧИТЬ'}
            </button>
          </div>
          <div className="system-card">
            <div className="sys-title">💾 РЕЗЕРВНАЯ КОПИЯ БД</div>
            <div className="sys-desc">Скачать все данные проекта в формате JSON для переноса на другой сервер</div>
            <button className="sys-btn" onClick={downloadBackup} style={{marginBottom:8}}>⬇ СКАЧАТЬ БЭКАП</button>
            <label className="sys-btn" style={{display:'block',textAlign:'center',cursor:'pointer'}}>
              ⬆ ВОССТАНОВИТЬ ИЗ ФАЙЛА
              <input type="file" accept=".json" style={{display:'none'}} onChange={e => { if(e.target.files[0]) restoreBackup(e.target.files[0]) }}/>
            </label>
          </div>
          <div className="system-card">
            <div className="sys-title">📤 ВОССТАНОВИТЬ ИЗ БЭКАПА</div>
            <div className="sys-desc">Загрузи JSON файл бэкапа для восстановления данных</div>
            <input type="file" accept=".json" id="restore-file" style={{display:'none'}} onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              try {
                const text = await file.text()
                const data = JSON.parse(text)
                if (!window.confirm(`Восстановить из бэкапа от ${data.date?.slice(0,10)}?
Юзеров: ${data.users?.length}, Стейков: ${data.stakes?.length}`)) return
                const r = await api.post('/api/admin/restore', data)
                showToast(`ВОССТАНОВЛЕНО: ${r.data.restored.users} юзеров, ${r.data.restored.stakes} стейков`)
              } catch (err) {
                showToast('ОШИБКА: ' + (err?.response?.data?.error || err.message), true)
              }
              e.target.value = ''
            }}/>
            <button className="sys-btn" style={{borderColor:'rgba(0,230,118,0.4)',color:'#00e676'}} onClick={() => document.getElementById('restore-file').click()}>
              ⬆ ЗАГРУЗИТЬ БЭКАП
            </button>
          </div>
          <div className="system-card">
            <div className="sys-title">♻️ ВОССТАНОВЛЕНИЕ ИЗ БЭКАПА</div>
            <div className="sys-desc">Загрузи JSON файл бэкапа для восстановления данных. Существующие данные будут перезаписаны.</div>
            <label className="sys-btn" style={{display:'block',textAlign:'center',cursor:'pointer'}}>
              ⬆ ЗАГРУЗИТЬ БЭКАП
              <input type="file" accept=".json" style={{display:'none'}} onChange={e => e.target.files[0] && restoreBackup(e.target.files[0])}/>
            </label>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && !selectedUser && (
        <div className="admin-section">
          <div className="users-search-row">
            <input className="users-search" placeholder="🔍 Поиск по имени или ID..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="users-sort-row">
            <div className="users-tabs">
              <button className={`utab ${usersTab==='all'?'on':''}`} onClick={() => setUsersTab('all')}>ВСЕ</button>
              <button className={`utab ${usersTab==='donors'?'on':''}`} onClick={() => setUsersTab('donors')}>💎 ДОНАТОРЫ</button>
              <button className={`utab ${usersTab==='traders'?'on':''}`} onClick={() => setUsersTab('traders')}>📊 ТРЕЙДЕРЫ</button>
              <button className={`utab ${usersTab==='spinners'?'on':''}`} onClick={() => setUsersTab('spinners')}>🎰 СПИНЕРЫ</button>
              <button className={`utab ${usersTab==='sloters'?'on':''}`} onClick={() => setUsersTab('sloters')}>🎰 СЛОТЕРЫ</button>
              <button className={`utab ${usersTab==='slotters'?'on':''}`} onClick={() => setUsersTab('slotters')}>🎲 СЛОТЕРЫ</button>
            </div>
            <div className="sort-btns">
              {[{k:'created_at',l:'ДАТА'},{k:'balance_ton',l:'БАЛАНС'},{k:'referral_count',l:'РЕФЫ'}].map(s => (
                <button key={s.k} className={`sort-btn ${sortBy===s.k?'on':''}`} onClick={() => { if(sortBy===s.k) setSortDir(d=>d==='desc'?'asc':'desc'); else { setSortBy(s.k); setSortDir('desc') } }}>
                  {s.l}{sortBy===s.k ? (sortDir==='desc'?' ↓':' ↑') : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="users-count">{users.length} пользователей</div>
          {users
            .filter(u => {
              if (usersTab === 'donors') return parseFloat(u.total_deposited || 0) > 0
              if (usersTab === 'traders') return parseInt(u.trading_count || 0) > 0
              if (usersTab === 'spinners') return parseInt(u.spin_count || 0) > 0
              if (usersTab === 'sloters') return parseInt(u.slots_count || 0) > 0
              if (usersTab === 'slotters') return parseInt(u.slots_count || 0) > 0
              const q = search.toLowerCase()
              return !q || (u.username||'').toLowerCase().includes(q) || (u.first_name||'').toLowerCase().includes(q) || String(u.telegram_id).includes(q)
            })
            .sort((a, b) => {
              const va = parseFloat(a[sortBy]) || new Date(a[sortBy]).getTime() || 0
              const vb = parseFloat(b[sortBy]) || new Date(b[sortBy]).getTime() || 0
              return sortDir === 'desc' ? vb - va : va - vb
            })
            .map(u => (
            <div key={u.id} className={`admin-user-item ${u.is_blocked ? 'blocked' : ''}`} onClick={() => openUserStats(u)} style={{cursor:'pointer'}}>
              <div className="aui-avatar">{(u.username||u.first_name||'?')[0].toUpperCase()}</div>
              <div className="aui-info">
                <div className="aui-name">
                  {u.username || u.first_name || 'Пользователь'}
                  {u.is_blocked && <span className="blocked-badge">БЛОК</span>}
                </div>
                <div className="aui-meta">ID: {u.telegram_id} · Рефов: {u.referral_count}</div>
                {usersTab === 'donors' && parseFloat(u.total_deposited||0) > 0 && (
                  <div className="aui-meta" style={{color:'#00d4ff',marginTop:2}}>💎 Депозит: {parseFloat(u.total_deposited).toFixed(4)} TON</div>
                )}
                {usersTab === 'traders' && parseInt(u.trading_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#26a69a',marginTop:2}}>📊 Ставок: {u.trading_count} · Объём: {parseFloat(u.trading_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'spinners' && parseInt(u.spin_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#ffb300',marginTop:2}}>🎰 Спинов: {u.spin_count} · Потрачено: {parseFloat(u.spin_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'sloters' && parseInt(u.slots_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#a855f7',marginTop:2}}>🎰 Слотов: {u.slots_count} · Потрачено: {parseFloat(u.slots_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'slotters' && parseInt(u.slots_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#a855f7',marginTop:2}}>🎲 Слотов: {u.slots_count} · Потрачено: {parseFloat(u.slots_volume||0).toFixed(4)} TON</div>
                )}
              </div>
              <div className="aui-balance">{parseFloat(u.balance_ton).toFixed(4)}</div>
              <div className="aui-actions" onClick={e => e.stopPropagation()}>
                {u.is_blocked
                  ? <button className="aui-btn unblock" onClick={() => unblockUser(u)}>✓</button>
                  : <button className="aui-btn block" onClick={() => blockUser(u)}>🚫</button>
                }
                <button className="aui-btn del" onClick={() => setConfirmDelete(u)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER STATS */}
      {tab === 'users' && selectedUser && (
        <div className="admin-section">
          <button className="back-btn" onClick={() => { setSelectedUser(null); setUserStats(null) }}>← Назад</button>
          <div className="user-profile">
            <div className="up-avatar">{(selectedUser.username||selectedUser.first_name||'?')[0].toUpperCase()}</div>
            <div className="up-name">{selectedUser.username || selectedUser.first_name}</div>
            <div className="up-id">ID: {selectedUser.telegram_id}</div>
          </div>
          {userStats ? (
            <>
              <div className="stats-cards">
                <div className="astat-card"><div className="astat-val">{parseFloat(selectedUser.balance_ton).toFixed(4)}</div><div className="astat-lbl">Баланс TON</div></div>
                <div className="astat-card"><div className="astat-val">{userStats.stats.totalDeposit.toFixed(4)}</div><div className="astat-lbl">Депозитов</div></div>
                <div className="astat-card"><div className="astat-val">{userStats.stats.totalWithdraw.toFixed(4)}</div><div className="astat-lbl">Выводов</div></div>
                <div className="astat-card"><div className="astat-val">{userStats.stats.tasksCount}</div><div className="astat-lbl">Заданий</div></div>
                <div className="astat-card"><div className="astat-val">{selectedUser.referral_count}</div><div className="astat-lbl">Рефералов</div></div>
                <div className="astat-card"><div className="astat-val">{userStats.stats.totalStaked.toFixed(4)}</div><div className="astat-lbl">В стейке</div></div>
              </div>
              <div className="ut-section-title">ТРАНЗАКЦИИ</div>
              {userStats.txs.map(tx => (
                <div key={tx.id} className="ut-tx">
                  <div className="ut-tx-label">{tx.label?.split('|net:')[0]}</div>
                  <div className={`ut-tx-amt ${parseFloat(tx.amount)>0?'pos':'neg'}`}>{parseFloat(tx.amount)>0?'+':''}{parseFloat(tx.amount).toFixed(4)}</div>
                </div>
              ))}
            </>
          ) : <div className="spinner" style={{margin:'20px auto'}}/>}
        </div>
      )}
    </div>
    </>
  )
}
