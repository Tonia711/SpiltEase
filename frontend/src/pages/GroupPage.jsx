import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/GroupPage.module.css";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // 🧪 使用 mock 数据模拟 API 返回值
    const mockGroups = [
      {
        _id: "1",
        name: "Travel Buddies",
        description: "Tokyo Trip Budget Split",
      },
      {
        _id: "2",
        name: "Flatmates",
        description: "Shared groceries and utility bills",
      },
      {
        _id: "3",
        name: "Family",
        description: "Monthly household expenses",
      },
    ];

    // 模拟延迟加载
    setTimeout(() => {
      setGroups(mockGroups);
    }, 500);
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Groups</h2>
      <div className={styles.groupList}>
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group._id} className={styles.groupCard}>
              <div className={styles.groupName}>{group.name}</div>
              <div className={styles.groupDescription}>{group.description}</div>
              <Link to={`/groups/${group._id}`} className={styles.link}>
                View Group
              </Link>
            </div>
          ))
        ) : (
          <p>Loading your groups...</p>
        )}
      </div>
    </div>
  );
}
