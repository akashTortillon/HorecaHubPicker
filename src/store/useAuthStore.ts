import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  employee_id: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  bootstrap: () => Promise<void>;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  user: null,
  isLoading: true,

  bootstrap: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      set({
        token,
        user: userData ? JSON.parse(userData) : null,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  login: async (userData, token) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    set({ token, user: userData });
  },

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    set({ token: null, user: null });
  },
}));
