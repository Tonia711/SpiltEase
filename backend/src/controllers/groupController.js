import { Group } from "../db/schema.js";
import { User } from "../db/schema.js";
import { Icon } from "../db/schema.js";
import { Label } from "../db/schema.js";
import { Bill } from "../db/schema.js";
import mongoose from "mongoose";

// Get all groups for a user
export const getUserGroups = async (req, res) => {

  try {
    const user = await User.findById(req.user.id).select('groupId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      console.warn(`User ${req.user.id} missing groupId array.`);
      return res.status(400).json({ message: 'User group information not found or invalid.' });
    }

    console.log('User groupId array content:', user.groupId);

    const groups = await Group.find({ _id: { $in: user.groupId } }).sort({ startDate: -1 });
    res.json(groups);
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    res.status(500).json({ message: "Server error while fetching user's groups" });
  }
};

// Get group expense summary data
export const getGroupSummary = async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Find the group to get user's memberId within this group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Find the user's memberId in this group
    const userMember = group.members.find(member => 
      member.userId && member.userId.toString() === userId.toString()
    );
    
    if (!userMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    
    const userMemberId = userMember.memberId;
    
    // 2. Get all bills associated with this group
    const billsData = await Bill.findOne({ groupId: group._id });
    
    if (!billsData || !billsData.groupBills || billsData.groupBills.length === 0) {
      return res.status(200).json({
        groupSummary: [],
        userSummary: [],
        groupTotal: 0,
        userTotal: 0
      });
    }
    
    // 3. Get all available labels for mapping
    const labels = await Label.find();
    
    // Create a map for easy lookup by ObjectId (for standard labels) or by ID value (for fallback)
    const labelMap = {};
    labels.forEach(label => {
      // Map by both string representation and direct ObjectId reference
      labelMap[label._id.toString()] = {
        id: label._id,
        name: label.type
      };
      
      // Also map by numeric ID for backward compatibility and fallbacks
      if (label._id && !isNaN(parseInt(label._id.toString().slice(-1), 16))) {
        const numericId = parseInt(label._id.toString().slice(-1), 16) % 7 + 1;
        labelMap[numericId] = {
          id: label._id,
          name: label.type
        };
      }
    });
    
    // 4. Process bill data to calculate expenses by label
    const groupSummaryMap = {};
    const userSummaryMap = {};
    let groupTotal = 0;
    let userTotal = 0;
    
    // Process all bills in the group
    for (const bill of billsData.groupBills) {
      // Default to "other" category
      let labelId = labels.find(l => l.type === "other")?._id || labels[5]._id;
      let labelName = "other";
      
      // Try to match the label by ObjectId directly
      if (bill.labelId) {
        const labelIdStr = bill.labelId.toString();
        if (labelMap[labelIdStr]) {
          labelId = labelMap[labelIdStr].id;
          labelName = labelMap[labelIdStr].name;
        }
        // If not found by direct match, try to extract the numeric part for backward compatibility
        else if (labelIdStr.match(/^[0-9a-f]{24}$/i)) {
          // Extract the last character and convert to a number between 1-7
          const lastChar = labelIdStr.slice(-1);
          const extractedId = parseInt(lastChar, 16) % 7 + 1;
          
          // Look up in labels array to get the correct ObjectId
          const matchingLabel = labels.find(l => l._id.toString().endsWith(extractedId.toString()));
          if (matchingLabel) {
            labelId = matchingLabel._id;
            labelName = matchingLabel.type;
          }
        }
      }
      
      // Initialize label entries in the summary maps if they don't exist
      if (!groupSummaryMap[labelId]) {
        groupSummaryMap[labelId] = {
          labelId: labelId,
          labelName: labelName,
          totalExpense: 0,
          totalRefund: 0,
          netExpense: 0
        };
      }
      
      if (!userSummaryMap[labelId]) {
        userSummaryMap[labelId] = {
          labelId: labelId,
          labelName: labelName,
          userExpense: 0,
          userRefund: 0,
          netExpense: 0
        };
      }
      
      // Get the total expense and refund for this bill
      const billExpense = parseFloat(bill.expenses) || 0;
      const billRefund = parseFloat(bill.refunds) || 0;
      const netBillExpense = billExpense - billRefund;
      
      // Add to group totals
      groupTotal += netBillExpense;
      groupSummaryMap[labelId].totalExpense += billExpense;
      groupSummaryMap[labelId].totalRefund += billRefund;
      groupSummaryMap[labelId].netExpense += netBillExpense;
      
      // Calculate user's expense and refund for this bill
      const userEntry = bill.members.find(m => m.memberId === userMemberId);
      if (userEntry) {
        const userExpense = parseFloat(userEntry.expense) || 0;
        const userRefund = parseFloat(userEntry.refund) || 0;
        const netUserExpense = userExpense - userRefund;
        
        userTotal += netUserExpense;
        userSummaryMap[labelId].userExpense += userExpense;
        userSummaryMap[labelId].userRefund += userRefund;
        userSummaryMap[labelId].netExpense += netUserExpense;
      }
    }
    
    // 5. Format the data for the frontend with proper capitalization
    const groupSummary = Object.values(groupSummaryMap)
      .map(item => ({
        labelId: item.labelId,
        // Capitalize first letter of label name for display
        labelName: item.labelName.charAt(0).toUpperCase() + item.labelName.slice(1),
        totalExpense: parseFloat(item.netExpense.toFixed(2)), // Use net expense (after refunds)
        percentage: groupTotal > 0 ? parseFloat(((item.netExpense / groupTotal) * 100).toFixed(2)) : 0
      }))
      .filter(item => item.totalExpense > 0);
    
    const userSummary = Object.values(userSummaryMap)
      .map(item => ({
        labelId: item.labelId,
        // Capitalize first letter of label name for display
        labelName: item.labelName.charAt(0).toUpperCase() + item.labelName.slice(1),
        userExpense: parseFloat(item.netExpense.toFixed(2)), // Use net expense (after refunds)
        percentage: userTotal > 0 ? parseFloat(((item.netExpense / userTotal) * 100).toFixed(2)) : 0
      }))
      .filter(item => item.userExpense > 0);
    
    res.status(200).json({
      groupSummary,
      userSummary,
      groupTotal: parseFloat(groupTotal.toFixed(2)),
      userTotal: parseFloat(userTotal.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching group summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a group
export const deleteGroup = async (req, res) => {
  try {
    const groupIdToRemove = req.params.id;

    const user = await User.findById(req.user.id).select('groupId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.groupId || !Array.isArray(user.groupId)) {
      return res.status(400).json({ message: 'User group list not found or invalid' });
    }

    const hasGroup = user.groupId.some(
      id => id.toString() === groupIdToRemove
    );

    if (!hasGroup) {
      return res.status(403).json({ message: 'User is not a member of this group.' });
    }

    await User.findByIdAndUpdate(req.user.id, { $pull: { groupId: groupIdToRemove } });

    res.json({ message: 'Group removed from user successfully' });

  } catch (err) {
    console.error('Error deleting group:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }
    res.status(500).json({ message: 'Server error while deleting group' });
  }
};

// Get a specific group
export const getGroupById = async (req, res) => {
  const groupId = req.params.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    let iconUrl = null;
    if (group.iconId) {
      const icon = await Icon.findById(group.iconId).select('iconUrl');
      iconUrl = icon ? icon.iconUrl : "groups/testIcon1.jpg";
    }

    res.status(200).json({
      ...group.toObject(),
      iconUrl,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const validateJoinCode = async (req, res) => {
  const { joinCode } = req.body;
  const currentUserId = req.user.id;

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Valid join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).select("_id groupName members");
    if (!group) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const user = await User.findById(currentUserId).select("_id groupId");

    const isInGroupMembers = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );

    const isInUserGroupList = user.groupId.some(aGroupId =>
      aGroupId.equals(group._id)
    );

    if (isInGroupMembers && isInUserGroupList) {
      return res.status(200).json({
        message: "You are already a member of this group.",
        isAlreadyMember: true,
        canRejoin: false,
        group,
      });
    }

    if (isInGroupMembers && !isInUserGroupList) {
      return res.status(200).json({
        message: "You have been in this group, would you like to rejoin?",
        isAlreadyMember: true,
        canRejoin: true,
        group,
      });
    }

    return res.status(200).json({
      message: "Validate code!",
      isAlreadyMember: false,
      group,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

function getUniqueName(baseName, existingMembers) {
  let name = baseName;
  let count = 1;
  const existingNames = new Set(existingMembers.map((m) => m.userName));
  while (existingNames.has(name)) {
    name = `${baseName}-${count++}`;
  }
  return name;
}

export const joinGroupByCode = async (req, res) => {
  const { joinCode, selectedMemberId } = req.body;
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId).select('userName');

  if (!user) {
    return res.status(404).json({ message: 'Authenticated user not found' });
  }

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ message: "Join code is required" });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.trim() }).populate("members");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const alreadyMember = group.members.some(member =>
      member.userId && member.userId.equals(currentUserId)
    );

    if (alreadyMember) {
      if (!user.groupId || !user.groupId.includes(group._id.toString())) {
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { groupId: group._id },
        });

        return res.status(200).json({
          message: "You were previously a member of this group. Your membership has been restored.",
          groupId: group._id,
          groupName: group.groupName,
        });
      } else {
        return res.status(409).json({ message: "You are already a member of this group." });
      }
    }

    const nameConflictMember = group.members.find(
      (m) =>
        !m.userId &&
        m.userName.toLowerCase() === user.userName.toLowerCase() &&
        (!selectedMemberId || m._id.toString() !== selectedMemberId)
    );

    if (nameConflictMember) {
      const newName = getUniqueName(`${nameConflictMember.userName}-old`, group.members);
      nameConflictMember.userName = newName;
    }

    if (selectedMemberId !== undefined && selectedMemberId !== null) {
      const virtualMember = group.members.find(
        m => String(m.memberId) === String(selectedMemberId) && !m.userId
      );

      if (!virtualMember) {
        return res.status(400).json({ message: "Invalid or already claimed memberId" });
      }

      virtualMember.userId = currentUserId;
      virtualMember.userName = user.userName;

      await group.save();

      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { groupId: group._id },
      });

      res.status(201).json({
        message: "Claimed virtual member successfully",
        groupId: group._id,
        groupName: group.groupName,
        memberId: virtualMember.memberId,
      });

    } else {

      const newMember = {
        memberId: group.members.length > 0 ? Math.max(...group.members.map(m => m.memberId)) + 1 : 1,
        userName: user.userName,
        userId: currentUserId,
      };

      group.members.push(newMember);

      await group.save();

      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { groupId: group._id },
      });

      res.status(201).json({
        message: "Joined group as a new member successfully",
        groupId: group._id,
        groupName: group.groupName,
        memberId: newMember.memberId,
      });
    }

  } catch (error) {
    console.error("Error joining group by code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroupInfo = async (req, res) => {
  const groupId = req.params.id;
  const { groupName, note, iconId, budget, startDate, endDate } = req.body;

  try {
    const group = await Group
      .findByIdAndUpdate(
        groupId,
        {
          groupName,
          note,
          iconId,
          budget,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        { new: true }
      )
      .select("-__v");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Create group
export const createGroup = (req, res) => {
  res.send("Create group API");
};