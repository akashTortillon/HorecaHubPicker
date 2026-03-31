import React, { createContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  primary: string;
  border: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = useMemo(
    () => ({
      isDark,
      colors: {
        background: isDark ? '#121212' : '#F8F9FA',
        card: isDark ? '#1E1E1E' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#1A1A1A',
        primary: '#0056b3',
        border: isDark ? '#333' : '#EEE',
      },
    }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};


export const primaryRed = '#FC0808'