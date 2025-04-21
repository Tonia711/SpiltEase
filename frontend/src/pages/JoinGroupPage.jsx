import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import styles from "../styles/JoinGroupPage.module.css";
import { AuthContext } from "../contexts/AuthContext";

export default function GroupJoinPage() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidCode, setHasValidCode] = useState(false);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");
  const [showInputError, setShowInputError] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Step 1： input invite code and validate
  const handleCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter a 5-digit code.");
      setShowInputError(true);
      setTimeout(() => setShowInputError(false), 2000);
      return;
    }
    setError("");
    setIsValidating(true);
    setShowInputError(false);

    try {
      const { data } = await api.post("/groups/validate", {
        joinCode: inviteCode.trim(),
      });
      if (data.isAlreadyMember) {
        setError("Already a member");
        setHasValidCode(false);
        setGroup(null);
        setShowInputError(true);
        setTimeout(() => setShowInputError(false), 2000); // 如果需要自动移除样式
      } else {
        setError("");
        setShowInputError(false);
        setGroup(data.group);
        setHasValidCode(true);
        setSelectedMember(null);
      }
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 404) {
        setError("Wrong Code!");
      } else {
        setError("An error occurred during validation. Please try again later.");
      }
      setShowInputError(true);
      setTimeout(() => setShowInputError(false), 2000);
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2： select member or add new member
  const handleSelectMember = (member) => {
    if (!member.userId) {
      setSelectedMember({ ...member, isNew: false });
      setError("");
    }
  };

  // Step 3： add new member
  const handleJoinAsNewUser = () => {
    if (!user || !user.userName) {
      setError("Could not retrieve your username. Please try logging in again.");
      return;
    }
    setError("");
    const tempNewMember = {
      memberId: null,
      userName: user.userName,
      isNew: true
    };
    setSelectedMember(tempNewMember);
  };

  // Step 4： join group
  const handleJoin = async () => {
    if (!selectedMember) {
      setError("Please select or add your name.");
      return;
    }

    setError("");
    setIsJoining(true);

    try {
      let memberIdToJoin;

      await api.post(`/groups/join`, {
        selectedMemberId: memberIdToJoin,
        joinCode: inviteCode.trim()
      });

      navigate(`/groups/${group._id}`);
    } catch (e) {
      console.error(e);
      setError("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const sortedMembers = React.useMemo(() => {
    if (!group || !group.members) return [];

    const membersCopy = [...group.members];

    membersCopy.sort((a, b) => {
      const aIsReal = !!a.userId;
      const bIsReal = !!b.userId;

      if (aIsReal && !bIsReal) return -1;
      if (!aIsReal && bIsReal) return 1;

      return 0;
    });

    return membersCopy;
  }, [group]);

  return (
    <MobileFrame>
      <div className={styles.container}>
        {/* ——— input invite code ——— */}
        {!hasValidCode && (
          <>
            <div className={styles.titleRow}>
              <button className={styles.backButton} onClick={() => navigate("/")}>
                {"<"}
              </button>
              <h2 className={styles.title}>Join Group</h2>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Invite Code</label>
                {error && !hasValidCode && <span className={styles.inlineError}>{error}</span>}
              </div>
              <input
                key={showInputError ? 'shake' : 'normal'}
                type="text"
                maxLength={5}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className={`${styles.inputField} ${showInputError ? `${styles.inputError} ${styles.shake}` : ""}`}
                placeholder="5 digits"
              />

            </div>
            <button
              onClick={handleCodeSubmit}
              className={styles.joinButton}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Join"}
            </button>
            {error && hasValidCode && <p className={styles.error}>{error}</p>}
          </>
        )}

        {/* ——— validate scuccess ——— */}
        {hasValidCode && group && (
          <>
            <div className={styles.titleRow}>
              <button className={styles.backButton} onClick={() => navigate("/")}>
                {"<"}
              </button>
              <h2 className={styles.title}>{group.groupName}</h2>
            </div>
            <label className={styles.label}>Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              readOnly
              className={styles.inputField}
            />

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Select your name from the list:</h3>
              <div className={styles.membersListContainer}>
                <ul className={styles.membersList}>
                  {sortedMembers.map((m) => {
                    const isRealMember = !!m.userId;
                    const isSelectedVirtual = selectedMember && !selectedMember.isNew && selectedMember.memberId === m.memberId;

                    return (
                      <li
                        key={m.memberId || m._id}
                        className={
                          isRealMember
                            ? styles.memberItemReal // 真实用户样式 (不可选)
                            : (isSelectedVirtual
                              ? styles.memberItemSelected // 选中的虚拟成员样式
                              : styles.memberItem) // 普通虚拟成员样式 (可选)
                        }
                        onClick={isRealMember ? undefined : () => handleSelectMember(m)}
                      >
                        {m.userName}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* join as a new member */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Can't find your name? </h3>
              <button
                onClick={handleJoinAsNewUser}
                className={`${styles.joinAsNewButton} ${selectedMember && selectedMember.isNew ? styles.memberItemSelected : ''
                  }`}
                disabled={!user || !user.userName}
              >
                Join as "{user?.userName || '...'}"
              </button>
            </div>

            <button
              onClick={handleJoin}
              className={styles.joinButton}
              disabled={isJoining || !selectedMember}
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </MobileFrame >
  );
}
