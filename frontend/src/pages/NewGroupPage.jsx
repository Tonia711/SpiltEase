import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/NewGroupPage.module.css";

export default function NewGroupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();

    const newGroup = {
      name,
      description: desc,
    };

    console.log("Creating group:", newGroup);

    // 模拟成功后的行为
    setSuccess(true);
    setTimeout(() => {
      navigate("/groups");
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleCreate}>
        <h2>Create New Group</h2>

        <div className={styles.inputGroup}>
          <label>Group Name</label>
          <input
            type="text"
            value={name}
            placeholder="e.g. Weekend Trip"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Description (optional)</label>
          <textarea
            value={desc}
            placeholder="e.g. All expenses for our road trip"
            rows="3"
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.button}>
          Create Group
        </button>

        {success && <div className={styles.success}>Group created!</div>}
      </form>
    </div>
  );
}
