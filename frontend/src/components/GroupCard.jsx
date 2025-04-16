import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/HomePage.module.css";

export default function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <div
      className={styles.groupCard}
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      <span className={styles.groupIcon}>{group.icon}</span>
      <span className={styles.groupName}>{group.name}</span>
    </div>
  );
}
