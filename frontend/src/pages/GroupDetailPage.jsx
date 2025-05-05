import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import CropperModal from "../components/CropperModal.jsx";
import { Copy } from 'lucide-react';

export default function GroupDetailPage() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedStartDate, setEditedStartDate] = useState("");
  const [editedMembers, setEditedMembers] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("error");
  const [rawImage, setRawImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const ICON_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${ICON_BASE}/groups/defaultIcon.jpg`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(group.joinCode);
      showToastMessage('Copied to clipboard!');
    } catch (err) {
      showToastMessage('Failed to copy!');
    }
  };

  const showToastMessage = (message, type = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showErrorToast = (message) => showToastMessage(message, "error");
  const showSuccessToast = (message) => showToastMessage(message, "success");

  const fetchGroupData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data);
      console.log("fetch first", data);
      const iconUrl = data.iconUrl;
      const fullIconUrl = iconUrl
        ? (iconUrl.startsWith("http") ? iconUrl : `${ICON_BASE}/${iconUrl}`)
        : DEFAULT_ICON;
      setGroupIconUrl(fullIconUrl);
      setLoading(false);
      return data; // Return updated group data
    } catch (err) {
      console.error("Failed to fetch group data:", err);
      showErrorToast("Failed to load group details.");
      setLoading(false);
      setError("Failed to load group details."); // Set persistent error state
      return null;
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId, ICON_BASE]);

  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [showToast]);

  useEffect(() => {
    if (group) {
      setEditedGroupName(group.groupName || "");
      setEditedStartDate(group.startDate?.slice(0, 10) || "");
      setEditedMembers(group.members ? group.members.map(m => ({ ...m })) : []);
    }
  }, [group]);

  if (loading && !group) return <p className={styles.loading}>Loading group details...</p>;
  if (error && !loading) return <p className={styles.error}>{error}</p>;
  if (!group && !loading) return <p className={styles.error}>No group data found.</p>;

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
      showSuccessToast("Group icon updated successfully!");
    } catch (err) {
      console.error(err);
      showErrorToast("Upload failed. Please try again.");
    }
  };

  const handlePreviewNewMember = () => {
    if (!newMemberName.trim()) {
      showErrorToast("Please enter a member name.");
      return;
    }

    const tempMember = {
      userName: newMemberName.trim(),
      tempId: Date.now() + Math.random(),
      isNew: true,
    };
    setEditedMembers([...editedMembers, tempMember]);
    setNewMemberName("");
    setIsAddingMember(false);
  };

  const handleRemoveMemberFromList = (member) => {
    setMemberToRemove(member);
    setShowConfirmModal(true);
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setMemberToRemove(null);
  };

  const handleConfirmRemove = async () => {
    if (memberToRemove) {
      try {
        if (memberToRemove._id !== undefined && memberToRemove._id !== null) {
          await api.get(`/groups/${groupId}/check-member-deletable/${memberToRemove._id}`);
        }

        setEditedMembers(prev =>
          prev.map(m => {
            if (
              (memberToRemove._id !== undefined && m._id === memberToRemove._id) ||
              (memberToRemove.tempId !== undefined && m.tempId === memberToRemove.tempId)
            ) {
              return { ...m, isHidden: true };
            }
            return m;
          })
        );

        showToastMessage(`${memberToRemove.userName || memberToRemove.name} removed from list. Save to confirm.`, 'success');
      }
      catch (err) {
        showErrorToast("Failed to delete this member.");
      }
      finally {
        setShowConfirmModal(false);
        setMemberToRemove(null);
      }
    }
  };

  const handleSaveGroup = async () => {
    setIsSaving(true);
    setError(null);

    const membersToSave = editedMembers.map(m => {
      const member = { userName: m.userName };
      if (m._id !== undefined) {
        member._id = m._id;
      }
      if (m.isHidden !== undefined) {
        member.isHidden = m.isHidden; 
      }
      return member;
    });

    const payload = {
      groupName: editedGroupName,
      startDate: editedStartDate || null,
      members: membersToSave,
    };
    console.log("payload", payload)

    try {
      const { data } = await api.put(`/groups/${groupId}/update`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setGroup(data);
      console.log("after update", data)
      setEditedGroupName("");
      setEditedStartDate("");
      setEditedMembers([]);
      setIsAddingMember(false);
      setNewMemberName("");

      setIsEditing(false);
      showSuccessToast("Group updated successfully!");

    } catch (err) {
      console.error("Save group error:", err);
      const errorMessage = err.response?.data?.message || "Failed to save group changes. Please try again.";
      showErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileFrame>
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {showConfirmModal && memberToRemove && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h4>Confirm Removal</h4>
            <p>Are you sure you want to remove {memberToRemove.userName || 'this member'} from the group?</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelMoalButton} onClick={handleCancelRemove}>Cancel</button>
              <button type="button" className={styles.deleteMemberBtn} onClick={handleConfirmRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={() => navigate(`/groups/${group._id}/expenses`)}>
            {"<"}
          </button>

          <div className={styles.groupIconWrapper}>
            <div className={styles.groupIconContainer}>
              <img
                src={groupIconUrl}
                alt="Group Icon"
                className={styles.groupIcon}
              />
              <label htmlFor="iconUpload" className={styles.cameraIcon}>
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
            Invite Code
            <span className={styles.codeValue}>{group.joinCode}</span>
            <Copy className={styles.copyIcon} onClick={handleCopy} />
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
          <div className={styles.membersListContainer}>
            <ul className={styles.membersList}>
              {(isEditing ? editedMembers : (group.members || [])).filter(m => !m.isHidden).map((member) => (
                <li key={member._id || member.userId || member.tempId} className={styles.memberItem}>
                  {member.userName || 'Unnamed'}
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveMemberFromList(member)}
                    >
                      ✖
                    </button>
                  )}
                </li>
              ))}

              {isEditing && (
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
                        type="button"
                        className={styles.saveButton}
                        onClick={handlePreviewNewMember}
                        disabled={isSaving}
                      >
                        ✔
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsAddingMember(false);
                          setNewMemberName("")
                        }}
                        disabled={isSaving}>
                        ✖
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setIsAddingMember(true)} className={styles.addMemberButton} disabled={isSaving}>
                      Add new member
                    </button>
                  )}
                </li>
              )}
            </ul>
          </div>
        </section>

        <button
          className={`${styles.editButton} ${isEditing ? styles.saveInfoButton : ''}`}
          onClick={() => {
            if (!isEditing) {
              setIsEditing(true);
              setEditedGroupName(group.groupName || "");
              setEditedStartDate(group.startDate?.slice(0, 10) || "");
              setEditedMembers(group.members ? group.members.map(m => ({ ...m })) : []);
            } else {
              handleSaveGroup();
            }
          }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : (isEditing ? "Save" : "Edit")}
        </button>
        {isEditing && (
          <button
            className={styles.cancelEditButton}
            onClick={() => {
              setIsEditing(false);
              setIsAddingMember(false);
              setNewMemberName("");
              showToastMessage("Editing cancelled.", "success");
            }}
            disabled={isSaving}
          >
            Cancel
          </button>
        )}

      </div>
    </MobileFrame>
  );
}
