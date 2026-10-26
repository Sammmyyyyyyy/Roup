import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const NavigationContext = createContext(null);
export const ThemeContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const useNavigate = () => useContext(NavigationContext);
export const useTheme = () => useContext(ThemeContext);
