import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import CropperModal from "../components/CropperModal.jsx";

export default function GroupDetailPage() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isIconEditing, setIsIconEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedStartDate, setEditedStartDate] = useState("");
  const { token } = useContext(AuthContext);

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const showErrorToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const ICON_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${ICON_BASE}/groups/defaultIcon.jpg`;


  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        setGroup(data);

        const iconUrl = data.iconUrl;
        const fullIconUrl = iconUrl
          ? (iconUrl.startsWith("http") ? iconUrl : `${ICON_BASE}/${iconUrl}`)
          : DEFAULT_ICON;

        setGroupIconUrl(fullIconUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
        showErrorToast("Upload failed. Please try again.");
        setLoading(false);
      });
  }, [groupId, ICON_BASE]);

  if (loading) return <p className={styles.loading}>Loading group details...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!group) return <p className={styles.error}>No group data found.</p>;

  // const formatStartDate = (dateString) => {
  //   if (!dateString) return "Not specified";
  //   try {
  //     const date = new Date(dateString);
  //     return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  //   } catch (e) {
  //     console.error("Error formatting date:", dateString, e);
  //     return "Invalid Date";
  //   }
  // };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedUpload = async (croppedFile) => {
    setShowCropper(false);
    const formData = new FormData();
    formData.append("icon", croppedFile);
    formData.append("groupId", groupId);
    try {
      const { data } = await api.post("/groups/icon", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = data.iconUrl.startsWith("http")
        ? data.iconUrl
        : `${ICON_BASE}/${data.iconUrl}`;
      setGroupIconUrl(uploadedUrl);
    } catch (err) {
      console.error(err);
      showErrorToast("Upload failed. Please try again.");
    }
  };

  return (
    <MobileFrame>
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(`/groups/${group._id}/expenses`)}>
            {"<"}
          </button>

          <div className={styles.groupIconWrapper}>
            <div className={styles.groupIconContainer}>
              <img
                src={groupIconUrl}
                alt="Group Icon"
                className={styles.groupIcon}
              />
              <label htmlFor="iconUpload" className={styles.cameraIcon} onClick={() => setIsIconEditing(true)}>
                📷
              </label>
              <input
                id="iconUpload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {showCropper && rawImage && (
            <CropperModal
              imageSrc={rawImage}
              onClose={() => setShowCropper(false)}
              onCropDone={handleCroppedUpload}
            />
          )}

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

              <li className={styles.memberItem}>
                {isAddingMember ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Enter name"
                      className={styles.inputField}
                      style={{ flex: 1 }}
                    />
                    <button
                      className={styles.saveButton}
                      onClick={async () => {
                        if (!newMemberName.trim()) {
                          showErrorToast("Please enter a name");
                          return;
                        }
                        try {
                          const { data } = await api.post(`/groups/${groupId}/members/new`, {
                            userName: newMemberName.trim(),
                          });
                          setGroup(data);
                          setNewMemberName("");
                          setIsAddingMember(false);
                        } catch (err) {
                          console.error("Failed to add member:", err);
                          showErrorToast("Failed to add member.");
                        }
                      }}
                    >
                      ✔
                    </button>
                    <button className={styles.cancelButton} onClick={() => setIsAddingMember(false)}>✖</button>
                  </div>
                ) : (
                  <button onClick={() => setIsAddingMember(true)} className={styles.addMemberButton}>
                    Add new member
                  </button>
                )}
              </li>
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
