import React, { useState, useContext } from "react";
import api from "../utils/api";
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

  const [errors, setErrors] = useState({});
  const [emailDebounceTimer, setEmailDebounceTimer] = useState(null);
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });

    if (name === "email") {
      if (emailDebounceTimer) clearTimeout(emailDebounceTimer);

      const timer = setTimeout(() => {
        if (!value.includes("@")) {
          setErrors((prev) => ({
            ...prev,
            email: "Invalid email format",
          }));
        } else {
          checkAvailability("email", value);
        }
      }, 800);
      setEmailDebounceTimer(timer);
    }

    if (name === "userName") {
      if (usernameDebounceTimer) clearTimeout(usernameDebounceTimer);

      const timer = setTimeout(() => {
        checkAvailability("userName", value);
      }, 500);
      setUsernameDebounceTimer(timer);
    }

    if (name === "password") {
      if (value.length < 6) {
        setErrors((prev) => ({
          ...prev,
          password: "At least 6 characters",
        }));
      } else {
        setErrors((prev) => {
          const { password, ...rest } = prev;
          return rest;
        });
      }

      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => {
          const { confirmPassword, ...rest } = prev;
          return rest;
        });
      }
    }

    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => {
          const { confirmPassword, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const checkAvailability = async (field, value) => {
    if (!value) return;
    try {
      const res = await api.get(`/users/check?field=${field}&value=${value}`);

      if (res.data.exists) {
        setErrors((prev) => ({
          ...prev,
          [field]: `${field === "email" ? "Email" : "Username"} already taken`,
        }));
      } else {
        setErrors((prev) => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      console.error("Check error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formData.userName.trim() === "") {
      newErrors.userName = "Username is required";
    }

    if (!formData.email.includes("@")) {
      newErrors.email = "Invalid email";
    }

    if (formData.password.length < 6) {
      newErrors.password = "At least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const result = await register(formData);
    if (result.ok) {
      navigate("/");
    } else {
      if (result.field) {
        setErrors({ [result.field]: result.error });
      } else {
        setErrors({ general: result.error || "Registration failed" });
      }
    }
  };

  return (
    <MobileFrame>
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.titleRow}>
              <span
                className={styles.backButton}
                onClick={() => navigate(-1)}
              >
                {"<"}
              </span>
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
              {errors.userName && (
                <div className={styles.inputError}>{errors.userName}</div>
              )}
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
              {errors.email && (
                <div className={styles.inputError}>{errors.email}</div>
              )}
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
              {errors.password && (
                <div className={styles.inputError}>{errors.password}</div>
              )}
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
              {errors.confirmPassword && (
                <div className={styles.inputError}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <button className={`btn ${styles.button}`} type="submit">
                Sign Up
              </button>
            </div>
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
