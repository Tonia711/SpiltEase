import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // 当前用户对象
  const [token, setToken] = useState(localStorage.getItem("token")); // 模拟 token
  const [loading, setLoading] = useState(true); // 首次加载状态

  // 初始化：如果 token 存在，从 localStorage 中恢复 user
  useEffect(() => {
    if (token) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      setUser(savedUser);
    }
    setLoading(false);
  }, [token]);

  // 登录逻辑（未来可替换为后端 API）
  const login = (email, password) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.email === email && savedUser?.password === password) {
      localStorage.setItem("token", "mock-token");
      setToken("mock-token");
      setUser(savedUser);
      return true;
    } else {
      return false;
    }
  };

  // 登出：清除所有登录状态
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // 注册逻辑（写入 localStorage，并自动登录）
  const register = ({ email, password, username, avatar }) => {
    const newUser = { email, password, username, avatar };
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", "mock-token");
    setUser(newUser);
    setToken("mock-token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!token,
        login,
        logout,
        register,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
