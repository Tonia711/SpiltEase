import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import MobileFrame from "../components/MobileFrame";
import styles from "../styles/GroupExpensePage.module.css";
import dayjs from "dayjs";

export default function GroupExpensePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [bills, setBills] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${BASE_URL}/groups/defaultIcon.jpg`;

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: groupData }, { data: billsData }] = await Promise.all([
          api.get(`/groups/${groupId}`),
          api.get(`/bills/group/${groupId}`),
        ]);
        setGroup(groupData);

        console.log("Fetched bills:", billsData);
        console.log("Current groupId:", groupId);

        // 按日期分类账单
        const grouped = {};
        billsData.forEach((bill) => {
          const dateKey = dayjs(bill.date).format("YYYY-MM-DD");
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(bill);
        });

        setBills(grouped); // 现在是一个对象，key 是日期，value 是账单数组
      } catch (err) {
        console.error("Failed to fetch group or bills:", err);
        setError("Failed to load expenses.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [groupId]);

  if (loading) return <p>Loading expenses...</p>;
  if (error) return <p>{error}</p>;

  const handleGroupClick = () => {
    navigate(`/groups/${groupId}`); // 点头像跳 GroupDetailPage
  };

  const handleAddExpenseClick = () => {
    
  };

  const groupIconUrl = group?.iconUrl
    ? (group.iconUrl.startsWith("http") ? group.iconUrl : `${BASE_URL}/${group.iconUrl}`)
    : DEFAULT_ICON;

    return (
      <MobileFrame>
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate("/")}>
              {"<"}
            </button>
            <div onClick={handleGroupClick}>
              <img
                src={groupIconUrl}
                alt="Group Icon"
                className={styles.groupIcon}
              />
              <div className={styles.groupName}>{group?.groupName}</div>
              <div
                className="group-id"
                style={{ fontSize: "0.7rem", color: "#888" }}
              >
                ID: {group._id}
              </div>
            </div>
          </div>
    
          <h3>Expenses</h3>
      
          {Object.keys(bills).length === 0 ? (
            <p>No expenses found.</p>
          ) : (
            <div className={styles.scrollArea}>
              {Object.entries(bills).map(([date, billList]) => (
                <div key={date} style={{ marginBottom: "20px" }}>
                  <h4>{dayjs(date).format("MMM D, YYYY")}</h4>
                  <ul>
                    {billList.map((bill) => (
                      <li
                        key={bill._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px",
                          border: "1px solid #ddd",
                          padding: "10px",
                          borderRadius: "8px",
                        }}
                      >
                        {bill.label?.iconUrl && (
                          <img
                            src={`${BASE_URL}/${bill.label.iconUrl}`}
                            alt={bill.label.type}
                            style={{
                              width: "30px",
                              height: "30px",
                              marginRight: "10px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div>
                          <div>
                            <strong>{bill.note}</strong>
                          </div>
                          <div>${bill.expenses}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
      
    
          <div className={styles.fabContainer}>
            <button className={styles.fab} onClick={handleAddExpenseClick}>
              +
            </button>
            <div className={styles.fabLabel}>Add Expense</div>
          </div>
        </div>
      </MobileFrame>
    );
  }