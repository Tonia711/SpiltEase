import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import styles from "../styles/ProfilePage.module.css";
import MobileFrame from "../components/MobileFrame";

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const AVATAR_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "";
  const DEFAULT_AVATAR = `${AVATAR_BASE}/avatars/default.png`;

  const [name, setName] = useState(user?.userName || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    setName(user?.userName || "");
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSave = async () => {
    try {
      const { data: updated } = await api.put("/users/me", { userName: name });
      updated.avatarUrl = updated.avatarUrl?.startsWith("http")
        ? updated.avatarUrl
        : `${AVATAR_BASE}/${updated.avatarUrl}`;
      updateUser(updated);
      setIsEditing(false);
    } catch (err) {
      setErrorMessage("Failed to update user info.");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            {"<"}
          </button>
          <img
            src={user?.avatarUrl || DEFAULT_AVATAR}
            alt="avatar"
            className={styles.avatar}
          />
        </div>
        <div className={styles.name}>{user?.userName}</div>

        <div className={styles.infoBlock}>
          <label>Email</label>
          <div className={styles.readonlyField}>{user?.email}</div>

          <label>Username</label>
          {isEditing ? (
            <input
              className={styles.inputField}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <div className={styles.readonlyField}>{user?.userName}</div>
          )}
        </div>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        {isEditing ? (
          <div className={styles.buttonGroup}>
            <button className={styles.saveButton} onClick={handleSave}>
              Save
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}

        <div className={styles.notice}>
          Your YEAR IN REVIEW is available now!
        </div>

        <div className={styles.logoutWrapper}>
          Mate, are you sure?{" "}
          <span className={styles.logoutLink} onClick={handleLogout}>
            Logout
          </span>
        </div>
      </div>
    </MobileFrame>
  );
}
