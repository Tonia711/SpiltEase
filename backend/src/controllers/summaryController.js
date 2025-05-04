import { Group, Bill } from "../db/schema.js";
import { calculateExpenseSummary } from "../data/summaryCalculate.js";

// Get group expense summary data
export const getGroupSummary = async (req, res) => {
    const groupId = req.params.id;
    const userId = req.user.id;

    try {
        // 1. Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        // 2. Get all bills associated with this group
        const billsData = await Bill.findOne({ groupId: group._id });
        // 3. Calculate group expense summary
        const summaryData = await calculateExpenseSummary(group, userId, billsData);
        // 4. Return the formatted summary data
        res.status(200).json(summaryData);
    } catch (error) {
        console.error('Error fetching group summary:', error);
        if (error.message === 'User is not a member of this group') {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};