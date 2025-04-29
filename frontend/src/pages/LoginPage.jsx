import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/LoginPage.module.css";
import MobileFrame from "../components/MobileFrame";
import '../App.css'; // ✅ 引入 App.css

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password); // ✅ 使用 AuthContext 方法

    if (result.ok) {
      navigate("/"); // ✅ 登录成功跳转首页
    } else {
      setError(result.error || "Login failed.");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleLogin}>
          <img src="/images/logo-splitmate.png" alt="SplitMate" className="logoImage" />

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email address</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              placeholder="Enter email address"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className={styles.forgot}>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <button type="submit" className={styles.button}>
            Sign in
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </form>

        <div className={styles.footer}>
          Need an account?{" "}
          <Link to="/register" className={styles.signupLink}>
            Sign up
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}
