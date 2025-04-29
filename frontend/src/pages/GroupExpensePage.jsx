import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import MobileFrame from "../components/MobileFrame";
import styles from "../styles/GroupExpensePage.module.css";
import dayjs from "dayjs";
import { AuthContext } from "../contexts/AuthContext";
import { useMemo } from "react";

export default function GroupExpensePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [groupBills, setGroupBills] = useState([]); 
  const [bills, setBills] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [balance, setBalance] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${BASE_URL}/groups/defaultIcon.jpg`;

  const myUserId = currentUser?._id?.toString() || "";

  // 找到自己在 group.members 里的 _id
  const myGroupMemberObjectId = useMemo(() => {
    if (!group || !group.members || !currentUser) return null;
    const myMember = group.members.find(m => m.userId?.toString() === currentUser._id?.toString());
    return myMember?._id?.toString() || null;
  }, [group, currentUser]);


  const { totalOwed, myBalances, othersBalances, myExpenses, totalExpenses } = useMemo(() => {
    let myExpenses = 0;
    let totalExpenses = 0;    
    let totalOwed = 0;
    let myBalances = [];
    const memberBalanceMap = {};

    if (groupBills && groupBills.length > 0) {
      groupBills.forEach(bill => {
        totalExpenses += (bill.expenses || 0) - (bill.refunds || 0);
    
        if (bill.members && bill.members.length > 0) {
          bill.members.forEach(member => {
            const matchedGroupMember = group?.members?.find(m => m._id?.toString() === member.memberId?.toString());
            
            if (member.memberId?.toString() === myGroupMemberObjectId) {
              myExpenses += (member.expense || 0) - (member.refund || 0);
            }
            
          });
        }
      });
    }
    

    if (myUserId && balance.length > 0) {
      balance.forEach(b => {
        const fromId = b.fromMemberId?.toString();
        const toId = b.toMemberId?.toString();

        if (fromId === myUserId || toId === myUserId) {
          myBalances.push(b);
          if (toId === myUserId) {
            totalOwed += b.balance;
          } else {
            totalOwed -= b.balance;
          }
        }

        if (fromId && !memberBalanceMap[fromId]) {
          memberBalanceMap[fromId] = -b.balance;
        } else if (fromId) {
          memberBalanceMap[fromId] -= b.balance;
        }

        if (toId && !memberBalanceMap[toId]) {
          memberBalanceMap[toId] = b.balance;
        } else if (toId) {
          memberBalanceMap[toId] += b.balance;
        }
      });
    }
    return { totalOwed, myBalances, othersBalances: memberBalanceMap, myExpenses, totalExpenses };
}, [balance, myUserId, groupBills, myGroupMemberObjectId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: groupData }, { data: billsData }] = await Promise.all([
          api.get(`/groups/${groupId}`),
          api.get(`/bills/group/${groupId}`),
        ]);
        setGroup(groupData);
        setGroupBills(billsData || []);

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

  useEffect(() => {
    async function fetchBalance() {
      try {
        const { data: balanceData } = await api.get(`/balances/group/${groupId}`);
        console.log("Fetched balanceData:", balanceData);
        setBalance(balanceData.groupBalances || []);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalance([]);
      }
    }

    if (activeTab === "balance") {
      fetchBalance();
    }
  }, [activeTab, groupId]); 


  if (loading) return <p>Loading expenses...</p>;
  if (error) return <p>{error}</p>;

  const handleGroupClick = () => {
    navigate(`/groups/${groupId}`); // 点头像跳 GroupDetailPage
  };

  const handleAddExpenseClick = () => {
    navigate(`/groups/${groupId}/creatBill`);
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

          <div className={styles.tabContainer}>
            <button
              className={`${styles.tabButton} ${activeTab === "expenses" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("expenses")}
            >
              Expenses
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "balance" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("balance")}
            >
              Balance
            </button>
          </div>
      
          <div className={styles.scrollArea}>
          {activeTab === "expenses" ? (
            Object.keys(bills).length === 0 ? (
              <p>No expenses found.</p>
            ) : (
              <>
                <div className={styles.expensesHeader}>
                  <div className={styles.expensesHeaderRow}>
                    <span>My Expenses</span>
                    <span>Total Expenses</span>
                  </div>
                  <div className={styles.expensesHeaderRow}>
                    <span>${myExpenses.toFixed(2)}</span>
                    <span>${totalExpenses.toFixed(2)}</span>
                  </div>
                </div>

              
              {Object.entries(bills).map(([date, billList]) => (
                <div key={date} style={{ marginBottom: "20px" }}>
                  <h4 className={styles.billDateTitle}>
                    {dayjs(date).format("MMM D, YYYY")}
                  </h4>
                  <ul>
                    {billList.map((bill) => (
                      <li
                        key={bill._id}
                        className={styles.billItem}
                        onClick={() => navigate(`/groups/${groupId}/expenses/${bill._id}`)}
                      >

                        {bill.label?.iconUrl && (
                          <img
                            src={`${BASE_URL}/${bill.label.iconUrl}`}
                            alt={bill.label.type}
                            className={styles.billIcon}
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
            </>
          )
      ) : (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <div className={styles.totalOwedRow}>
            <span>You owe</span>
            <span>${Math.abs(totalOwed).toFixed(2)}</span>
          </div>
             
          {!group?.members ? (
                <p>Loading balances...</p>
              ) : myBalances.length === 0 ? (
              <p>No balances to show.</p>
            ) : (
              <ul className={styles.balanceList}>
                {myBalances.map((b, index) => {
                  const isOwedToMe = b.toMemberId?.toString() === myUserId;
                  const otherPersonId = isOwedToMe ? b.fromMemberId : b.toMemberId;
                  const otherPerson = group?.members?.find(m => m._id?.toString() === otherPersonId?.toString());

                  return (
                    <li key={index} className={styles.balanceItem}>
                      {isOwedToMe ? (
                        <>
                          <span>{otherPerson?.userName || "Someone"}</span> owes you
                          <span style={{ fontWeight: "bold" }}> ${b.balance.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          You owe <span>{otherPerson?.userName || "Someone"}</span>
                          <span style={{ fontWeight: "bold" }}> ${b.balance.toFixed(2)}</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className={styles.memberSection}>
              <h3>Group Members Balance</h3>
              {group?.members?.some(member => {
                const memberId = member._id?.toString();
                if (!memberId) return false;
                return balance.some(b => b.fromMemberId?.toString() === memberId);
              }) ? (
              group?.members?.map(member => {
                const memberId = member._id?.toString();
                if (!memberId) return null;

                const relatedBalances = balance.filter(
                  b => b.fromMemberId?.toString() === memberId
                );
          
                if (relatedBalances.length === 0) return null;

                const totalOwes = relatedBalances.reduce((sum, b) => sum + b.balance, 0);

                return (
                  <div key={member._id} className={styles.memberBlock}>
                    <div className={styles.memberNameRow}>
                      <span className={styles.memberNameLeft}>
                        {member.userName} owes
                      </span>
                      <span className={styles.memberNameRight}>
                        ${totalOwes.toFixed(2)}
                      </span>
                    </div>

                    <ul className={styles.memberList}>
                      {relatedBalances.map((b, index) => {
                        const toMember = group?.members?.find(m => m._id?.toString() === b.toMemberId?.toString());
                        if (!toMember) return null;

                        const isCurrentUser = toMember._id?.toString() === myUserId;

                        return (
                          <li key={index} className={isCurrentUser ? styles.highlightedItem : styles.memberItem}>
                            <span>{toMember.userName}</span>
                            <span>${b.balance.toFixed(2)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            ) : (
              <p>No group member balances to show.</p>
            )}
            </div>



          </div>
        )}
      </div>

    
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