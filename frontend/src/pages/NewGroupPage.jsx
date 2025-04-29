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
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
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

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim()) {
        searchUsers(searchText.trim());
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const searchUsers = async (query) => {
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setSearchResults(data);
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const handleSelectUser = (user) => {
    const exists = members.find((m) => m.userId === user._id);
    if (!exists) {
      setMembers([...members, { userId: user._id, userName: user.userName }]);
    }
    setSearchText("");
    setSearchResults([]);
    setIsAddingMember(false);
  };

  const handleAddVirtualMember = () => {
    if (!newMemberName.trim()) return;
    setMembers([
      ...members,
      { userName: newMemberName.trim(), isVirtual: true },
    ]);
    setNewMemberName("");
    setIsAddingMember(false);
  };

  const handleRemoveMember = (index) => {
    if (members[index].isCreator) return;
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    // 如果群组名为空，提前返回（保险）
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

    console.log("Submitting group:", payload);

    try {
      // 发送 POST 请求到后端，真正创建群组
      const response = await api.post("/groups/create", payload);

      console.log("Group created successfully:", response.data);

      setSuccess(true);

      // 延迟 1 秒后跳转到群组主页
      setTimeout(() => {
        navigate("/groups");
      }, 1000);
    } catch (error) {
      console.error("Failed to create group:", error);

      // 提示用户失败信息
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
                    {member.userName}{" "}
                    {member.isVirtual
                      ? "(Virtual)"
                      : member.isCreator
                      ? "(You)"
                      : "(Real)"}
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
                  value={searchText || newMemberName}
                  onChange={(e) => {
                    if (searchText !== undefined) setSearchText(e.target.value);
                    else setNewMemberName(e.target.value);
                  }}
                  placeholder="Enter member name or search"
                  className={styles.memberInput}
                />
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={() => {
                    if (searchResults.length > 0) {
                      // 有搜索结果，不处理；等待用户点击选项
                    } else if (searchText.trim()) {
                      setMembers([
                        ...members,
                        { userName: searchText.trim(), isVirtual: true },
                      ]);
                      setSearchText("");
                      setIsAddingMember(false);
                    }
                  }}
                >
                  ✔
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsAddingMember(false);
                    setSearchText("");
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

            {searchResults.length > 0 && (
              <ul className={styles.searchResultList}>
                {searchResults
                  .filter(
                    (searchUser) => searchUser._id !== (user.id || user._id)
                  )
                  .map((user) => (
                    <li
                      key={user._id}
                      className={styles.searchResultItem}
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.userName}
                    </li>
                  ))}

                {/* 🔥 新增这一项： */}
                {searchText.trim() && (
                  <li
                    className={styles.searchResultItem}
                    style={{ color: "#fbc609" }} // 黄色提示更明显
                    onClick={() => {
                      setMembers([
                        ...members,
                        { userName: searchText.trim(), isVirtual: true },
                      ]);
                      setSearchText("");
                      setIsAddingMember(false);
                      setSearchResults([]);
                    }}
                  >
                    ➕ Add "{searchText.trim()}" as a virtual member
                  </li>
                )}
              </ul>
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
