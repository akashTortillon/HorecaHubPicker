import React, { createContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

// 1. Define the shape of your context
interface AppContextType {
  isOnline: boolean | null;
  user: { name: string; isLoggedIn: boolean } | null;
  logout: () => void;
}

// 2. Initialize with undefined
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(true);
  const [user, setUser] = useState<{
    name: string;
    isLoggedIn: boolean;
  } | null>({
    name: 'Akash',
    isLoggedIn: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => setUser(null);

  return (
    <AppContext.Provider value={{ isOnline, user, logout }}>
      {children}
    </AppContext.Provider>
  );
};
