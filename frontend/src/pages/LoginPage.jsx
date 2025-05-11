import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/LoginPage.module.css";
import MobileFrame from "../components/MobileFrame";
import "../App.css";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = await login(email, password);

    if (result.ok) {
      navigate("/");
    } else {
      if (result.field) {
        setErrors({ [result.field]: result.error });
      } else {
        setErrors({ general: result.error || "Login failed." });
      }
    }
  };

  return (
    <MobileFrame>
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <form className={styles.form} onSubmit={handleLogin} data-testid="login-form">
            <div className={styles.logoWrapper}>
              <img
                src="/images/logo-splitmate.png"
                alt="SplitMate"
                className="logoImage"
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Email address</label>
                {errors.email && (
                  <span className={styles.errorInline} data-testid="email-error">
                    {errors.email}
                  </span>
                )}
              </div>
              <input
                className={`${styles.input} ${
                  errors.email ? styles.inputError : ""
                }`}
                type="email"
                value={email}
                placeholder="Enter email address"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                {errors.password && (
                  <span className={styles.errorInline} data-testid="password-error">
                    {errors.password}
                  </span>
                )}
              </div>
              <input
                className={`${styles.input} ${
                  errors.password ? styles.inputError : ""
                }`}
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className={styles.forgot}>
                <Link to="/login" className={styles.forgotLink}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" className={`btn ${styles.button}`}>
              Sign in
            </button>

            {errors.general && (
              <div className={styles.error} data-testid="general-error">
                {errors.general}
              </div>
            )}
          </form>
        </div>

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
