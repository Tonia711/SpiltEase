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
  const [alert, setAlert] = useState("");
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
  };

  const showErrorToast = (message) => showToastMessage(message, "error");

  const fetchGroupData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data);
      const iconUrl = data.iconUrl;
      const fullIconUrl = iconUrl
        ? (iconUrl.startsWith("http") ? iconUrl : `${ICON_BASE}/${iconUrl}`)
        : DEFAULT_ICON;
      setGroupIconUrl(fullIconUrl);
      setLoading(false);
      return data;
    } catch (err) {
      console.error("Failed to fetch group data:", err);
      showErrorToast("Failed to load group details.");
      setLoading(false);
      setError("Failed to load group details.");
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
      }, 30000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [showToast]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

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
    } catch (err) {
      console.error(err);
      showErrorToast("Upload failed. Please try again.");
    }
  };

  const handlePreviewNewMember = () => {
    if (!newMemberName.trim()) {
      setAlert("Please enter a name.");
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

        setAlert("Save to confirm.");
      }
      catch (err) {
        setAlert("Delete when balance is 0!");
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
      const member = {
        userId: m.userId,
        userName: m.userName
      };
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

    try {
      const { data } = await api.put(`/groups/${groupId}/update`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGroup(data);
      setEditedGroupName("");
      setEditedStartDate("");
      setEditedMembers([]);
      setIsAddingMember(false);
      setNewMemberName("");
      setIsEditing(false);
    } catch (err) {
      console.error("Save group error:", err);
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
            <p>Are you sure you want to remove {memberToRemove.userName || 'this member'} from the group?</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.deleteMemberBtn} onClick={handleConfirmRemove}>Remove</button>
              <button type="button" className={styles.cancelMoalButton} onClick={handleCancelRemove}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <span type="button" className={styles.backButton} onClick={() => navigate(`/groups/${group._id}/expenses`)}>
            {"<"}
          </span>

          <div className={styles.groupIconWrapper}>
            <div className={styles.groupIconContainer}>
              <img
                src={groupIconUrl}
                alt="Group Icon"
                className={styles.groupIcon}
              />
              <label htmlFor="iconUpload" className={styles.cameraIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1F1C2C" className="size-6">
                  <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                  <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>

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
          <Copy className={styles.copyIcon} onClick={handleCopy} data-testid="copy-icon" />
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
          <div className={styles.labelRow}>
            <p className={styles.membersTitle}>Members</p>
            {alert && (
              <span className={styles.inlineError}>{alert}</span>
            )}
          </div>

          <div className={styles.membersListContainer}>
            <ul className={styles.membersList}>
              {(isEditing ? editedMembers : (group.members || [])).filter(m => !m.isHidden).map((member) => (
                <li key={member._id || member.userId || member.tempId} className={`${styles.memberItem} ${!isEditing ? styles.readOnlyMember : styles.editMembers}`}>
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
                        className={styles.newMemberName}
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
