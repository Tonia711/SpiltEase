import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/LandingPage.module.css";
import MobileFrame from "../components/MobileFrame"; // ✅ 引入 MobileFrame 组件

export default function LandingPage() {
  const navigate = useNavigate();

  const goToLogin = () => navigate("/login");
  const goToSignup = () => navigate("/register");

  return (
    <MobileFrame>
      <div className={styles.landingContainer}>
        <div className={styles.landingHeader}>
          <h2 className={styles.landingSubtitle}>
            Mates don't let mates do the math
          </h2>
          <h1 className={styles.landingTitle}>
            <img
              src="/images/logo-splitmate.png"
              alt="SplitMate"
              className={styles.logoImage}
            />
            <span className={`${styles.titleYellow} ${styles.smallRight}`}>
              does
            </span>
          </h1>
        </div>

        <div className={styles.landingButtons}>
          <button
            className={`btn ${styles.btn} ${styles.loginBtn}`}
            onClick={goToLogin}
          >
            Login
          </button>
          <button
            className={`btn ${styles.btn} ${styles.signupBtn}`}
            onClick={goToSignup}
          >
            Sign Up
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}
