import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData || ''
  if (initData) config.headers['x-telegram-init-data'] = initData
  return config
})

// Intercept 503 maintenance responses — notify App instantly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 503) {
      const msg = error.response.data?.error || ''
      if (msg.includes('работ') || msg.includes('maintenance')) {
        window.dispatchEvent(new CustomEvent('maintenanceDetected', { detail: msg }))
      }
    }
    return Promise.reject(error)
  }
)

export const authLogin       = () => api.post('/api/auth/login')
export const getUserStakes   = () => api.get('/api/staking/my')
export const createStake     = (data) => api.post('/api/staking/stake', data)
export const unstake         = (stakeId, label) => api.post(`/api/staking/unstake/${stakeId}`, { label })
export const reinvestStake   = (stakeId) => api.post(`/api/staking/reinvest/${stakeId}`)
export const addToStake      = (stakeId, amount) => api.post('/api/staking/add', { stakeId, amount })
export const collectStake    = (stakeId) => api.post(`/api/staking/collect/${stakeId}`)
export const withdrawStake   = (stakeId, amount) => api.post('/api/staking/withdraw', { stakeId, amount })
export const getTasks        = () => api.get('/api/tasks')
export const completeTask    = (id) => api.post(`/api/tasks/${id}/complete`)
export const createTask      = (data) => api.post('/api/tasks/create', data)
export const getMyTasks      = () => api.get('/api/tasks/my')
export const getReferrals    = () => api.get('/api/referrals')
export const getTransactions = () => api.get('/api/wallet/transactions')
export const getBonusStatus  = () => api.get('/api/bonus/status')
export const claimBonus      = () => api.post('/api/bonus/claim')

export default api
