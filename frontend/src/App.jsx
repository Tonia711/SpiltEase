import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NewGroupPage from "./pages/NewGroupPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <HomePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {isLoggedIn && (
        <>
          <Route path="/create-group" element={<NewGroupPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </>
      )}
    </Routes>
  );
}

export default App;
