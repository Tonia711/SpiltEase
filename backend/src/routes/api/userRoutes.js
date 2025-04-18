import express from "express";
import { getMe, updateMe, deleteMe } from "../../controllers/userController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { removeGroupFromUser } from "../../data/users-dao.js";

const router = express.Router();

router.put('/:id/remove-group/:groupId', async (req, res) => {
    console.log("remove-group route hit");
    const userId = req.params.id;
    const groupIdToRemove = parseInt(req.params.groupId);

    try {
        const updatedUser = await removeGroupFromUser(userId, groupIdToRemove);

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Group removed successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Error removing group' });
    }
});

router.get("/me", protect, getMe); // /api/users/me
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);

export default router;
