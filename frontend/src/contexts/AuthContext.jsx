// File: src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        try {
          const { data } = await api.get("/users/me");
          const AVATAR_BASE = import.meta.env.VITE_API_BASE_URL
            ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
            : "";
          data.avatarUrl = data.avatarUrl.startsWith("http")
            ? data.avatarUrl
            : `${AVATAR_BASE}/${data.avatarUrl}`;
          setUser(data);
        } catch (err) {
          console.error("Failed to fetch current user", err);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const { token: jwt, user: me } = data;
      localStorage.setItem("token", jwt);
      api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
      setToken(jwt);
      setUser(me);
      return { ok: true };
    } catch (err) {
      console.error("Login error", err);
      return { ok: false, error: err.response?.data?.error || err.message };
    }
  };

  const register = async ({ userName, email, password }) => {
    try {
      const { data } = await api.post("/auth/register", {
        userName,
        email,
        password,
      });
      const { token: jwt, user: me } = data;
      localStorage.setItem("token", jwt);
      api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
      setToken(jwt);
      setUser(me);
      return { ok: true };
    } catch (err) {
      console.error("Register error", err);
      return { ok: false, error: err.response?.data?.error || err.message };
    }
  };

  const updateUser = (me) => {
    setUser(me);
  };

  const logout = () => {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: Boolean(user),
        loading,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
}
