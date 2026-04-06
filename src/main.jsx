import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './index.css'
import App from './App.jsx'

const manifestUrl = 'https://tonera-frontend-production.up.railway.app/tonconnect-manifest.json'

// Блокируем открытие в браузере
if (!window.Telegram?.WebApp?.initData) {
  document.getElementById('root').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#050a1a;color:#e8f2ff;font-family:Arial,sans-serif;text-align:center;padding:24px;">
      <div style="font-size:48px;margin-bottom:16px;">✈️</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Только в Telegram</div>
      <div style="font-size:14px;color:#888;margin-bottom:24px;">Это приложение работает только внутри Telegram</div>
      <a href="https://t.me/${import.meta.env.VITE_BOT_USERNAME}" style="background:#1a5fff;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">Открыть в Telegram</a>
    </div>
  `
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <App />
      </TonConnectUIProvider>
    </StrictMode>,
  )
}
