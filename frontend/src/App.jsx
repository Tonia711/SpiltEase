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
import NewBillPage from "./pages/Bill/NewBillPage.jsx";
import GroupExpensePage from "./pages/GroupExpensePage.jsx";
import BillDetailPage from "./pages/Bill/BillDetailPage.jsx";
import EditBillPage from "./pages/Bill/EditBillPage.jsx";
import GroupSummary from "./components/GroupSummary.jsx";


function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <HomePage /> : <LandingPage />} />
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      <Route
        path="/create-group"
        element={
          <ProtectedRoute>
            <NewGroupPage />
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
        path="/groups/:groupId/expenses"
        element={
          <ProtectedRoute>
            <GroupExpensePage />
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
        path="/groups/:groupId/expenses/:billId"
        element={
          <ProtectedRoute>
            <BillDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId/editBill/:billId"
        element={
          <ProtectedRoute>
            <EditBillPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:groupId/summary"
        element={
          <ProtectedRoute>
            <GroupSummary />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
