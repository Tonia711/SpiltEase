import express from "express";
import { Group } from "../../../db/schema.js";
const router = express.Router();

// Get all groups
router.get("/", async(req, res) => {
  console.log("/api/groups route hit");
  try {
    const groups = await Group.find().sort({ startDate: -1 });
    console.log("Fetched groups:", groups);
    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
});

// Create group
router.post("/", (req, res) => {
  res.send("Create group API");
});

// Get a specific group
router.get("/:groupId", (req, res) => {
  res.send("Get specific group API");
});

export default router;
