// File: src/pages/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import styles from "../styles/ProfilePage.module.css";

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isInfoEditing, setIsInfoEditing] = useState(false);
  const [isAvatarEditing, setIsAvatarEditing] = useState(false);
  const [name, setName] = useState(user?.userName || "");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const AVATAR_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";

  // Presets with full avatarUrl objects
  const [presets, setPresets] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Fetch system avatars
    api
      .get("/avatars")
      .then((res) => {
        setPresets(res.data);
        // Determine initial avatar by matching avatarId
        const sys = res.data.find(
          (a) => String(a._id) === String(user.avatarId)
        );
        const initialUrl = sys ? sys.avatarUrl : "avatars/default.png";
        setAvatar(
          initialUrl.startsWith("http")
            ? initialUrl
            : `${AVATAR_BASE}/${initialUrl}`
        );
      })
      .catch((err) => console.error("Failed to fetch avatars:", err));
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInfoSave = async () => {
    setErrorMessage("");
    try {
      const { data: updated } = await api.put("/users/me", { userName: name });
      updateUser(updated);
      setIsInfoEditing(false);
    } catch {
      setErrorMessage("Failed to update information. Please try again.");
    }
  };
  const handleInfoCancel = () => {
    setName(user.userName);
    setIsInfoEditing(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    api
      .post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const updated = res.data.user;
        const url = updated.avatarUrl.startsWith("http")
          ? updated.avatarUrl
          : `${AVATAR_BASE}/${updated.avatarUrl}`;
        setAvatar(url);
        updateUser(updated);
      })
      .catch(() => setErrorMessage("Upload failed. Please try again."));
  };

  const handleAvatarSave = async () => {
    setErrorMessage("");
    try {
      // strip base
      const relative = avatar.replace(`${AVATAR_BASE}/`, "");
      const { data: updated } = await api.put("/users/me", {
        avatarUrl: relative,
      });
      updateUser(updated);
      setIsAvatarEditing(false);
    } catch {
      setErrorMessage("Failed to save avatar. Please try again.");
    }
  };

  const handleAvatarCancel = () => {
    // reset to initial
    const sys = presets.find((a) => String(a._id) === String(user.avatarId));
    const initialUrl = sys ? sys.avatarUrl : "avatars/default.png";
    setAvatar(
      initialUrl.startsWith("http")
        ? initialUrl
        : `${AVATAR_BASE}/${initialUrl}`
    );
    setIsAvatarEditing(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          {"<"}
        </button>
        <h2 className={styles.title}>Profile</h2>
      </div>

      <img
        src={avatar}
        alt="avatar"
        className={styles.avatar}
        onClick={() => setIsAvatarEditing(true)}
      />

      {isAvatarEditing && (
        <div className={styles.avatarOptions}>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          {presets.map((item) => {
            const url = item.avatarUrl.startsWith("http")
              ? item.avatarUrl
              : `${AVATAR_BASE}/${item.avatarUrl}`;
            return (
              <img
                key={item._id}
                src={url}
                alt="preset"
                className={`${styles.option} ${
                  avatar === url ? styles.selected : ""
                }`}
                onClick={() => setAvatar(url)}
              />
            );
          })}
          <div className={styles.editButtons}>
            <button className={styles.saveBtn} onClick={handleAvatarSave}>
              Save Avatar
            </button>
            <button className={styles.cancelBtn} onClick={handleAvatarCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {!isInfoEditing && !isAvatarEditing && (
        <>
          <p>
            <strong>Username:</strong> {user.userName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <button
            className={styles.editBtn}
            onClick={() => setIsInfoEditing(true)}
          >
            Edit Info
          </button>
        </>
      )}

      {isInfoEditing && (
        <div className={styles.infoForm}>
          <label>
            Username:
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className={styles.editButtons}>
            <button className={styles.saveBtn} onClick={handleInfoSave}>
              Save Info
            </button>
            <button className={styles.cancelBtn} onClick={handleInfoCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <button className={styles.logoutBtn} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
