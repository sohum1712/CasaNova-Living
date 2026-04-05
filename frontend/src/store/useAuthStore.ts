import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: number;
  username: string;
  role: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  store_id?: number;
  region?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      hasAnyRole: (roles: string[]) => {
        const r = get().user?.role;
        return !!r && roles.includes(r);
      },
    }),
    {
      name: 'casanova-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
