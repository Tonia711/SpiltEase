import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../styles/Bill/NewBillPage.module.css";
import api from "../../utils/api";
import MobileFrame from "../../components/MobileFrame";
import { set } from "mongoose";
// import { set } from "mongoose";



export default function NewBillPage() {
  const { groupId } = useParams(); // 获取 groupId
  const navigate = useNavigate();


  // 界面展示的数据
  const [labels, setLabels] = useState([]);  // labels
  const [group, setGroup] = useState(null); //group 数据
  const [members, setMembers] = useState(""); //通过获取group的数据来获取成员
  const [splitMethod, setSplitMethod] = useState("equally"); // 如何分钱的下拉列表："equally" 或 "amounts"
  const [paidAmount, setPaidAmount] = useState([]); // 通过获取bill的数据来获取每个人应付的钱



  // 表单数据
  const [selectedLabelId, setSelectedLabelId] = useState();   // 选择的label
  const [note, setNote] = useState("");  
  const [expenses, setExpenses] = useState("");   //paid
  const [refunds, setRefunds] = useState("");
  const [paidBy, setPaidBy] = useState(""); // paidBy 下拉列表，成员列表
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [chancgedPaidAmount, setchancgedPaidAmount] = useState(0); // 修改后每个人应付的钱



  // get all labels 获取所有labels，labcel下拉列表
  useEffect(() => {
    api.get("/bills/allLabels").then(({ data }) => {
      setLabels(data);
      setSelectedLabelId(data[0]?._id || ""); // 设置默认的 selectedLabelId
    }).catch(err => {
      console.error("Failed to fetch labels:", err);
    });
  }, []);
  

  // get group members 通过获取group的数据来获取成员
  // paidBy 下拉列表，成员列表
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const IMG_URL = import.meta.env.VITE_AVATAR_BASE_URL;

  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        setGroup(data);
        setMembers(data.members);
        setPaidBy(data.members[0]?._id || ""); // 设置默认的 paidBy
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL]);

  // console.log("group", group);
  // console.log("members", members);



  // 通过获取bill的数据来获取每个人应付的钱
  useEffect(() => {
    api
      .get(`/bills/groups/${groupId}`)
      .then(({ data }) => {
        setPaidAmount(data);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL]);

  // console.log("paidAmount", paidAmount);







  // submit bill
  const handleAddBill = (e) => {
    e.preventDefault();
    const newBill = {
      groupId,
      selectedLabelId,
      note,
      expenses: parseFloat(expenses),
      refunds: parseFloat(refunds),
      paidBy,
      paidDate,
      members: members.map((m) => ({ name: m.name || m.userName }))
    };
    // 提交 API
    api.post(`/groups/${groupId}/bills`, newBill)
      .then(() => navigate(`/groups/${groupId}`))
      .catch((err) => console.error("Failed to create bill:", err));
  };

  console.log("-------------------");
  console.log("labels", labels);
  console.log("selectedLabelId", selectedLabelId);
  console.log("note", note);
  console.log("expenses", expenses);    
  console.log("refunds", refunds);
  console.log("paidBy", paidBy);
  console.log("paidDate", paidDate);
  console.log("splitMethod", splitMethod);


  return (
    <MobileFrame>
      <form className={styles.form} onSubmit={handleAddBill}>
        <h2 className={styles.header}>
        <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}/expenses`)}>
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
          <img
            src={`${IMG_URL}/${labels.find(label => label._id === selectedLabelId)?.iconUrl}`}
            alt={labels.find(label => label._id === selectedLabelId)?.type || "label icon"}
            className={styles.labelIcon}
          />

          <select
            value={selectedLabelId}
            onChange={(e) => setSelectedLabelId(e.target.value)}
            className={styles.select}
          >
            {labels.map(label => (
              <option key={label._id} value={label._id}>
                {label.type}
              </option>
            ))}
          </select>

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
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className={styles.inputHalf}
          />
         
          <input
            type="number"
            placeholder="$ 0.00"
            value={refunds}
            onChange={(e) => setRefunds(e.target.value)}
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
              <option key={m._id} value={m._id}>
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
                {m.userName}

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
