import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/NewBillPage.module.css";
import api from "../utils/api";
import MobileFrame from "../components/MobileFrame";
// import { set } from "mongoose";



export default function NewBillPage() {
  const { groupId } = useParams(); // 获取 groupId
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState("");
  const [refund, setRefund] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));

  const [selectedLabelId, setSelectedLabelId] = useState("");



  const [labels, setLabels] = useState([]);
  const [members, setMembers] = useState(""); 
  const [category, setCategory] = useState(""); 


  const [splitMethod, setSplitMethod] = useState("equally"); // "equally" 或 "amounts"



  // get all labels
  useEffect(() => {
    api.get("/bills/allLabels").then(({ data }) => {
      setLabels(data);
    }).catch(err => {
      console.error("Failed to fetch labels:", err);
    });
  }, []);
  

  // get group members
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        setGroup(data);
        setMembers(data.members);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL]);

  console.log("group", group);
  console.log("members", members);


  // submit bill
  const handleSubmit = (e) => {
    e.preventDefault();
    const newBill = {
      groupId,
      category,
      note,
      paid: parseFloat(paid),
      refund: parseFloat(refund),
      paidBy,
      paidDate,
      members: members.map((m) => ({ name: m.name || m.userName }))
    };
    // 提交 API
    api.post(`/groups/${groupId}/bills`, newBill)
      .then(() => navigate(`/groups/${groupId}`))
      .catch((err) => console.error("Failed to create bill:", err));
  };

  return (
    <MobileFrame>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.header}>
        <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}`)}>
            {"<"}
        </span>
        <p >Add Expense</p>

        <span>📷</span>
        </h2>

        <div className={styles.rowName}>
            <p>Category</p>
            <p>Note</p>
        </div>

        <div className={styles.row1}>

        <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
          >
            {labels.map(label => (
            <option key={label._id} value={label.name}>
              {label.type}
            </option>
          ))}
          </select>

          <span></span>
          <input
            type="text"
            placeholder="e.g. Shared taxi to airport"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={styles.inputHalf}
          />
        </div>

        <div className={styles.rowName}>
            <p>Paid</p>
            <p>Refund</p>
        </div>
        <div className={styles.row2}>
          <input
            type="number"
            placeholder="$ 0.00"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className={styles.inputHalf}
          />
         
          <input
            type="number"
            placeholder="$ 0.00"
            value={refund}
            onChange={(e) => setRefund(e.target.value)}
            className={styles.inputHalf}
          />
        </div>

        <div className={styles.rowName}>
            <p>Paid By</p>
            <p>Paid Date</p>
        </div>
        <div className={styles.row3}>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className={styles.select}
          >
            {(members || []).map((m) => (
              <option key={m._id} value={m.userName}>
                {m.userName}
              </option>
            ))}
          </select>
          <span></span>
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.rowName}>
        <label htmlFor="splitMethod" >Split Method</label>
            <select
                id="splitMethod"
                value={splitMethod}
                onChange={(e) => setSplitMethod(e.target.value)}
                className={styles.select}
            >
                <option value="equally">Split Equally</option>
                <option value="amounts">Split by Amounts</option>
            </select>
        </div>

        <div className={styles.splitBox}>
          <ul className={styles.memberList}>
            {(members || []).map((m, i) => (
              <li key={i} className={styles.memberItem}>
                {m.name || m.userName}
              </li>
            ))}
          </ul>
        </div>

        <button type="submit" className={styles.addButton}>
          Add
        </button>
      </form>
    </MobileFrame>
  );
}
