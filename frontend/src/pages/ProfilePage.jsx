// File: src/pages/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import styles from "../styles/ProfilePage.module.css";
import MobileFrame from "../components/MobileFrame";
import Modal from "../components/Modal";

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const AVATAR_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_AVATAR = `${AVATAR_BASE}/avatars/default.png`;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.userName || "");
  const [presets, setPresets] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatarUrl || DEFAULT_AVATAR);
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    user?.avatarId || null
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setName(user.userName);
    setAvatar(user.avatarUrl || DEFAULT_AVATAR);
    setSelectedAvatarId(user.avatarId || null);

    api
      .get("/avatars")
      .then(({ data }) => setPresets(data))
      .catch((err) => console.error("Failed to fetch avatars:", err));
  }, [user, navigate, DEFAULT_AVATAR]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInfoSave = async () => {
    setErrorMessage("");
    try {
      const { data: updated } = await api.put("/users/me", { userName: name });

      updated.avatarUrl = updated.avatarUrl?.startsWith("http")
        ? updated.avatarUrl
        : `${AVATAR_BASE}/${updated.avatarUrl}`;
      updateUser(updated);
      setIsEditing(false);
    } catch {
      setErrorMessage("Failed to update information. Please try again.");
    }
  };

  const handleInfoCancel = () => {
    setName(user.userName);
    setIsEditing(false);
  };

  const handleAvatarSave = async () => {
    setErrorMessage("");
    if (!selectedAvatarId) {
      setErrorMessage("Please select an avatar first.");
      return;
    }
    try {
      const { data: updated } = await api.put("/users/me", {
        avatarId: selectedAvatarId,
      });
      updated.avatarUrl = updated.avatarUrl?.startsWith("http")
        ? updated.avatarUrl
        : `${AVATAR_BASE}/${updated.avatarUrl}`;
      updateUser(updated);
      setAvatar(updated.avatarUrl || DEFAULT_AVATAR);
      setShowModal(false);
    } catch {
      setErrorMessage("Failed to save avatar. Please try again.");
    }
  };

  const handleAvatarCancel = () => {
    setAvatar(user.avatarUrl || DEFAULT_AVATAR);
    setSelectedAvatarId(user.avatarId || null);
    setShowModal(false);
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", user._id);

      const { data } = await api.post("/avatars/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = data.avatarUrl.startsWith("http")
        ? data.avatarUrl
        : `${AVATAR_BASE}/${data.avatarUrl}`;

      setAvatar(uploadedUrl);
      setSelectedAvatarId(data.avatarId);
    } catch (err) {
      console.error(err);
      setErrorMessage("Upload failed. Please try again.");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            {"<"}
          </button>

          <div className={styles.avatarWrapper}>
            <img
              src={avatar}
              alt="avatar"
              className={styles.avatar}
              onClick={
                showModal
                  ? () => document.getElementById("avatarUpload")?.click()
                  : isEditing
                  ? () => setShowModal(true)
                  : undefined
              }
              style={{ cursor: isEditing ? "pointer" : "default" }}
            />

            {/* tiny bottom-right icon (edit mode, grid closed) */}
            {isEditing && !showModal && (
              <button
                type="button"
                className={styles.cameraIcon}
                onClick={() => setShowModal(true)}
              >
                📷
              </button>
            )}

            {showModal && (
              <div className={styles.centerOverlayIcon}>
                <span className={styles.centerIcon}>📷</span>
              </div>
            )}

            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className={styles.infoBlock}>
          <div className={styles.formGroup}>
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

          <div className={styles.formGroup}>
            <label>Email</label>
            <div className={styles.readonlyField}>{user?.email}</div>
          </div>
        </div>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        {isEditing ? (
          <div className={styles.buttonGroup}>
            <button className={styles.saveButton} onClick={handleInfoSave}>
              Save
            </button>
            <button className={styles.cancelButton} onClick={handleInfoCancel}>
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

        <div className={styles.notice} style={{ visibility: "hidden" }}>
          Your YEAR IN REVIEW is available now!
        </div>

        <div className={styles.logoutWrapper}>
          Mate, are you sure?{" "}
          <span className={styles.logoutLink} onClick={handleLogout}>
            Logout
          </span>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className={styles.modalAvatarWrapper}>
          <img
            src={avatar}
            alt="avatar"
            className={styles.avatar}
            onClick={() => document.getElementById("avatarUpload")?.click()}
          />
          <div className={styles.centerOverlayIcon}>
            <span className={styles.centerIcon}>📷</span>
          </div>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            style={{ display: "none" }}
          />
        </div>

        <div className={styles.presetsGrid}>
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
                  selectedAvatarId === item._id ? styles.selected : ""
                }`}
                onClick={() => {
                  setAvatar(url);
                  setSelectedAvatarId(item._id);
                }}
              />
            );
          })}
        </div>

        <div className={styles.editButtons}>
          <button
            className={styles.saveBtn}
            onClick={() => {
              handleAvatarSave();
              setShowModal(false);
            }}
          >
            Save
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              handleAvatarCancel();
              setShowModal(false);
            }}
          >
            Cancel
          </button>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
      </Modal>
    </MobileFrame>
  );
}
