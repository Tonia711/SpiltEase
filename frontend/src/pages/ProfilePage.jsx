import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/ProfilePage.module.css";

export default function ProfilePage() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(savedUser.username || "");
  const [avatar, setAvatar] = useState(savedUser.avatar || "default.png");

  console.log("avatar =", avatar);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSave = () => {
    const updated = { ...savedUser, username: name, avatar };
    localStorage.setItem("user", JSON.stringify(updated));
    setIsEditing(false);
    alert("Profile updated!");
  };

  const handleCancel = () => {
    setName(savedUser.username);
    setAvatar(savedUser.avatar);
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

      <img src={`/avatars/${avatar}`} alt="avatar" className={styles.avatar} />

      {!isEditing ? (
        <>
          <p>
            <strong>Username:</strong> {savedUser.username}
          </p>
          <p>
            <strong>Email:</strong> {savedUser.email}
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
