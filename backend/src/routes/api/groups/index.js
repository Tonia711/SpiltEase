import express from "express";

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

router.delete("/:groupId", async(req, res) => {
  const { groupId } = req.params;
  try {
    const deletedGroup = await Group.findByIdAndDelete(groupId);
    if (!deletedGroup) {
      return res.status(404).json({ message: "Group not found" });
    } 
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ message: "Server error while deleting group" });
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
