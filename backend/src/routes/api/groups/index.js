import express from "express";

const router = express.Router();

// Create group
router.post("/", (req, res) => {
  res.send("Create group API");
});

// Get all groups
router.get("/", (req, res) => {
  res.send("Get all groups API");
});

// Get a specific group
router.get("/:groupId", (req, res) => {
  res.send("Get specific group API");
});

export default router;