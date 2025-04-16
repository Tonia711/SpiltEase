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

  const handleLogin = (e) => {
    e.preventDefault();

    const success = login(email, password);
    if (success) {
      navigate("/home");
    } else {
      setError("Invalid credentials.");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleLogin}>
        <h2 className={styles.logo}>
          SPLiT<span>Mate</span>
        </h2>

        <div className={styles.inputGroup}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            placeholder="Enter email address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.forgot}>
          <a href="#">Forgot Password?</a>
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
