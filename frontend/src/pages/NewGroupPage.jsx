import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/NewGroupPage.module.css";
import MobileFrame from "../components/MobileFrame";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";

export default function NewGroupPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [groupName, setGroupName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [members, setMembers] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && (user.id || user._id) && user.userName) {
      setMembers([
        {
          userId: user.id || user._id,
          userName: user.userName,
          isCreator: true,
        },
      ]);
    }
  }, [user]);

  const handleRemoveMember = (index) => {
    if (members[index].isCreator) return;
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    const payload = {
      groupName,
      startDate,
      members: members.map((m) => ({
        userName: m.userName,
        userId: m.userId || null,
        isVirtual: m.isVirtual || false,
      })),
    };

    try {
      const response = await api.post("/groups/create", payload);
      setSuccess(true);
      setTimeout(() => {
        navigate("/groups");
      }, 1000);
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group. Please try again later.");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/groups")}
          >
            {"<"}
          </button>
          <h1 className={styles.title}>New Group</h1>
        </div>

        <form className={styles.form} onSubmit={handleCreateGroup}>
          <div className={styles.inputGroup}>
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Members</label>
            <ul className={styles.membersList}>
              {members.length > 0 ? (
                members.map((member, index) => (
                  <li key={index} className={styles.memberItem}>
                    {member.userName} {member.isCreator ? "(You)" : "(Virtual)"}
                    {!member.isCreator && (
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleRemoveMember(index)}
                      >
                        ✖
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className={styles.emptyItem}>No members yet</li>
              )}
            </ul>

            {isAddingMember ? (
              <div style={{ display: "flex", gap: "8px", marginTop: "0.8rem" }}>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter virtual member name"
                  className={styles.memberInput}
                />
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={() => {
                    if (!newMemberName.trim()) return;
                    setMembers([
                      ...members,
                      {
                        userName: newMemberName.trim(),
                        isVirtual: true,
                      },
                    ]);
                    setNewMemberName("");
                    setIsAddingMember(false);
                  }}
                >
                  ✔
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsAddingMember(false);
                    setNewMemberName("");
                  }}
                >
                  ✖
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.addMemberButton}
                onClick={() => setIsAddingMember(true)}
              >
                Add another member
              </button>
            )}
          </div>

          <button type="submit" className={styles.createButton}>
            Create
          </button>

          {success && (
            <div className={styles.success}>Group created successfully!</div>
          )}
        </form>
      </div>
    </MobileFrame>
  );
}
