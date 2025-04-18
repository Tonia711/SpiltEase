import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext"; // ✅ 引入 AuthContext
import styles from "../styles/RegisterPage.module.css";
import MobileFrame from "../components/MobileFrame"; // ✅ 引入 MobileFrame 组件

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext); // ✅ 解构 register 方法

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const result = await register(formData); // ✅ 使用 AuthContext 的注册方法
    if (result.ok) {
      navigate("/"); // ✅ 注册成功后跳转首页（此时已登录）
    } else {
      setErrorMessage(result.error || "Registration failed");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.logo}>
            SPLiT<span className={styles.logoHighlight}>Mate</span>
          </h2>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email address</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button className={styles.button} type="submit">
            Register
          </button>

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        </form>

        <div className={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" className={styles.loginLink}>
            Sign in
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}
