import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../styles/Bill/EditBillPage.module.css";
import api from "../../utils/api";
import MobileFrame from "../../components/MobileFrame";
 

export default function EditBillPage() {
  const { groupId, billId } = useParams();  // 获取 groupId
  const navigate = useNavigate();


  // 界面展示的数据
  const [bill, setBill] = useState();  
  const [labels, setLabels] = useState([]);  // labels
  const [group, setGroup] = useState(null); //group 数据
  const [members, setMembers] = useState(""); //下拉列表，成员列表
  const [splitMethod, setSplitMethod] = useState("Equally"); // 如何分钱的下拉列表："Equally" 或 "As Amounts"


  // 表单数据
  const [selectedLabelId, setSelectedLabelId] = useState();   // 选择的label
  const [note, setNote] = useState("");     //note
  const [expenses, setExpenses] = useState("");   //paid 总钱数
  const [refunds, setRefunds] = useState("");   //refunds
  const [paidBy, setPaidBy] = useState(""); // paidBy  member_id
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [memberTotalExpenses, setMemberTotalExpenses] = useState([]);  //每个人最终应付的钱 array
  const [selectedMemberIds, setSelectedMemberIds] = useState([]); //选中要分钱的人
  const [memberExpenses, setMemberExpenses] = useState([]);  //每个人实际的expense array
  const [memberRefunds, setMemberRefunds] = useState([]); //每个人的refund array
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);




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
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL]);

  // console.log("group", group);
  // console.log("members", members);

  useEffect(() => {
    if (members && members.length > 0) {
      setSelectedMemberIds(members.map(m => m._id));
    }
  }, [members]);
  



  // 通过获取bill的数据来获取界面显示的数据
  useEffect(() => {
    api
      .get(`/bills/${groupId}/bill/${billId}`)
      .then(({ data }) => {
        setBill(data);
        setSelectedLabelId(data.labelId);
        setNote(data.note);
        setExpenses(data.expenses);
        setRefunds(data.refunds);
        setPaidDate(data.date.slice(0, 10));
        setSplitMethod(data.splitWay);
        setPaidBy(data.paidBy);
        setSelectedMemberIds(data.members.map(m => m.memberId));
        setMemberExpenses(data.members.map(m => ({
          memberId: m.memberId,
          amount: m.expense
        })));
        setMemberRefunds(data.members.map(m => ({
          memberId: m.memberId,
          refund: m.refund
        })));
        setMemberTotalExpenses(data.members.map(m => ({
          memberId: m.memberId,
          amount: parseFloat(m.expense.toFixed(2))
        })));
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL]);

  
  useEffect(() => {
    if (members && members.length > 0 && bill) {
      setPaidBy(bill.paidBy);
  
      const exist = members.some(m => m._id === bill.paidBy);
      if (!exist) {
        setMembers(prev => [...prev, { _id: bill.paidBy, userName: "Unknown User" }]);
      }
    }
  }, [members, bill]);
  
  console.log("bill", bill);
  console.log("paidBy", paidBy);

  
  //通过输入的expense, refunds来计算每个人分的钱
  useEffect(() => {
    if (!isEditing) return; 

    if (!members || members.length === 0 || !expenses || isNaN(parseFloat(expenses))) return;

    const total = parseFloat(expenses);
    const refundTotal = parseFloat(refunds || 0);
    const filtered = members.filter(m => selectedMemberIds.includes(m._id));
    const count = filtered.length;

    if (count === 0) {
      setMemberExpenses([]);
      setMemberRefunds([]);
      setMemberTotalExpenses([]);
      return;
    }

    const rawExpense = parseFloat((total / count).toFixed(2));       // 未减 refund 的金额
    const avgRefund = parseFloat((refundTotal / count).toFixed(2));  // 每人退款
    const finalAmount = parseFloat((rawExpense - avgRefund).toFixed(2)); // 实际应付

    const expensesArray = filtered.map(m => ({
      memberId: m._id,
      amount: rawExpense
    }));

    const refundsArray = filtered.map(m => ({
      memberId: m._id,
      refund: avgRefund
    }));

    const totalArray = filtered.map(m => ({
      memberId: m._id,
      amount: finalAmount
    }));

    if (splitMethod === "Equally") {
      setMemberExpenses(expensesArray);         // 原始 expense
      setMemberRefunds(refundsArray);           // refund 分摊
      setMemberTotalExpenses(totalArray);       // 实际应付金额
    }

    if (splitMethod === "amounts" && memberTotalExpenses.length === 0) {
      setMemberExpenses(expensesArray);
      setMemberRefunds(refundsArray);
      setMemberTotalExpenses(totalArray);
    }
  }, [expenses, refunds, splitMethod, members, selectedMemberIds]);



  // submit bill
  const handleSaveBill = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!selectedLabelId || !note || !expenses || !paidBy || !paidDate || memberTotalExpenses.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }
  
    const updatedBill = {
      labelId: selectedLabelId,
      date: paidDate,
      note,
      paidBy,
      expenses: parseFloat(expenses),
      refunds: parseFloat(refunds),
      splitWay: splitMethod,
      members: memberTotalExpenses.map(m => ({
        memberId: m.memberId,
        expense: m.amount,
        refund: memberRefunds.find(r => r.memberId === m.memberId)?.refund || 0
      }))
    };
    
  
    try {
      await api.put(`/bills/${groupId}/bill/${billId}`, updatedBill);
      navigate(`/groups/${groupId}/expenses/${billId}`);
    } catch (err) {
      console.error("Failed to update bill:", err);
      setError("Failed to update bill. Please try again.");
    }
  };
  
  function handleChangeCheckBox(e, m) {
    const checked = e.target.checked;
    let newSelected;
    
    if (checked) {
      newSelected = [...selectedMemberIds, m._id];
    } else {
      newSelected = selectedMemberIds.filter(id => id !== m._id);
    }
    setSelectedMemberIds(newSelected);
  
    if (splitMethod === "Equally") {
      const total = parseFloat(expenses) || 0;
      const refundTotal = parseFloat(refunds) || 0;
      const count = newSelected.length;
  
      if (count > 0) {
        const rawExpense = parseFloat((total / count).toFixed(2));
        const avgRefund = parseFloat((refundTotal / count).toFixed(2));
        const finalAmount = parseFloat((rawExpense - avgRefund).toFixed(2));
  
        setMemberExpenses(newSelected.map(id => ({
          memberId: id,
          amount: rawExpense
        })));
  
        setMemberRefunds(newSelected.map(id => ({
          memberId: id,
          refund: avgRefund
        })));
  
        setMemberTotalExpenses(newSelected.map(id => ({
          memberId: id,
          amount: finalAmount
        })));
      } else {
        setMemberExpenses([]);
        setMemberRefunds([]);
        setMemberTotalExpenses([]);
      }
    } else {
      if (!checked) {
        // As Amounts 模式下，去掉取消的人
        setMemberTotalExpenses(prev => prev.filter(me => me.memberId !== m._id));
      }
    }
  }
  
  
  function handleChangeAmount(e, m) {
    const newAmount = parseFloat(e.target.value) || 0;
    setMemberTotalExpenses(prev => {
      const exists = prev.find(p => p.memberId === m._id);
      if (exists) {
        return prev.map(p => p.memberId === m._id ? { ...p, amount: newAmount } : p);
      } else {
        return [...prev, { memberId: m._id, amount: newAmount }];
      }
    });
  
    // 同时更新 refund
    const newSelected = [...selectedMemberIds];
    const refundTotal = parseFloat(refunds) || 0;
    const count = newSelected.length;
    const avgRefund = count > 0 ? parseFloat((refundTotal / count).toFixed(2)) : 0;
    setMemberRefunds(newSelected.map(id => ({
      memberId: id,
      refund: avgRefund
    })));
  }
  



  return (
    <MobileFrame>
      <form className={styles.form} onSubmit={handleSaveBill}>
        <h2 className={styles.header}>
        <span className={styles.backButton} onClick={() => navigate(`/groups/${groupId}/expenses/${billId}`)}>
            {"<"}
        </span>
        <p >Edit Expense</p>

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
            onChange={(e) => {
                setExpenses(e.target.value);
                setIsEditing(true);}}
            className={styles.inputHalf}
          />
         
          <input
            type="number"
            placeholder="$ 0.00"
            value={refunds}
            onChange={(e) => {
              setRefunds(e.target.value);
              setIsEditing(true);
            }}
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
                onChange={(e) => {
                  setSplitMethod(e.target.value);
                  setIsEditing(true);
                }}
                className={styles.select}
            >
                <option value="Equally">Equally</option>
                <option value="As Amounts">As Amounts</option>
            </select>
        </div>

        <div className={styles.splitBox}>
        <ul className={styles.memberList}>
          {(members || []).map((m, i) => {
            const checked = selectedMemberIds.includes(m._id);
            const current = memberTotalExpenses.find(me => me.memberId === m._id) || { amount: 0 };

            return (
              <li key={m._id} className={styles.memberListItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {handleChangeCheckBox(e, m)}}
                  className={styles.memberIcon}
                />
                <div className={styles.memberItem}>
                  <div className={styles.memberName}>{m.userName}</div>

                  <div>
                    {splitMethod === "As Amounts" ? (
                      <input
                        type="number"
                        value={current.amount}
                        onChange={(e) => {handleChangeAmount(e, m)}}
                        className={styles.inputAmount}
                        disabled={!checked}
                      />
                    ) : (
                      <span>{current.amount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </div>

        <div className={styles.rowSummary}>
          <div>
            <strong>Total split:</strong> $
            {memberTotalExpenses.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
          </div>
          <div>
            <strong>Difference:</strong> $
            {(parseFloat(expenses || 0) - memberTotalExpenses.reduce((sum, m) => sum + m.amount, 0) - refunds).toFixed(2)}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.addButton}>
          Save
        </button>
      </form>
    </MobileFrame>
  );
}
