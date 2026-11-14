import { useState, useEffect } from "react";
import AuthContext from "./AuthContext";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading] = useState(false);

  useEffect(() => {
    // Sync state when localStorage changes across browser tabs
    const handleStorageChange = () => {
      setToken(authService.getToken());
      setUser(authService.getUser());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.token && data.user) {
      authService.saveAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    return await authService.register(name, email, password);
  };

  const logout = () => {
    authService.clearAuth();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

