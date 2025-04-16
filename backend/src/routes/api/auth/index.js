import express from "express";

const router = express.Router();

// Register route
router.post("/register", (req, res) => {
  res.send("Register API");
});

// Login route
router.post("/login", (req, res) => {
  res.send("Login API");
});

export default router;