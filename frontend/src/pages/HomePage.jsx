import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import GroupCard from "../components/GroupCard";

export default function HomePage() {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const mockGroups = [
    { id: "1", name: "South_island Trip", icon: "🗺️" },
    { id: "2", name: "Library_study Group", icon: "📚" },
  ];

  const username = "Anne";
  const avatarUrl = "/avatars/default.png";

  return (
    <div className={styles.container}>
      <div className={styles.profile} onClick={() => navigate("/profile")}>
        <img src={avatarUrl} alt="avatar" className={styles.avatar} />
        <span className={styles.name}>{username}</span>
      </div>

      <div className={styles.groupList}>
        {mockGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
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
