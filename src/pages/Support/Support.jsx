import { useState, useEffect, useRef } from 'react'
import api from '../../api/index'
import './Support.css'

export default function Support({ user, onClose }) {
  const [tickets, setTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [view, setView] = useState('list') // list | chat | new
  const bottomRef = useRef(null)

  useEffect(() => { loadTickets() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeTicket?.replies])

  const loadTickets = async () => {
    try {
      const r = await api.get('/api/support/my')
      setTickets(r.data || [])
    } catch {}
  }

  const send = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const r = await api.post('/api/support/send', {
        message: message.trim(),
        ticket_id: activeTicket?.id || null
      })
      setMessage('')
      if (!activeTicket) {
        await loadTickets()
        const fresh = await api.get('/api/support/my')
        const newTicket = fresh.data?.find(t => t.id === r.data.ticket_id)
        if (newTicket) { setActiveTicket(newTicket); setView('chat') }
      } else {
        const fresh = await api.get('/api/support/my')
        const updated = fresh.data?.find(t => t.id === activeTicket.id)
        if (updated) setActiveTicket(updated)
        setTickets(fresh.data || [])
      }
    } catch {}
    setSending(false)
  }

  const statusColor = (s) => s === 'answered' ? '#26a69a' : s === 'closed' ? '#888' : '#ffb300'
  const statusLabel = (s) => s === 'answered' ? 'Отвечено' : s === 'closed' ? 'Закрыто' : 'Открыт'

  return (
    <div className="support-wrap">
      <div className="sup-header">
        <button className="sup-back" onClick={view === 'list' ? onClose : () => { setView('list'); setActiveTicket(null) }}>←</button>
        <div className="sup-title">
          {view === 'list' ? '💬 Поддержка' : view === 'new' ? 'Новое обращение' : `Тикет #${activeTicket?.id}`}
        </div>
        {view === 'list' && <button className="sup-new-btn" onClick={() => setView('new')}>+ Новый</button>}
      </div>

      {view === 'list' && (
        <div className="sup-list">
          {tickets.length === 0 && (
            <div className="sup-empty">
              <div className="sup-empty-icon">💬</div>
              <div className="sup-empty-text">Нет обращений</div>
              <div className="sup-empty-sub">Нажмите «+ Новый» чтобы написать в поддержку</div>
            </div>
          )}
          {tickets.map(t => (
            <div key={t.id} className="sup-ticket" onClick={() => { setActiveTicket(t); setView('chat') }}>
              <div className="sup-t-header">
                <span className="sup-t-id">Тикет #{t.id}</span>
                <span className="sup-t-status" style={{color: statusColor(t.status)}}>{statusLabel(t.status)}</span>
              </div>
              <div className="sup-t-msg">{t.message}</div>
              <div className="sup-t-date">{new Date(t.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'chat' && activeTicket && (
        <div className="sup-chat">
          <div className="sup-messages">
            <div className="sup-msg user">
              <div className="sup-msg-text">{activeTicket.message}</div>
              <div className="sup-msg-time">{new Date(activeTicket.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            {(activeTicket.replies || []).map((r, i) => (
              <div key={i} className={`sup-msg ${r.from_admin ? 'admin' : 'user'}`}>
                {r.from_admin && <div className="sup-admin-label">Поддержка</div>}
                <div className="sup-msg-text">{r.message}</div>
                <div className="sup-msg-time">{new Date(r.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
          {activeTicket.status !== 'closed' && (
            <div className="sup-input-row">
              <input className="sup-input" placeholder="Написать..." value={message} onChange={e=>setMessage(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&send()}/>
              <button className="sup-send" onClick={send} disabled={sending || !message.trim()}>↑</button>
            </div>
          )}
          {activeTicket.status === 'closed' && <div className="sup-closed">Тикет закрыт</div>}
        </div>
      )}

      {view === 'new' && (
        <div className="sup-new">
          <div className="sup-new-hint">Опишите вашу проблему подробно. Мы ответим в ближайшее время.</div>
          <textarea className="sup-textarea" placeholder="Ваше сообщение..." value={message}
            onChange={e=>setMessage(e.target.value)} rows={6}/>
          <button className="sup-submit-btn" onClick={send} disabled={sending || !message.trim()}>
            {sending ? '...' : 'Отправить'}
          </button>
        </div>
      )}
    </div>
  )
}
