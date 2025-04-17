import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import styles from "../styles/RegisterPage.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();
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
    setErrorMessage(""); // 清除之前的错误

    try {
      // 发送请求到后端
      const res = await api.post("/auth/register", formData);
      const { token, user } = res.data;

      // 存储 token 在 localStorage 并跳转到主页
      localStorage.setItem("token", token);
      navigate("/"); // 登录后跳转到主页
    } catch (err) {
      // 显示错误信息
      setErrorMessage(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Register</h2>
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
