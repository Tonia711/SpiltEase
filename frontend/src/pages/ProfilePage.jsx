// File: src/pages/ProfilePage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import styles from "../styles/ProfilePage.module.css";

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.userName || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "default.png");
  const [errorMessage, setErrorMessage] = useState("");

  // 未登录则跳转
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSave = async () => {
    setErrorMessage("");
    try {
      const payload = { userName: name, avatarUrl: avatar };
      const { data: updated } = await api.put("/users/me", payload);
      updateUser(updated);
      setIsEditing(false);
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setName(user.userName);
    setAvatar(user.avatarUrl);
    setIsEditing(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/")}
        >
          &lt;
        </button>
        <h2 className={styles.title}>Profile</h2>
      </div>

      <img
        src={avatar.startsWith("http") ? avatar : `/avatars/${avatar}`}
        alt="avatar"
        className={styles.avatar}
      />

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {!isEditing ? (
        <>
          <p>
            <strong>Username:</strong> {user.userName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            Edit
          </button>
        </>
      ) : (
        <>
          <label>
            Username:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className={styles.avatarOptions}>
            {["default1.png", "default2.png", "default3.png"].map((file) => (
              <img
                key={file}
                src={`/avatars/${file}`}
                alt="option"
                className={`${styles.option} ${
                  avatar === file ? styles.selected : ""
                }`}
                onClick={() => setAvatar(file)}
              />
            ))}
          </div>

          <div className={styles.editButtons}>
            <button className={styles.saveBtn} onClick={handleSave}>
              Save
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </>
      )}

      <div className={styles.logoutContainer}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
