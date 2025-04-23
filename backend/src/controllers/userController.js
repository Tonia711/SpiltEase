// File: src/controllers/userController.js
import User from "../models/userModel.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Avatar, Group, Bill, Balance } from "../db/schema.js";

// 获取当前登录用户信息，包含 avatarUrl
export const getMe = async (req, res) => {
  try {
    // 查询并关联 avatar
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({ path: "avatarId", select: "avatarUrl" });

    if (!user) return res.status(404).json({ error: "User not found" });

    const userObj = user.toObject();
    // 将 avatarId 对象展开并添加 avatarUrl 字段
    userObj.avatarUrl = userObj.avatarId?.avatarUrl;
    userObj.avatarId = userObj.avatarId?._id;

    res.json(userObj);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user info", detail: err.message });
  }
};

// 更新当前用户信息，可更新 userName 或 avatarId
export const updateMe = async (req, res) => {
  const updates = {};
  if (req.body.userName) updates.userName = req.body.userName;
  if (req.body.avatarId) updates.avatarId = req.body.avatarId;

  try {
    const user = await User.findOneAndUpdate({ _id: req.user.id }, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate({ path: "avatarId", select: "avatarUrl" });

    if (!user) return res.status(404).json({ error: "User not found" });

    const userObj = user.toObject();
    userObj.avatarUrl = userObj.avatarId?.avatarUrl;
    userObj.avatarId = userObj.avatarId?._id;

    res.json(userObj);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update profile", detail: err.message });
  }
};

// 删除当前用户
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.user.id });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete user", detail: err.message });
  }
};

// Get user annual summary
export const getUserAnnualSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Find all groups the user is a member of
    const user = await User.findById(userId).select('groupId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userGroups = await Group.find({ _id: { $in: user.groupId } });
    
    if (!userGroups || userGroups.length === 0) {
      return res.status(200).json({
        message: 'User is not a member of any groups',
        totalBillsCreated: 0,
        totalPersonalExpense: 0,
        totalPaidForOthers: 0,
        totalPaidByOthers: 0,
        frequentPartners: [],
        mostExpensiveBill: null,
        groupsCount: 0,
        year
      });
    }
    
    // Create a mapping of groupId -> memberId for this user
    const userMemberIds = {};
    userGroups.forEach(group => {
      const userMember = group.members.find(member => 
        member.userId && member.userId.toString() === userId.toString()
      );
      if (userMember) {
        userMemberIds[group._id.toString()] = userMember.memberId;
      }
    });
    
    // Get group numeric IDs from original data
    const groupNumericIds = userGroups.map(group => {
      // Extract numeric ID from group._id (assuming it follows some pattern)
      // This depends on how your data is structured
      return parseInt(group._id.toString().substring(20), 16) % 100; // Just an example approach
    }).filter(id => !isNaN(id));
    
    // Get all bills for these groups
    const allGroupBills = await Bill.find({ groupId: { $in: groupNumericIds } });
    
    // Initialize summary data
    let totalBillsCreated = 0;
    let totalPersonalExpense = 0;
    let totalPaidForOthers = 0;
    let totalPaidByOthers = 0;
    const partnerFrequency = {};
    let mostExpensiveBill = null;
    let highestExpense = 0;
    
    // Process each group's bills
    allGroupBills.forEach(groupBill => {
      const groupId = groupBill.groupId;
      const currentGroupObjectId = userGroups.find(g => 
        parseInt(g._id.toString().substring(20), 16) % 100 === groupId
      )?._id.toString();
      
      if (!currentGroupObjectId) return; // Skip if we can't match the group
      
      const userMemberId = userMemberIds[currentGroupObjectId];
      if (!userMemberId) return; // Skip if user is not a member of this group
      
      // Filter bills for the specified year
      const relevantBills = groupBill.groupBills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate.getFullYear() === year;
      });
      
      relevantBills.forEach(bill => {
        // Check if user created this bill
        const isCreator = bill.paidBy === userMemberId;
        
        if (isCreator) {
          totalBillsCreated++;
        }
        
        // Calculate user's personal expense
        const userEntry = bill.members.find(m => m.memberId === userMemberId);
        if (userEntry) {
          const expense = parseFloat(userEntry.expense) || 0;
          totalPersonalExpense += expense;
          
          // Track most expensive bill user is involved in
          const totalBillExpense = bill.expenses || 0;
          if (totalBillExpense > highestExpense) {
            highestExpense = totalBillExpense;
            mostExpensiveBill = {
              note: bill.note,
              date: bill.date,
              amount: totalBillExpense,
              groupName: userGroups.find(g => 
                parseInt(g._id.toString().substring(20), 16) % 100 === groupId
              )?.groupName || 'Unknown Group'
            };
          }
          
          // Calculate paid for others
          if (isCreator) {
            const totalExpense = bill.expenses || 0;
            const userExpense = userEntry.expense || 0;
            totalPaidForOthers += (totalExpense - userExpense);
          }
          
          // Calculate paid by others for user
          if (!isCreator) {
            totalPaidByOthers += expense;
          }
          
          // Track frequent partners
          bill.members.forEach(member => {
            if (member.memberId !== userMemberId) {
              // Find the name of this partner
              const group = userGroups.find(g => 
                parseInt(g._id.toString().substring(20), 16) % 100 === groupId
              );
              if (group) {
                const partnerMember = group.members.find(m => m.memberId === member.memberId);
                if (partnerMember) {
                  const partnerName = partnerMember.userName;
                  partnerFrequency[partnerName] = (partnerFrequency[partnerName] || 0) + 1;
                }
              }
            }
          });
        }
      });
    });
    
    // Find most frequent partners
    const frequentPartners = Object.entries(partnerFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Top 3 partners
    
    res.status(200).json({
      totalBillsCreated,
      totalPersonalExpense: parseFloat(totalPersonalExpense.toFixed(2)),
      totalPaidForOthers: parseFloat(totalPaidForOthers.toFixed(2)),
      totalPaidByOthers: parseFloat(totalPaidByOthers.toFixed(2)),
      frequentPartners,
      mostExpensiveBill,
      groupsCount: userGroups.length,
      year
    });
    
  } catch (error) {
    console.error('Error generating user annual summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
