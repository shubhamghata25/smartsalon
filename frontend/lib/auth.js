"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ss_user");
    const token = localStorage.getItem("ss_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Verify token is still valid
      authAPI.me().then(r => setUser(r.data)).catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authAPI.register(payload);
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
