import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../styles/Bill/BillDetailPage.module.css";
import api from "../../utils/api";
import MobileFrame from "../../components/MobileFrame";

export default function BillDetailPage() {
    const { groupId, billId } = useParams(); 
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [labels, setLabels] = useState([]);  // labels

    const IMG_URL = import.meta.env.VITE_AVATAR_BASE_URL;


    // get all labels 获取所有labels，labcel下拉列表
    useEffect(() => {
      api.get("/bills/allLabels").then(({ data }) => {
        setLabels(data);
      }).catch(err => {
        console.error("Failed to fetch labels:", err);
      });
    }, []);


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

      
    console.log("bill", bill);
  
    console.log("labels", labels);
    
    return (
      <MobileFrame>
        <form className={styles.form} >
          <h2 className={styles.header}>
          <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}/expenses`)}>
              {"<"}
          </span>
          <div>
            <img 
              src={`${IMG_URL}/${labels.find(label => label._id === bill.labelId).iconUrl}`}
              className={styles.billIcon}
            ></img>
            <p>{bill.note || "Untitled Bill"}</p>
          </div>
          </h2>

          <div className={styles.rowName}>
              <p>Paid by</p>
              <p>Amounts</p>
          </div>
  
          <div className={styles.row1}>
            <span>{bill.paidBy}</span>
            <span>${bill.expenses.toFixed(2)}</span>
          </div>

          <div className={styles.rowName}>
              <p>Split by</p>
              <p>Amounts</p>
          </div>
    
          <div className={styles.section}>
          
            {(bill.members || []).map((member, index) => (
              <div key={index} className={styles.row}>
                <span>{member.userName}</span>
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
        </form>
      </MobileFrame>
    );
  }
  