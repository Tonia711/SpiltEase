import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import CropperModal from "../components/CropperModal.jsx";
import { Copy } from "lucide-react";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  /* -------------------- state -------------------- */
  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedStartDate, setEditedStartDate] = useState("");
  const [editedMembers, setEditedMembers] = useState([]); // members use _id

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

  /* -------------------- constants -------------------- */
  const ICON_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${ICON_BASE}/groups/defaultIcon.jpg`;

  /* -------------------- helpers -------------------- */
  const showToastMessage = (msg, type = "error") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const showErrorToast = (msg) => showToastMessage(msg, "error");
  const showSuccessToast = (msg) => showToastMessage(msg, "success");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(group.joinCode);
      showSuccessToast("Copied to clipboard!");
    } catch {
      showErrorToast("Failed to copy!");
    }
  };

  /* -------------------- data fetch -------------------- */
  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data);
      const iconUrl = data.iconUrl;
      setGroupIconUrl(
        iconUrl?.startsWith("http")
          ? iconUrl
          : `${ICON_BASE}/${iconUrl || "groups/defaultIcon.jpg"}`
      );
    } catch (e) {
      console.error(e);
      showErrorToast("Failed to load group details.");
      setError("Failed to load group details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  /* sync editing buffers when group changes */
  useEffect(() => {
    if (!group) return;
    setEditedGroupName(group.groupName || "");
    setEditedStartDate(group.startDate?.slice(0, 10) || "");
    setEditedMembers(group.members?.map((m) => ({ ...m })) || []);
  }, [group]);

  /* -------------------- icon upload -------------------- */
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
    const fd = new FormData();
    fd.append("icon", croppedFile);
    fd.append("groupId", groupId);
    try {
      const { data } = await api.post("/groups/icon", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const uploadedUrl = data.iconUrl.startsWith("http")
        ? data.iconUrl
        : `${ICON_BASE}/${data.iconUrl}`;
      setGroupIconUrl(uploadedUrl);
      showSuccessToast("Group icon updated!");
    } catch (err) {
      console.error(err);
      showErrorToast("Upload failed.");
    }
  };

  /* -------------------- member list operations -------------------- */
  const handlePreviewNewMember = () => {
    if (!newMemberName.trim()) return showErrorToast("Please enter a name.");
    setEditedMembers([
      ...editedMembers,
      {
        userName: newMemberName.trim(),
        tempId: Date.now() + Math.random(),
        isNew: true,
      },
    ]);
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
    if (!memberToRemove) return;
    try {
      if (memberToRemove._id) {
        await api.get(
          `/groups/${groupId}/check-member-deletable/${memberToRemove._id}`
        );
      }
      setEditedMembers((prev) =>
        prev.filter((m) =>
          memberToRemove._id
            ? m._id !== memberToRemove._id
            : m.tempId !== memberToRemove.tempId
        )
      );
      showSuccessToast(`Removed ${memberToRemove.userName}. Save to confirm.`);
    } catch {
      showErrorToast("Failed to delete this member.");
    } finally {
      setShowConfirmModal(false);
      setMemberToRemove(null);
    }
  };

  /* -------------------- save group -------------------- */
  const handleSaveGroup = async () => {
    setIsSaving(true);
    const payload = {
      groupName: editedGroupName,
      startDate: editedStartDate || null,
      members: editedMembers.map((m) => ({
        userName: m.userName,
        ...(m._id && { _id: m._id }),
      })),
    };
    try {
      const { data } = await api.put(`/groups/${groupId}/update`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroup(data);
      setIsEditing(false);
      setIsAddingMember(false);
      setNewMemberName("");
      showSuccessToast("Group updated!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save changes.";
      showErrorToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------- render shortcuts -------------------- */
  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!group) return <p className={styles.error}>No group found.</p>;

  const membersDisplay = isEditing ? editedMembers : group.members;

  return (
    <MobileFrame>
      {showToast && <div className={styles.toast}>{toastMessage}</div>}

      {/* Confirm delete modal */}
      {showConfirmModal && memberToRemove && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h4>Confirm Removal</h4>
            <p>Remove {memberToRemove.userName} from the group?</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelMoalButton}
                onClick={handleCancelRemove}
              >
                Cancel
              </button>
              <button
                className={styles.deleteMemberBtn}
                onClick={handleConfirmRemove}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* ----- header with back & icon ----- */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate(`/groups/${group._id}/expenses`)}
          >
            {"<"}
          </button>

          <div className={styles.groupIconWrapper}>
            <div className={styles.groupIconContainer}>
              <img
                src={groupIconUrl}
                alt="Group"
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
            Invite Code{" "}
            <span className={styles.codeValue}>{group.joinCode}</span>
            <Copy className={styles.copyIcon} onClick={handleCopy} />
          </div>
        </div>

        {/* ----- group name ----- */}
        <section className={styles.infoSection}>
          <label className={styles.label}>Group Name</label>
          <input
            type="text"
            value={isEditing ? editedGroupName : group.groupName}
            onChange={(e) => setEditedGroupName(e.target.value)}
            readOnly={!isEditing}
            className={`${styles.inputField} ${
              !isEditing ? styles.readOnly : ""
            }`}
          />
        </section>

        {/* ----- start date ----- */}
        <section className={styles.infoSection}>
          <label className={styles.label}>Start Date</label>
          <input
            type="date"
            value={
              isEditing ? editedStartDate : group.startDate?.slice(0, 10) || ""
            }
            onChange={(e) => setEditedStartDate(e.target.value)}
            readOnly={!isEditing}
            className={`${styles.inputField} ${
              !isEditing ? styles.readOnly : ""
            }`}
          />
        </section>

        {/* ----- members ----- */}
        <section className={styles.membersSection}>
          <h4 className={styles.membersTitle}>Members</h4>
          <div className={styles.membersListContainer}>
            <ul className={styles.membersList}>
              {membersDisplay.map((member) => (
                <li
                  key={member._id || member.tempId}
                  className={styles.memberItem}
                >
                  {member.userName}
                  {isEditing && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveMemberFromList(member)}
                    >
                      ✖
                    </button>
                  )}
                </li>
              ))}

              {/* add new member */}
              {isEditing && (
                <li className={styles.memberItem}>
                  {isAddingMember ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
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
                        onClick={handlePreviewNewMember}
                        disabled={isSaving}
                      >
                        ✔
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsAddingMember(false);
                          setNewMemberName("");
                        }}
                        disabled={isSaving}
                      >
                        ✖
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.addMemberButton}
                      onClick={() => setIsAddingMember(true)}
                      disabled={isSaving}
                    >
                      Add new member
                    </button>
                  )}
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* ----- edit/save ----- */}
        <button
          className={`${styles.editButton} ${
            isEditing ? styles.saveInfoButton : ""
          }`}
          onClick={() => {
            if (!isEditing) {
              setIsEditing(true);
            } else {
              handleSaveGroup();
            }
          }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
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
