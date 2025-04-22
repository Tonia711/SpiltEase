import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NewGroupPage from "./pages/NewGroupPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import JoinGroupPage from "./pages/JoinGroupPage";
import NewBillPage from "./pages/NewBillPage.jsx";
import AnnualSummary from "./components/AnnualSummary";

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Routes>
      {/* 公共页面 */}
      <Route path="/" element={isLoggedIn ? <HomePage /> : <LandingPage />} />
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* 下面的路由都用 ProtectedRoute 包裹 */}
      <Route
        path="/create-group"
        element={
          <ProtectedRoute>
            <NewGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <GroupDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/join"
        element={
          <ProtectedRoute>
            <JoinGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId/creatBill"
        element={
          <ProtectedRoute>
            <NewBillPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annual-summary"
        element={
          <ProtectedRoute>
            <AnnualSummary />
          </ProtectedRoute>
        }
      />

      {/* 其他未匹配时跳回首页或 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
