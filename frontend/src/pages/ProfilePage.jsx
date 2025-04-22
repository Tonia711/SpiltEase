// File: src/pages/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import styles from "../styles/ProfilePage.module.css";
import MobileFrame from "../components/MobileFrame";

export default function ProfilePage() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 静态资源根路径 & 默认头像
  const AVATAR_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_AVATAR = `${AVATAR_BASE}/avatars/default.png`;

  // 本地状态
  const [isInfoEditing, setIsInfoEditing] = useState(false);
  const [isAvatarEditing, setIsAvatarEditing] = useState(false);
  const [name, setName] = useState(user?.userName || "");
  const [presets, setPresets] = useState([]);
  const [avatar, setAvatar] = useState(user?.avatarUrl || DEFAULT_AVATAR);
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    user?.avatarId || null
  );
  const [errorMessage, setErrorMessage] = useState("");

  // 当 user 更新时，初始化表单和头像列表
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
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleViewAnnualSummary = () => {
    navigate("/annual-summary");
  };

  // 保存用户名
  const handleInfoSave = async () => {
    setErrorMessage("");
    try {
      const { data: updated } = await api.put("/users/me", { userName: name });
      // 拼装完整头像 URL
      updated.avatarUrl = updated.avatarUrl?.startsWith("http")
        ? updated.avatarUrl
        : `${AVATAR_BASE}/${updated.avatarUrl}`;
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

  // 保存系统头像选择
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
      setIsAvatarEditing(false);
    } catch {
      setErrorMessage("Failed to save avatar. Please try again.");
    }
  };

  const handleAvatarCancel = () => {
    setAvatar(user.avatarUrl || DEFAULT_AVATAR);
    setSelectedAvatarId(user.avatarId || null);
    setIsAvatarEditing(false);
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

      // ✅ 仅更新“预览”状态，用户点 Save 后再保存
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
        <div className={styles.titleRow}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            {"<"}
          </button>
          <h2 className={styles.title}>Profile</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatar}
              alt="avatar"
              className={styles.avatar}
              onClick={() => setIsAvatarEditing(true)}
            />

            {isAvatarEditing && (
              <>
                <label htmlFor="avatarUpload" className={styles.cameraIcon}>
                  📷
                </label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  style={{ display: "none" }}
                />
              </>
            )}
          </div>

          {isAvatarEditing && (
            <div className={styles.avatarOptions}>
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
                <button className={styles.saveBtn} onClick={handleAvatarSave}>
                  Save
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={handleAvatarCancel}
                >
                  Cancel
                </button>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}
            </div>
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
                <input
                  className={styles.editInput}
                  value={name}
                  placeholder="Enter username"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <div className={styles.editButtons}>
                <button className={styles.saveBtn} onClick={handleInfoSave}>
                  Save
                </button>
                <button className={styles.cancelBtn} onClick={handleInfoCancel}>
                  Cancel
                </button>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}
            </div>
          )}

          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
          <button
            className={styles.summaryButton}
            onClick={handleViewAnnualSummary}
          >
            View Annual Summary
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}
