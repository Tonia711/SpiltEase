import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../../styles/Bill/NewBillPage.module.css";
import api from "../../utils/api";
import MobileFrame from "../../components/MobileFrame";
import CameraCapture from "../../components/CameraCapture";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export default function NewBillPage() {
  const { groupId } = useParams(); // groupId
  const navigate = useNavigate();

  // Camera and OCR states
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // data
  const [labels, setLabels] = useState([]); // labels
  const [members, setMembers] = useState(""); // members
  const [splitMethod, setSplitMethod] = useState("Equally"); //"equally" or "As Amounts"

  // form data
  const [selectedLabelId, setSelectedLabelId] = useState(); // selected label
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState(0); //paid
  const [refunds, setRefunds] = useState(0); //refunds
  const [paidBy, setPaidBy] = useState(""); // paidBy
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [memberTotalExpenses, setMemberTotalExpenses] = useState([]); //should pay array
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberExpenses, setMemberExpenses] = useState([]); //expense array
  const [memberRefunds, setMemberRefunds] = useState([]); //refund array
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(""); // New state for warning messages

  // get labels except transfer
  useEffect(() => {
    api
      .get("/bills/labelsExcTrans")
      .then(({ data }) => {
        setLabels(data);
        setSelectedLabelId(data[0]?._id || "");
      })
      .catch((err) => {
        console.error("Failed to fetch labels:", err);
      });
  }, []);

  // get group members
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const IMG_URL = import.meta.env.VITE_AVATAR_BASE_URL;
  const user = useContext(AuthContext);

  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        const visibleMembers = data.members.filter((m) => m.isHidden === false);
        setMembers(visibleMembers);

        // paidBy
        const defaultPaidBy = visibleMembers.find(
          (m) => m.userId === user.user._id
        )?._id;
        setPaidBy(defaultPaidBy || visibleMembers[0]?._id || "");
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
      });
  }, [groupId, BASE_URL, user]);

  useEffect(() => {
    if (members && members.length > 0) {
      setSelectedMemberIds(members.map((m) => m._id));
    }
  }, [members]);

  //calculate member expenses
  useEffect(() => {
    if (
      !members ||
      members.length === 0 ||
      !expenses ||
      isNaN(parseFloat(expenses))
    )
      return;

    const total = parseFloat(expenses);
    const refundTotal = parseFloat(refunds || 0);
    const filtered = members.filter((m) => selectedMemberIds.includes(m._id));
    const count = filtered.length;

    if (count === 0) {
      setMemberExpenses([]);
      setMemberRefunds([]);
      setMemberTotalExpenses([]);
      return;
    }

    //randomly distribute the leftover
    const rawExpense = parseFloat((total / count).toFixed(2));
    const avgRefund = parseFloat((refundTotal / count).toFixed(2));

    const expenseDistributed = parseFloat((rawExpense * count).toFixed(2));
    const refundDistributed = parseFloat((avgRefund * count).toFixed(2));
    const expenseLeftover = parseFloat((total - expenseDistributed).toFixed(2));
    const refundLeftover = parseFloat(
      (refundTotal - refundDistributed).toFixed(2)
    );

    const expenseRandomIndex =
      expenseLeftover !== 0 ? Math.floor(Math.random() * count) : -1;
    const refundRandomIndex =
      refundLeftover !== 0 ? Math.floor(Math.random() * count) : -1;

    const expensesArray = filtered.map((m, i) => ({
      memberId: m._id,
      amount:
        i === expenseRandomIndex ? rawExpense + expenseLeftover : rawExpense,
    }));

    const refundsArray = filtered.map((m, i) => ({
      memberId: m._id,
      refund: i === refundRandomIndex ? avgRefund + refundLeftover : avgRefund,
    }));

    const totalArray = filtered.map((m, i) => {
      const expense =
        i === expenseRandomIndex ? rawExpense + expenseLeftover : rawExpense;
      const refund =
        i === refundRandomIndex ? avgRefund + refundLeftover : avgRefund;
      return {
        memberId: m._id,
        amount: parseFloat((expense - refund).toFixed(2)),
      };
    });

    if (splitMethod === "Equally") {
      setMemberExpenses(expensesArray);
      setMemberRefunds(refundsArray);
      setMemberTotalExpenses(totalArray);
    }
  }, [expenses, refunds, splitMethod, members, selectedMemberIds]);

  // Handle camera capture
  const handleCameraClick = () => {
    setShowCamera(true);
  };

  // Process captured image through OCR
  const handleCaptureComplete = async (imageBlob, imagePreview) => {
    setShowCamera(false);
    setIsProcessing(true);
    setError(""); // Clear any previous errors
    setWarning(""); // Clear any previous warnings

    // Reset all form fields and calculations when starting a new capture
    setNote("");
    setExpenses(0);
    setOcrResult(null);
    setPaidDate(new Date().toISOString().slice(0, 10));
    setMemberTotalExpenses([]);
    setMemberExpenses([]);
    setMemberRefunds([]);

    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append("image", imageBlob, "receipt.jpg");

      // Send to OCR API
      const response = await api.post("/ocr/receipt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // For robust handling, check if the response has the expected structure
      if (!response.data || response.data.success === false) {
        // Nothing useful was extracted
        setError(
          "Could not extract any information from receipt. Please enter details manually."
        );
        return;
      }

      // Track what was extracted and what was missing
      const hasAmount =
        response.data.amountExtracted === true && response.data.amount;
      const hasMerchantName =
        response.data.merchantNameExtracted === true &&
        response.data.merchantName;
      const hasDate = response.data.transactionDate !== undefined;

      // Apply values that were successfully extracted
      if (hasAmount) {
        setExpenses(response.data.amount);
        setOcrResult({
          amount: response.data.amount,
          timestamp: new Date().toISOString(),
        });
      }

      if (hasMerchantName) {
        setNote(response.data.merchantName);
      }

      if (hasDate) {
        setPaidDate(response.data.transactionDate);
      }

      // Set category to shopping for OCR scanned receipts
      if (response.data.success) {
        const shoppingLabel = labels.find(label => label.type.toLowerCase() === 'shopping');
        if (shoppingLabel) {
          setSelectedLabelId(shoppingLabel._id);
        }
      }
      
      // Generate appropriate error message based on what's missing
      const missingFields = [];
      if (!hasAmount) missingFields.push("total amount");
      if (!hasMerchantName) missingFields.push("expense note");

      if (missingFields.length > 0) {
        // Use warning state for partial extractions
        let message;
        if (missingFields.length === 1) {
          message = `${missingFields[0]} not extracted. Please enter manually.`;
        } else {
          const lastField = missingFields.pop();
          message = `${missingFields.join(", ")} and ${lastField} not extracted. Please enter manually.`;
        }

        setWarning(message);
      }
    } catch (err) {
      console.error("Error processing receipt:", err);
      setError("Failed to process receipt. Please enter details manually.");

      // Reset fields on error
      setNote("");
      setExpenses(0);
      setOcrResult(null);
      setPaidDate(new Date().toISOString().slice(0, 10)); // Reset date to current date
      setMemberTotalExpenses([]);
      setMemberExpenses([]);
      setMemberRefunds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // submit bill
  const handleAddBill = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    setWarning(""); // Clear any previous warnings

    if (
      !selectedLabelId ||
      !note ||
      !expenses ||
      !paidBy ||
      !paidDate ||
      memberTotalExpenses.length === 0
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const newBill = {
      groupId,
      labelId: selectedLabelId,
      date: paidDate,
      note,
      paidBy,
      expenses: parseFloat(expenses),
      refunds: parseFloat(refunds),
      splitWay: splitMethod,
      members: memberTotalExpenses.map((m) => ({
        memberId: m.memberId,
        expense:
          memberExpenses.find((r) => r.memberId === m.memberId)?.amount || 0,
        refund:
          memberRefunds == 0
            ? 0
            : memberRefunds.find((r) => r.memberId === m.memberId)?.refund,
      })),
    };

    try {
      await api.post(`/bills`, newBill);
      await api.post(`/balances/group/${groupId}/recalculate`);
      navigate(`/groups/${groupId}/expenses`, {
        replace: true,
        state: { needRefreshBalance: true },
      });
    } catch (err) {
      console.error("Failed to create bill:", err);
      setError("Failed to create bill. Please try again.");
    }
  };

  return (
    <MobileFrame>
      <div className={styles.container}>
        {showCamera && (
          <div className={styles.cameraWrapper}>
            <CameraCapture
              onCapture={handleCaptureComplete}
              onClose={() => setShowCamera(false)}
            />
          </div>
        )}

        {isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.spinner}></div>
            <p>Processing receipt...</p>
          </div>
        )}

        <form className={styles.form} onSubmit={handleAddBill}>
          <h2 className={styles.header}>
            <span
              className={styles.backButton}
              onClick={() => navigate(`/groups/${groupId}/expenses`)}
            >
              {"<"}
            </span>
            <div className={styles.headerTitle}>
              <img
                src={`${IMG_URL}/${labels.find((label) => label._id === selectedLabelId)?.iconUrl}`}
                alt={
                  labels.find((label) => label._id === selectedLabelId)?.type ||
                  "label icon"
                }
                className={styles.labelIcon}
              />
              <p>Add Expense</p>
            </div>

            <span onClick={handleCameraClick}>
              <img
                src="/images/camera.png"
                alt="camera icon"
                className={styles.cameraIcon}
              />
            </span>
          </h2>

          <div className={styles.rowName}>
            <p>Category</p>
            <p>Note</p>
          </div>

          <div className={styles.row1}>
            <select
              value={selectedLabelId}
              onChange={(e) => setSelectedLabelId(e.target.value)}
              className={styles.select}
            >
              {labels.map((label) => (
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
            <p>Paid Amount</p>
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
            <label htmlFor="splitMethod">Split Method</label>
            <select
              id="splitMethod"
              value={splitMethod}
              onChange={(e) => setSplitMethod(e.target.value)}
              className={styles.splitMethodSelect}
            >
              <option value="Equally">Equally</option>
              <option value="As Amounts">As Amounts</option>
            </select>
          </div>

          <div className={styles.splitBox}>
            <ul className={styles.memberList}>
              {(members || []).map((m, i) => {
                const checked = selectedMemberIds.includes(m._id);
                const current = memberTotalExpenses.find(
                  (me) => me.memberId === m._id
                ) || { amount: 0 };

                return (
                  <li key={m._id} className={styles.memberListItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setSelectedMemberIds((prev) => [...prev, m._id]);
                        } else {
                          setSelectedMemberIds((prev) =>
                            prev.filter((id) => id !== m._id)
                          );
                          setMemberTotalExpenses((prev) =>
                            prev.filter((me) => me.memberId !== m._id)
                          );
                        }
                      }}
                      className={styles.memberIcon}
                    />
                    <div className={styles.memberItem}>
                      <div className={styles.memberName}>{m.userName}</div>

                      <div>
                        {splitMethod === "As Amounts" ? (
                          <input
                            type="number"
                            value={current.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setMemberTotalExpenses((prev) => {
                                const exists = prev.find(
                                  (p) => p.memberId === m._id
                                );
                                if (exists) {
                                  return prev.map((p) =>
                                    p.memberId === m._id
                                      ? { ...p, amount: newAmount }
                                      : p
                                  );
                                } else {
                                  return [
                                    ...prev,
                                    { memberId: m._id, amount: newAmount },
                                  ];
                                }
                              });
                              setMemberExpenses((prev) => {
                                const exists = prev.find(
                                  (p) => p.memberId === m._id
                                );
                                if (exists) {
                                  return prev.map((p) =>
                                    p.memberId === m._id
                                      ? { ...p, amount: newAmount }
                                      : p
                                  );
                                } else {
                                  return [
                                    ...prev,
                                    { memberId: m._id, amount: newAmount },
                                  ];
                                }
                              });
                            }}
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
              {memberTotalExpenses
                .reduce((sum, m) => sum + m.amount, 0)
                .toFixed(2)}
            </div>
            <div>
              <strong>Difference:</strong> $
              {(
                parseFloat(expenses || 0) -
                memberTotalExpenses.reduce((sum, m) => sum + m.amount, 0) -
                refunds
              ).toFixed(2)}
            </div>
          </div>

          {warning && <div className={styles.warning}>{warning}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.addButton}>
            Add
          </button>
        </form>
      </div>
    </MobileFrame>
  );
}
