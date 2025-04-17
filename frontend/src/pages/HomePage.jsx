import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import GroupCard from "../components/GroupCard";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(res.data);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };

    fetchGroups();
  }, []);

  const avatarUrl = user?.avatarUrl || "/avatars/default.png"; // 获取头像
  const username = user?.userName || "User"; // 获取用户名

  const handleProfileClick = () => {
    navigate("/profile"); // 头像点击后跳转到 Profile 页面
  };

  return (
    <div className={styles.container}>
      <div className={styles.profile} onClick={handleProfileClick}>
        <img src={avatarUrl} alt="avatar" className={styles.avatar} />
        <span className={styles.name}>{username}</span>
      </div>

      <div className={styles.groupList}>
        {groups.map((group) => (
          <GroupCard key={group._id} group={group} />
        ))}
      </div>

      <button
        className={styles.fab}
        onClick={() => setShowOptions(!showOptions)}
      >
        +
      </button>

      {showOptions && (
        <div className={styles.options}>
          <button onClick={() => navigate("/create-group")}>
            ➕ Create Group
          </button>
          <button onClick={() => alert("Join feature coming soon!")}>
            🔍 Join Group
          </button>
        </div>
      )}
    </div>
  );
}
