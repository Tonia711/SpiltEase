import Expense from "../models/expenseModel.js";

// ✅ 获取某个 group 的所有支出
export const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.find({ groupId })
      .populate("payer", "userName") // 填充 payer 的 userName
      .populate("participants", "userName"); // 填充参与者的 userName

    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to get expenses." });
  }
};

// ✅ 创建新的支出
export const createExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { payer, participants, amount, description, date } = req.body;

    const newExpense = new Expense({
      groupId,
      payer,
      participants,
      amount,
      description,
      date,
    });

    const saved = await newExpense.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Failed to create expense." });
  }
};
