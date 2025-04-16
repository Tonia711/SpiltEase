import express from "express";

const router = express.Router();

// Create bill
router.post("/", (req, res) => {
  res.send("Create bill API");
});

// Get all bills
router.get("/", (req, res) => {
  res.send("Get all bills API");
});

export default router;