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

  const [selectedMember, setSelectedMember] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Step 1： input invite code and validate
  const handleCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter a 5-digit code.");
      return;
    }
    setError("");
    setIsValidating(true);

    try {
      const { data } = await api.post("/groups/validate", {
        joinCode: inviteCode.trim(),
      });

      // data = { _id, groupName, members: [ { _id, name }, ... ] }
      setGroup(data);
      setHasValidCode(true);
      setSelectedMember(null);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 404) {
        setError("Invalid invite code. Please try again.");
      } else {
        setError("An error occurred during validation. Please try again later.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2： select member or add new member
  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  // Step 3： add new member
  const handleJoinAsNewUser = () => {
    if (!user || !user.userName) {
      setError("Could not retrieve your username. Please try logging in again.");
      return;
    }
    setError("");
    // 创建一个临时对象表示当前用户作为新成员加入
    // name 字段用于界面显示，isNew 标记用于 handleJoin 判断
    // userId 字段可以传递给后端，便于后端关联用户到新的 member 子文档
    const tempNewMember = {
      _id: null, // 新成员在前端没有 _id
      name: user.userName, // 使用当前用户的 userName
      isNew: true, // 标记为新成员
      userId: user._id // 可以包含用户 ID
    };
    setSelectedMember(tempNewMember); // 设置为选中状态
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
      let memberIdToJoin = selectedMember._id;
      if (selectedMember.isNew) {
        const { data: createdMember } = await api.post(
          `/groups/${group._id}/members`,
          { userName: selectedMember.name }
        );
        memberIdToJoin = createdMember._id; // 假设后端返回新创建 member 的 _id
        // ✅ ADDED: 可选: 如果创建成功，更新前端的 selectedMember 状态，使其包含后端返回的 _id
        // setSelectedMember({...selectedMember, _id: memberIdToJoin });
      }

      // 再把 memberId 加入 group
      await api.post(`/groups/${group._id}/join`, {
        memberId: memberIdToJoin,
      });

      navigate(`/groups/${group._id}`);
    } catch (e) {
      console.error(e);
      setError("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        {/* ——— input invite code ——— */}
        {!hasValidCode && (
          <>
            <h2 className={styles.title}>Join Group</h2>
            <label className={styles.label}>Invite Code</label>
            <input
              type="text"
              maxLength={5}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className={styles.inputField}
              placeholder="5 digits"
            />
            <button
              onClick={handleCodeSubmit}
              className={styles.joinButton}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Join"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}

        {/* ——— validate scuccess ——— */}
        {hasValidCode && group && (
          <>
            <h2 className={styles.title}>{group.groupName}</h2>

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
                  {group.members.map((m) => (
                    <li
                      key={m._id || m.memberId || `existing-${m.userName}`}
                      className={
                        // 选中状态判断: 如果 selectedMember 存在且不是新成员，且 _id 匹配
                        selectedMember && !selectedMember.isNew && selectedMember._id === m._id
                          ? styles.memberItemSelected
                          : styles.memberItem
                      }
                      onClick={() => handleSelectMember(m)}
                    >
                      {m.userName}
                    </li>
                  ))}
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
                Join as "{user?.userName || '...'}" {/* 显示当前用户名 */}
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
