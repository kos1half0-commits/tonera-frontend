import { useState, useEffect } from 'react'
import { getTasks, completeTask } from '../../api/index'
import './Tasks.css'

const DEFAULT_TASKS = [
  { id: 1, type: 'tg', title: 'Наш канал', reward: 0.5, icon: '✈️', link: 't.me/tonera_official', completed: false },
  { id: 2, type: 'tg', title: 'Открыть бота', reward: 0.3, icon: '🤖', link: 't.me/ToneraBot', completed: false },
  { id: 3, type: 'yt', title: 'YouTube канал', reward: 0.5, icon: '▶️', link: 'youtube.com/@tonera', completed: false },
]

const TYPE_LABELS = { tg: 'TELEGRAM', yt: 'YOUTUBE', tw: 'TWITTER', custom: 'ДРУГОЕ' }
const TYPE_COLORS = { tg: 'type-tg', yt: 'type-yt', tw: 'type-tw', custom: 'type-custom' }

export default function Tasks() {
  const [tasks, setTasks] = useState(DEFAULT_TASKS)
  const [completing, setCompleting] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', link: '', type: 'tg', reward: '0.5' })

  useEffect(() => {
    getTasks().then(r => setTasks(r.data)).catch(() => {})
  }, [])

  const handleClaim = async (task) => {
    if (task.completed || completing === task.id) return
    setCompleting(task.id)
    try {
      await completeTask(task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
    }
    setCompleting(null)
  }

  const handleAdd = () => {
    if (!form.title) return
    const newTask = {
      id: Date.now(), type: form.type,
      title: form.title, link: form.link,
      reward: parseFloat(form.reward) || 0.5,
      icon: form.type === 'tg' ? '✈️' : form.type === 'yt' ? '▶️' : form.type === 'tw' ? '🐦' : '⭐',
      completed: false,
    }
    setTasks(prev => [...prev, newTask])
    setForm({ title: '', link: '', type: 'tg', reward: '0.5' })
    setShowAdd(false)
  }

  return (
    <div className="tasks fade-up">
      <div className="tasks-header">
        <div className="section-title">Задания</div>
        <button className="add-task-btn" onClick={() => setShowAdd(true)}>+ Добавить</button>
      </div>

      <div className="tasks-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-card ${task.completed ? 'done' : ''}`}>
            <div className={`task-icon-wrap t-${task.type}`}>{task.icon}</div>
            <div className="task-body">
              <div className="task-name">{task.title}</div>
              <div className="task-reward">+{task.reward} TON</div>
              {task.link && <div className="task-link">{task.link}</div>}
              <div className="task-meta">
                <span className={`task-type ${TYPE_COLORS[task.type] || 'type-custom'}`}>
                  {TYPE_LABELS[task.type] || 'ДРУГОЕ'}
                </span>
                <button
                  className={`claim-btn ${task.completed ? 'claimed' : ''}`}
                  onClick={() => handleClaim(task)}
                  disabled={task.completed || completing === task.id}
                >
                  {task.completed ? '✓ Готово' : completing === task.id ? '...' : 'Выполнить'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="add-modal">
            <div className="modal-title">НОВОЕ ЗАДАНИЕ</div>
            <div className="afield">
              <label>НАЗВАНИЕ</label>
              <input className="ainput" placeholder="Название задания" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}/>
            </div>
            <div className="afield">
              <label>ССЫЛКА</label>
              <input className="ainput" placeholder="https://t.me/..." value={form.link} onChange={e => setForm(p => ({...p, link: e.target.value}))}/>
            </div>
            <div className="arow">
              <div className="afield">
                <label>ТИП</label>
                <select className="aselect" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                  <option value="tg">Telegram</option>
                  <option value="yt">YouTube</option>
                  <option value="tw">Twitter</option>
                  <option value="custom">Другое</option>
                </select>
              </div>
              <div className="afield">
                <label>НАГРАДА (TON)</label>
                <input className="ainput" type="number" step="0.1" placeholder="0.5" value={form.reward} onChange={e => setForm(p => ({...p, reward: e.target.value}))}/>
              </div>
            </div>
            <div className="mbtns">
              <button className="mbtn mb-c" onClick={() => setShowAdd(false)}>Отмена</button>
              <button className="mbtn mb-ok" onClick={handleAdd}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
