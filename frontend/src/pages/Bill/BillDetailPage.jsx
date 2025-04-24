import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../styles/Bill/BillDetailPage.module.css";
import api from "../../utils/api";
import MobileFrame from "../../components/MobileFrame";

export default function BillDetailPage() {
    const { groupId, billId } = useParams(); 
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
  
    useEffect(() => {
      api.get(`/bills/${groupId}/bill/${billId}`).then(({ data }) => {
        setBill(data);
      }).catch(err => {
        console.error("Failed to fetch bill:", err);
      });
    }, [groupId, billId]);
  
    if (!bill) {
      return <div>Loading...</div>; 
    }
  
    return (
      <MobileFrame>
        <h2 className={styles.header}>
          <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}/expenses`)}>
            {"<"}
          </span>
          <p>Expense</p>
        </h2>
  
        <h2 className={styles.title}>{bill.note || "Untitled Bill"}</h2>
  
        <div className={styles.section}>
          <div className={styles.label}>Paid by</div>
          <div className={styles.row}>
            <span>{bill.paidBy}</span>
            <span>${bill.expenses.toFixed(2)}</span>
          </div>
        </div>
  
        <div className={styles.section}>
          <div className={styles.label}>Split by</div>
          {(bill.members || []).map((member, index) => (
            <div key={index} className={styles.row}>
              <span>{member.memberId}</span>
              <span>${(member.expense || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
  
        <div className={styles.actions}>
          <button className={styles.deleteButton}>Delete</button>
          <button className={styles.editButton} onClick={() => navigate(`/groups/${groupId}/editBill/${billId}`)}>
            Edit
            </button>
        </div>
      </MobileFrame>
    );
  }
  