import { create } from 'zustand'

export const useUserStore = create((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  updateBalance: (amount) => set((s) => ({
    user: { ...s.user, balance_ton: (parseFloat(s.user?.balance_ton || 0) + amount).toFixed(8) }
  })),
}))
