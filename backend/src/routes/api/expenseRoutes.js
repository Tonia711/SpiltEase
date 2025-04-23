import express from "express";
import { protect } from "../../middlewares/authMiddleware.js"; // 接口都需要登录才操作
import { getExpensesByGroup, createExpense } from "../../controllers/expenseController.js";

const router = express.Router({ mergeParams: true });

// 获取某个 group 的所有支出
router.get("/:groupId/expenses", protect, getExpensesByGroup);

// 在某个 group 创建一笔新的支出
router.post("/:groupId/expenses", protect, createExpense);

export default router;
