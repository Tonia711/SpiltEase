import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/RegisterPage.module.css";
import MobileFrame from "../components/MobileFrame";
import "../App.css";
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    const result = await register(formData);
    if (result.ok) {
      navigate("/");
    } else {
      setErrorMessage(result.error || "Registration failed");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.titleRow}>
              <button
                className={styles.backButton}
                onClick={() => navigate(-1)}
              >
                {"<"}
              </button>
              <h2 className={styles.pageTitle}>Create Account</h2>
            </div>

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
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <button className={`btn ${styles.button}`} type="submit">
                Sign Up
              </button>
            </div>

            {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          </form>
        </div>

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
