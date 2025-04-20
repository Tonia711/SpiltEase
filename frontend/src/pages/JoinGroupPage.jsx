// File: src/pages/GroupJoinPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import styles from "../styles/JoinGroupPage.module.css";

export default function GroupJoinPage() {
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidCode, setHasValidCode] = useState(false);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // 1️⃣ 验证邀请码
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
    } catch (e) {
      console.error(e);
      setError("Invalid invite code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // 2️⃣ 选择已有成员
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setNewMemberName("");
  };

  // 3️⃣ 添加新成员（只是本地预览，真正加入在 handleJoin）
  const handleAddNew = () => {
    if (!newMemberName.trim()) return;
    const temp = { _id: null, name: newMemberName.trim(), isNew: true };
    setSelectedMember(temp);
  };

  // 4️⃣ 最终 Join
  const handleJoin = async () => {
    if (!selectedMember) {
      setError("Please select or add your name.");
      return;
    }
    setError("");
    setIsJoining(true);

    try {
      // 如果是新成员，先创建 member
      let memberId = selectedMember._id;
      if (selectedMember.isNew) {
        const { data: created } = await api.post(
          `/groups/${group._id}/members`,
          { name: selectedMember.name }
        );
        memberId = created._id;
      }

      // 再把 memberId 加入 group
      await api.post(`/groups/${group._id}/join`, {
        memberId,
      });

      // 加入成功后，跳转到小组详情页
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
        {/* ——— 输入邀请码阶段 ——— */}
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

        {/* ——— 邀请码验证成功后 ——— */}
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

            <label className={styles.label}>Join as member</label>
            <div className={styles.membersListContainer}>
              <ul className={styles.membersList}>
                {group.members.map((m) => (
                  <li
                    key={m._id}
                    className={
                      selectedMember?._id === m._id
                        ? styles.memberItemSelected
                        : styles.memberItem
                    }
                    onClick={() => handleSelectMember(m)}
                  >
                    {m.userName}
                  </li>
                ))}
              </ul>
              {/* 添加新成员输入框 */}
              <div className={styles.newMemberRow}>
                <input
                  type="text"
                  placeholder="Add your surname as new"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className={styles.newMemberInput}
                />
                <button
                  onClick={handleAddNew}
                  className={styles.addButton}
                >＋</button>
              </div>
            </div>

            <button
              onClick={handleJoin}
              className={styles.joinButton}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </MobileFrame>
  );
}
