import { useState, useEffect } from 'react'
import { getTasks, completeTask } from '../../api/index'
import { useUserStore } from '../../store/userStore'
import './Tasks.css'

export default function Tasks() {
  const { updateBalance } = useUserStore()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)

  useEffect(() => {
    getTasks()
      .then(r => setTasks(r.data || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 2500)
  }

  const handleClaim = async (task) => {
    if (task.completed || completing === task.id) return
    setCompleting(task.id)

    // Если есть ссылка — открываем её сначала
    if (task.link) {
      const tg = window.Telegram?.WebApp
      if (tg) tg.openTelegramLink(task.link)
      else window.open(task.link, '_blank')
    }

    try {
      const res = await completeTask(task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
      updateBalance(parseFloat(res.data?.reward || task.reward))
      showToast(`+${res.data?.reward || task.reward} TON ЗАЧИСЛЕНО`)
    } catch (e) {
      const msg = e?.response?.data?.message || 'ОШИБКА'
      showToast(msg, true)
    }
    setCompleting(null)
  }

  return (
    <div className="tasks-wrap">
      {toast && <div className={`tasks-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="tasks-hdr">
        <div className="tasks-title">Задания</div>
      </div>

      {loading ? (
        <div className="tasks-empty"><div className="spinner"></div></div>
      ) : tasks.length === 0 ? (
        <div className="tasks-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Заданий пока нет</div>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div key={task.id} className={`task-card ${task.completed ? 'done' : ''}`}>
              {task.channel_photo
                ? <img src={task.channel_photo} className="task-photo" onError={e => e.target.style.display='none'}/>
                : <div className={`task-ico ${task.type === 'bot' ? 't-bot' : 't-sub'}`}>
                    {task.icon || (task.type === 'bot' ? '🤖' : '✈️')}
                  </div>
              }
              <div className="task-body">
                <div className="task-name">{task.channel_title || task.title}</div>
                <div className="task-rew">+{task.reward} TON</div>
                {task.link && <div className="task-link">{task.link.replace('https://', '')}</div>}
                <div className="task-meta">
                  <span className={`task-badge ${task.type === 'bot' ? 'b-bot' : 'b-sub'}`}>
                    {task.type === 'bot' ? 'БОТ' : 'ПОДПИСКА'}
                  </span>
                  <button
                    className={`claim-btn ${task.completed ? 'claimed' : ''}`}
                    onClick={() => handleClaim(task)}
                    disabled={task.completed || completing === task.id}
                  >
                    {task.completed ? '✓ Готово' : completing === task.id ? '...' : task.type === 'bot' ? 'Запустить' : 'Подписаться'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
