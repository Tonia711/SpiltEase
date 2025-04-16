import express from "express";

const router = express.Router();

// Get user info
router.get("/me", (req, res) => {
  res.send("Get user info API");
});

// Update user info
router.put("/me", (req, res) => {
  res.send("Update user info API");
});

// Update avatar
router.post("/me/avatar", (req, res) => {
  res.send("Update avatar API");
});

export default router;