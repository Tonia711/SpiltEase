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
    const [showConfirm, setShowConfirm] = useState(false); // 新增：控制确认弹窗

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

    const handleClickDelete = (e) => {
      e.preventDefault();
      setShowConfirm(true); // 显示确认弹窗
    };
  
    const handleConfirmDelete = async () => {
      try {
        navigate(`/groups/${groupId}/expenses`);
        await api.delete(`/bills/${groupId}/bill/${billId}`);
      } catch (err) {
        console.error("Failed to delete bill:", err);
      }
    };
  
    const handleCancelDelete = () => {
      setShowConfirm(false); // 取消删除
    };
  
    
    return (
      <MobileFrame>
        <form className={styles.form} >
          <h2 className={styles.header}>
          <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}/expenses`)}>
              {"<"}
          </span>
          <div className={styles.titleup}>
            <img 
              src={`${IMG_URL}/${labels.find(label => label._id === bill.labelId).iconUrl}`}
              className={styles.billIcon}
            ></img>
            <p>{bill.note || "Untitled Bill"}</p>
          </div>
          <span></span>
          </h2>

          <div className={styles.rowName}>
              <p>Paid by</p>
              <p>Amounts</p>
          </div>
  
          <div className={styles.row1}>
            <span>{bill.paidByName}</span>
            <span>${bill.expenses.toFixed(2)}</span>
          </div>

          <div className={styles.row1}>
            <span>Refund</span>
            <span>${bill.refunds.toFixed(2)}</span>
          </div>

          <div className={styles.row1}>
            <span>Date</span>
            <span>{bill.date ? bill.date.slice(0, 10) : ''}</span>
          </div>



          <div className={styles.rowName}>
              <p>Split by</p>
              <p>Amounts</p>
          </div>
    
          <div>
            {(bill.members || []).map((member, index) => (
              <div key={index} className={styles.row}>
                <span>{member.userName}</span>
                <span>${((member.expense - member.refund) || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
    
          <div >
            {!showConfirm ? (
              <div className={styles.actions}>
                <button className={styles.deleteButton} onClick={handleClickDelete}>Delete</button>
                <span></span>
                <button className={styles.editButton} onClick={() => navigate(`/groups/${groupId}/editBill/${billId}`)}>
                  Edit
                </button>
              </div>
            ) : (
              <div className={styles.confirmBox}>
                <p>Are you sure you want to delete this expense?</p>
                <div className={styles.confirmButtons}>
                  <button className={styles.confirmDelete} onClick={handleConfirmDelete}>Delete</button>
                  <button className={styles.confirmCancel} onClick={handleCancelDelete}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </form>
      </MobileFrame>
    );
  }
  