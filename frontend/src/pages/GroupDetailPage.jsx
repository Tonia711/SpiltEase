import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function GroupDetailPage() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedStartDate, setEditedStartDate] = useState("");
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${BASE_URL}/groups/testIcon1.jpg`;

  
  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        setGroup(data);

        const iconUrl = data.iconUrl;
        const fullIconUrl = iconUrl
          ? (iconUrl.startsWith("http") ? iconUrl : `${BASE_URL}/${iconUrl}`)
          : DEFAULT_ICON;

        setGroupIconUrl(fullIconUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
        setError("Failed to load group data. Please try again.");
        setLoading(false);
      });
  }, [groupId, BASE_URL]);

  if (loading) return <p className={styles.loading}>Loading group details...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!group) return <p className={styles.error}>No group data found.</p>;

  const formatStartDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            {"<"}
          </button>
          <img
            src={groupIconUrl}
            alt="Group Icon"
            className={styles.groupIcon}
          />

          <div className={styles.inviteCode}>
            Invite Code <span className={styles.codeValue}>{group.joinCode}</span>
          </div>
        </div>

        <section className={styles.infoSection}>
          <label htmlFor="groupName" className={styles.label}>Group Name</label>
          <input
            id="groupName"
            type="text"
            value={isEditing ? editedGroupName : group.groupName}
            onChange={(e) => setEditedGroupName(e.target.value)}
            readOnly={!isEditing}
            className={`${styles.inputField} ${!isEditing ? styles.readOnly : ""}`}
          />
        </section>

        <section className={styles.infoSection}>
          <label htmlFor="startDate" className={styles.label}>Start Date</label>
          <input
            id="startDate"
            type="date"
            value={
              isEditing
                ? editedStartDate?.slice(0, 10)
                : group.startDate?.slice(0, 10) || ""
            }
            onChange={(e) => setEditedStartDate(e.target.value)}
            readOnly={!isEditing}
            className={`${styles.inputField} ${!isEditing ? styles.readOnly : ""}`}
          />
        </section>

        <section className={styles.membersSection}>
          <h4 className={styles.membersTitle}>Members</h4>
          <div className={styles.membersListContainer}> {/* Added container for list */}
            <ul className={styles.membersList}> {/* Renamed list class */}
              {(group.members || []).map((member) => (
                <li key={member._id || member.userId || member.memberId} className={styles.memberItem}>
                  {member.userName || member.name || 'Unnamed'}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <button
          className={styles.editButton}
          onClick={() => {
            if (!isEditing) {
              setEditedGroupName(group.groupName || "");
              setEditedStartDate(group.startDate || "");
            } else {
              // api.put(`/groups/${groupId}`, { groupName: editedGroupName, startDate: editedStartDate })
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? "Save" : "Edit"}
        </button>

      </div>
    </MobileFrame>
  );
}
