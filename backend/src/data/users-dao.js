import { User } from "../db/schema.js";

export async function removeGroupFromUser(userId, groupIdToRemove) {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { $pull: { groupId: groupIdToRemove } },
            { new: true }
        );

        return updatedUser;
    } catch (err) {
        console.error("Error removing group from user:", err);
        throw err; 
    }
}

