import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const CORRECT_PASSWORD = 'Lagom129.';
const STORAGE_KEY = 'q-ai-authenticated';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verifica se l'utente è già autenticato (da localStorage)
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const login = (password) => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
};
