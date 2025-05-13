import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import MobileFrame from "../components/MobileFrame";
import styles from "../styles/GroupExpensePage.module.css";
import dayjs from "dayjs";
import { AuthContext } from "../contexts/AuthContext";
import { useMemo } from "react";
import GroupSummary from "../components/GroupSummary";
import { useLocation } from "react-router-dom";

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
  const [expandedBalanceId, setExpandedBalanceId] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);
  const [confirmMarkPaidId, setConfirmMarkPaidId] = useState(null);

  const location = useLocation();

  // Re-fetch data if coming from bill create/edit/delete
  useEffect(() => {
    if (location.state?.needRefreshBalance) {
      fetchData();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Base URL and default image
  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${BASE_URL}/groups/defaultIcon.jpg`;

  const myUserId = currentUser?._id?.toString() || "";

  // Mark balance as paid: create a transfer bill and update balance
  const handleConfirmMarkAsPaid = async (balanceItem) => {
    try {
      const { fromMemberId, toMemberId, balance: amount } = balanceItem;

      const fromUser = group.members.find(m => m._id?.toString() === fromMemberId)?.userName || "Someone";
      const toUser = group.members.find(m => m._id?.toString() === toMemberId)?.userName || "Someone";

      const fromDisplay = fromMemberId === myGroupMemberObjectId ? "You" : fromUser;
      const toDisplay = toMemberId === myGroupMemberObjectId ? "You" : toUser;

      const newBill = {
        groupId,
        labelId: "000000000000000000000007",
        date: new Date().toISOString(),
        note: `${fromDisplay} paid ${toDisplay}`,
        paidBy: fromMemberId,
        expenses: amount,
        refunds: 0,
        splitWay: "Equally",
        members: [
          {
            memberId: toMemberId,
            expense: amount,
            refund: 0,
          },
        ],
      };

      // Add transfer bill
      await api.post("/bills", newBill);

      await api.put(`/balances/group/${groupId}/markPaid`, {
        fromMemberId,
        toMemberId,
      });
      await fetchData(); // Refresh data

      const { data: balanceData } = await api.get(`/balances/group/${groupId}`);
      setBalance(balanceData.groupBalances ?? []);
      setConfirmMarkPaidId(null);
      setExpandedBalanceId(null);
    } catch (err) {
      console.error("Failed to mark as paid:", err);
      console.error("Detailed error:", err.response?.data || err.message);
      alert("Failed to mark as paid. Please try again.");
    }
  };

  // Get my group member ID
  const myGroupMemberObjectId = useMemo(() => {
    if (!group || !group.members || !currentUser) return null;
    const myMember = group.members.find(m => m.userId?.toString() === currentUser._id?.toString());
    return myMember?._id?.toString() || null;
  }, [group, currentUser]);

  // Calculate my expenses and balance summary
  const { owedToMe, iOwe, myBalances, myExpenses, totalExpenses } = useMemo(() => {
    let myExpenses = 0;
    let totalExpenses = 0;
    let owedToMe = 0;
    let iOwe = 0;
    let myBalances = [];
    const memberBalanceMap = {};

    if (groupBills && groupBills.length > 0) {
      groupBills.forEach(bill => {
        if (bill.label?._id?.toString() === "000000000000000000000007") return;

        totalExpenses += (bill.expenses || 0) - (bill.refunds || 0);

        if (bill.members && bill.members.length > 0) {
          bill.members.forEach(member => {
            if (member.memberId?.toString() === myGroupMemberObjectId) {
              myExpenses += (member.expense || 0) - (member.refund || 0);
            }
          });
        }
      });
    }

    if (myGroupMemberObjectId && balance.length > 0) {
      const unfinished = balance.filter(b => !b.isFinished);

      unfinished.forEach(b => {
        const fromId = b.fromMemberId?.toString();
        const toId = b.toMemberId?.toString();

        if (toId === myGroupMemberObjectId) {
          owedToMe += b.balance;
          myBalances.push({ ...b, direction: "incoming" });
        } else if (fromId === myGroupMemberObjectId) {
          iOwe += b.balance;
          myBalances.push({ ...b, direction: "outgoing" });
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
    return { owedToMe, iOwe, myBalances, myExpenses, totalExpenses };
  }, [balance, myUserId, groupBills, myGroupMemberObjectId]);

  // Fetch balance from server
  const refreshBalance = async () => {
    try {
      const { data: balanceData } = await api.get(`/balances/group/${groupId}`);
      setBalance(balanceData.groupBalances ?? []);
    } catch (err) {
      console.error("Failed to refresh balance:", err);
      setBalance([]);
    }
  };

  // Fetch group and bill data, then structure by date
  const fetchData = async () => {
    try {
      const [{ data: groupData }, { data: billsData }] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/bills/group/${groupId}`),
      ]);

      setGroup(groupData);
      setGroupBills(billsData);
      await refreshBalance();

      billsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      const grouped = {};
      billsData
        .forEach((bill) => {
          const dateKey = dayjs(bill.date).format("YYYY-MM-DD");
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(bill);
        });

      const sortedGrouped = Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a))
        .reduce((obj, key) => {
          obj[key] = grouped[key];
          return obj;
        }, {});

      setBills(sortedGrouped);

    } catch (err) {
      console.error("Failed to fetch group or bills:", err);
      setError("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const { data: balanceData } = await api.get(`/balances/group/${groupId}`);

        setBalance(balanceData.groupBalances ?? []);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalance([]);
      }
    }

    // Load balance when switching to balance tab
    if (activeTab === "balance") {
      fetchBalance();
    }
  }, [activeTab, groupId]);


  if (loading) return <p>Loading expenses...</p>;
  if (error) return <p>{error}</p>;

  // Navigation handlers
  const handleGroupClick = () => {
    navigate(`/groups/${groupId}`);
  };

  const handleAddExpenseClick = () => {
    navigate(`/groups/${groupId}/creatBill`);
  };

  const groupIconUrl = group?.iconUrl
    ? (group.iconUrl.startsWith("http") ? group.iconUrl : `${BASE_URL}/${group.iconUrl}`)
    : DEFAULT_ICON;

  // Filter out members who have balanced debts
  const filteredGroupMembers = group?.members?.filter(member => {
    const memberId = member._id?.toString();
    if (!memberId || memberId === myGroupMemberObjectId) return false;

    const unfinished = balance.filter(b => !b.isFinished);
    const incoming = unfinished.filter(b => b.toMemberId?.toString() === memberId);
    const outgoing = unfinished.filter(b => b.fromMemberId?.toString() === memberId);
    const totalOwedTo = incoming.reduce((sum, b) => sum + b.balance, 0);
    const totalOwe = outgoing.reduce((sum, b) => sum + b.balance, 0);

    return totalOwedTo !== totalOwe;
  });

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}> 
          <div className={styles.groupIconWrapper}>
            <span className={styles.backButton} onClick={() => navigate("/")}>
              {"<"}
            </span>
            <div className={styles.groupIconContainer}>
              <img
                src={groupIconUrl}
                alt="Group Icon"
                className={styles.groupIcon}
                onClick={handleGroupClick}
              />
            </div>
            <div className={styles.groupName}>{group?.groupName}</div>
          </div>
        </div>

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === "expenses" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("expenses")}
          >
            Expense
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "balance" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("balance")}
          >
            Balance
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "summary" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
        </div>

        {activeTab === "expenses" && (
          <div className={styles.expensesHeader}>
            <div className={styles.expensesHeaderRow}>
              <span>My Expenses</span>
              <span>Total Expenses</span>
            </div>
            <div className={styles.expensesAmountRow}>
              <span>${myExpenses.toFixed(2)}</span>
              <span data-testid="total-balance-amount">${totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className={styles.scrollArea}>
          {activeTab === "expenses" ? (
            Object.keys(bills).length === 0 ? (
              <p className={styles.emptyMessage}>No expenses found.</p>
            ) : (
              <>
                {Object.entries(bills).map(([date, billList]) => (
                  <div key={date} className={styles.billGroup}>
                    <h4 className={styles.billDateTitle}>
                      {dayjs(date).format("MMM D, YYYY")}
                    </h4>
                    <div className={styles.billListContainer}>
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

                            <div className={styles.billContent}>
                              <div className={styles.billTextRow}>
                                <span className={styles.billNote}>{bill.note}</span>
                                <span className={styles.billAmount} data-testid="bill-amount">${(bill.expenses - bill.refunds).toFixed(2)}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </>
            )
          ) : activeTab === "balance" ? (
            <>
              <div className={styles.memberNameRow}>
                {owedToMe > 0 ? (
                  <>
                    <span className={`${styles.memberNameLeft} ${styles.greenText}`}>
                      You are owed
                    </span>
                    <span className={`${styles.memberNameRight} ${styles.greenText}`}>
                      ${owedToMe.toFixed(2)}
                    </span>
                  </>
                ) : iOwe > 0 ? (
                  <>
                    <span className={`${styles.memberNameLeft} ${styles.redText}`}>
                      You owe
                    </span>
                    <span className={`${styles.memberNameRight} ${styles.redText}`}>
                      ${iOwe.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <div className={styles.rowLayout}>
                    <span className={styles.memberNameLeft}>No balances</span>
                    <span className={styles.memberNameRight}>$0.00</span>
                  </div>
                )}
              </div>

              {myBalances.length === 0 ? (
                <p className={styles.emptyMessage}>No balances to show.</p>
              ) : (
                <ul className={styles.memberList}>
                  {myBalances.map((b, index) => {
                    const isIncoming = b.direction === "incoming";
                    const otherId = isIncoming ? b.fromMemberId : b.toMemberId;
                    const other = group?.members?.find(m => m._id?.toString() === otherId?.toString());

                    return (
                      <li key={b._id}>
                        {expandedBalanceId === b._id && expandedSource === "mine" ? (
                          <div className={`${styles.balanceDetailBox} ${confirmMarkPaidId === b._id ? styles.confirming : ""}`}>
                            <div className={styles.balanceLineTop}>
                              <span className={styles.balanceTopText}>
                                {isIncoming
                                  ? `${other?.userName || "Someone"} owes ${currentUser.userName} (me)`
                                  : `${currentUser.userName} (me) owes ${other?.userName || "Someone"}`}
                              </span>
                              <button
                                className={styles.balanceCloseBtn}
                                onClick={() => setExpandedBalanceId(null)}
                              >
                                x
                              </button>
                            </div>

                            <div className={styles.balanceLineBottom}>
                              <p className={styles.balanceAmount}>${b.balance.toFixed(2)}</p>
                              <button
                                className={styles.markPaidText}
                                onClick={() => setConfirmMarkPaidId(b._id)}
                              >
                                Mark as paid
                              </button>
                            </div>

                            {confirmMarkPaidId === b._id && (
                              <div className={styles.confirmRow}>
                                <span className={styles.confirmText}>
                                  A transfer will be added to group expense.
                                </span>
                                <button
                                  className={styles.okButton}
                                  onClick={() => handleConfirmMarkAsPaid(b)}
                                >
                                  Okay
                                </button>
                                <button
                                  className={styles.cancelButton}
                                  onClick={() => setConfirmMarkPaidId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                      
                          <div
                            className={styles.memberItem}
                            data-testid="balance-item"
                            onClick={() => {
                              if (expandedBalanceId === b._id && expandedSource === "mine") {
                                setExpandedBalanceId(null);
                                setExpandedSource(null);
                                setConfirmMarkPaidId(null);
                              } else {
                                setExpandedBalanceId(b._id);
                                setExpandedSource("mine");
                                setConfirmMarkPaidId(null);
                              }                          
                            }}
                          >
                            <span>{isIncoming ? other?.userName || "Someone" : `You owe ${other?.userName || "Someone"}`}</span>
                            <span className={isIncoming ? styles.greenText : styles.redText}>
                              ${b.balance.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className={styles.memberSection}>
                <div className={styles.groupBalanceTitle}>Group Members Balance</div>
                {filteredGroupMembers.length > 0 ? (
                  filteredGroupMembers.map(member => {
                    const memberId = member._id?.toString();

                    if (!memberId) return null;

                    if (memberId === myGroupMemberObjectId) return null;

                    const unfinished = balance.filter(b => !b.isFinished);

                    const incoming = unfinished.filter(b => b.toMemberId?.toString() === memberId);
                    const outgoing = unfinished.filter(b => b.fromMemberId?.toString() === memberId);

                    const totalOwedTo = incoming.reduce((sum, b) => sum + b.balance, 0);
                    const totalOwe = outgoing.reduce((sum, b) => sum + b.balance, 0);

                    const isOwed = totalOwedTo > totalOwe;
                    const total = isOwed ? totalOwedTo - totalOwe : totalOwe - totalOwedTo;

                    if (total === 0) return null;

                    const allRelated = unfinished.filter(b =>
                      (isOwed && b.toMemberId?.toString() === memberId) ||
                      (!isOwed && b.fromMemberId?.toString() === memberId)
                    );
                    const uniqueKeys = new Set();
                    const relatedBalances = allRelated.filter((b) => {
                      const displayKey = [b.fromMemberId, b.toMemberId].sort().join("--");
                      if (uniqueKeys.has(displayKey)) return false;
                      uniqueKeys.add(displayKey);
                      return true;
                    });

                    return (
                      <div key={member._id} className={styles.memberBlock}>
                        <div className={styles.memberNameRow}>
                          <span className={styles.memberNameLeft}>
                            {isOwed ? `${member.userName} are owed` : `${member.userName} owes`}
                          </span>
                          <span className={isOwed ? styles.greenText : styles.redText}>
                            ${total.toFixed(2)}
                          </span>
                        </div>
                        <ul className={styles.memberList}>
                          {relatedBalances.map((b, index) => {
                            const otherId = isOwed ? b.fromMemberId : b.toMemberId;
                            const otherUser = group.members.find(m => m._id?.toString() === otherId?.toString());
                            if (!otherUser) return null;
                            const expandKey = b._id;

                            return (
                              <li key={expandKey}>
                                {expandedBalanceId === expandKey && expandedSource === "group" ? (
                                  <div className={`${styles.balanceDetailBox} ${confirmMarkPaidId === b._id ? styles.confirming : ""}`}>
                                    <div className={styles.balanceLineTop}>
                                      <span>
                                        {isOwed
                                          ? `${otherUser.userName} owes ${member.userName}`
                                          : `${member.userName} owes ${otherUser.userName}`}
                                      </span>
                                      <button
                                        className={styles.balanceCloseBtn}
                                        onClick={() => setExpandedBalanceId(null)}
                                      >
                                        x
                                      </button>
                                    </div>

                                    <div className={styles.balanceLineBottom}>
                                      <p className={styles.balanceAmount}>${b.balance.toFixed(2)}</p>
                                      <button
                                        className={styles.markPaidText}
                                        onClick={() => setConfirmMarkPaidId(b._id)}
                                      >
                                        Mark as paid
                                      </button>
                                    </div>
                          
                                    {confirmMarkPaidId === b._id && (
                                      <div className={styles.confirmRow}>
                                        <span className={styles.confirmText}>
                                          A transfer will be added to group expense.
                                        </span>
                                        <button
                                          className={styles.okButton}
                                          onClick={() => handleConfirmMarkAsPaid(b)}
                                        >
                                          Okay
                                        </button>
                                        <button
                                          className={styles.cancelButton}
                                          onClick={() => setConfirmMarkPaidId(null)}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className={styles.memberItem}
                                    data-testid="balance-item"
                                    onClick={() => {
                                      if (expandedBalanceId === expandKey && expandedSource === "group") {
                                        setExpandedBalanceId(null);
                                        setExpandedSource(null);
                                        setConfirmMarkPaidId(null);
                                      } else {
                                        setExpandedBalanceId(expandKey);
                                        setExpandedSource("group");
                                        setConfirmMarkPaidId(null);
                                      }
                                    }}
                                  >
                                    <span>{otherUser.userName}</span>
                                    <span>${b.balance.toFixed(2)}</span>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.emptyMessage}>No group member balances to show.</p>
                )}
              </div>
            </>
          ) : (
            // Summary tab content
            <GroupSummary
              groupId={groupId}
              group={group}
              groupIconUrl={groupIconUrl}
            />
          )}
        </div>

        <div className={styles.fabContainer}>
          <button className={styles.fab} onClick={handleAddExpenseClick}>
            +
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}