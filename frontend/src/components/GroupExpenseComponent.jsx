import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import styles from "../styles/GroupExpensePage.module.css";

// Converted from page to component that receives groupId as prop
export default function GroupExpenseComponent({ groupId }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: billsData } = await api.get(`/bills/group/${groupId}`);
        console.log("Fetched bills:", billsData);
        console.log("Current groupId:", groupId);
        setBills(billsData);
      } catch (err) {
        console.error("Failed to fetch bills:", err);
        setError("Failed to load expenses.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [groupId]);

  if (loading) return <p>Loading expenses...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const handleAddExpenseClick = () => {
    navigate(`/groups/${groupId}/creatBill`);
  };

  return (
    <div className={styles.expenseContainer}>
      <div className={styles.scrollContent}>
        {!bills || bills.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          <ul className={styles.billsList}>
            {bills.map((bill) => (
              <li key={bill._id} className={styles.billItem}>
                {bill.label?.iconUrl && (
                  <img
                    src={`${BASE_URL}/${bill.label.iconUrl}`}
                    alt={bill.label.type}
                    className={styles.billIcon}
                  />
                )}
                <div className={styles.billDetails}>
                  <div className={styles.billName}>{bill.label?.type || "Unnamed Expense"}</div>
                  <div className={styles.billAmount}>💰 Amount: ${bill.expenses ?? "N/A"}</div>
                  <div className={styles.billDate}>📅 Date: {bill.date ? new Date(bill.date).toLocaleDateString() : "N/A"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className={styles.fabContainer}>
        <button
          className={styles.fab}
          onClick={handleAddExpenseClick}
        >
          +
        </button>
        <div className={styles.fabLabel}>Add Expense</div>
      </div>
    </div>
  );
}