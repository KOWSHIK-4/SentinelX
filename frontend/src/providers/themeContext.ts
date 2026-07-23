import { createContext } from 'react';

type Theme = 'dark' | 'light';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);
