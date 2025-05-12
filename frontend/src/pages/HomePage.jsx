import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import GroupList from "../components/GroupList";
import MobileFrame from "../components/MobileFrame";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showOptions, setShowOptions] = useState(false);

  const avatarUrl = user?.avatarUrl || "/avatars/avatar1.png";
  const username = user?.userName || "User";

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.profile}>
          <img
            src={avatarUrl}
            alt="avatar"
            className={styles.avatar}
            onClick={handleProfileClick}
          />
          <span className={styles.name}>{username}</span>
        </div>

        <div className={styles.groupListContainer}>
          <GroupList />
        </div>

        <div className={styles.fabContainer}>
          <button
            className={styles.fab}
            onClick={() => setShowOptions(!showOptions)}
          >
            +
          </button>
        </div>

        {showOptions && (
          <div className={styles.options}>
            <button onClick={() => navigate("/create-group")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="3.5"
                stroke="currentColor"
                style={{
                  width: "1em",
                  height: "1em",
                  verticalAlign: "middle",
                  marginRight: "0.25em",
                }}
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Group
            </button>
            <button onClick={() => navigate("/groups/join")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3.5}
                stroke="currentColor"
                style={{
                  width: "1em",
                  height: "1em",
                  verticalAlign: "middle",
                  marginRight: "0.25em",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              Join Group
            </button>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
