import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = async (correo, contrasenya) => {
    const response = await api.post('/api/auth/login', {
      correo: correo.trim().toLowerCase(),
      contrasenya,
    });

    const data = response.data;
    const userData = {
      id: data.id,
      nombre: data.nombre,
      correo: data.correo,
      rol: data.rol,
    };

    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', data.token);

    setUser(userData);
    setToken(data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    return data;
  };

  const registro = async (datos) => {
    const response = await api.post('/api/auth/registro', {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      contrasenya: datos.contrasenya,
      rol: datos.rol || 'USUARIO',
    });

    const data = response.data;
    const userData = {
      id: data.id,
      nombre: data.nombre,
      correo: data.correo,
      rol: data.rol,
    };

    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', data.token);

    setUser(userData);
    setToken(data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    return data;
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
