// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  // 如果没登录，就跳去 LandingPage（假设路由是 /landing）
  if (!user) return <Navigate to="/landing" replace />;
  return children;
}
