import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/LoginPage.module.css";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // 清除之前的错误信息

    // 调用 AuthContext 中的 login 方法
    try {
      const result = await login(email, password);

      // 登录成功，跳转到主页
      if (result.ok) {
        navigate("/"); // 登录成功，跳回首页
      } else {
        setError(result.error || "Invalid credentials."); // 显示错误信息
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleLogin}>
        <h2 className={styles.logo}>
          SPLiT<span className={styles.logoHighlight}>Mate</span>
        </h2>

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
        </div>

        <div className={styles.forgot}>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
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
  );
}
