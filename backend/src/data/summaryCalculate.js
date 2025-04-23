import { Label } from "../db/schema.js";
import mongoose from "mongoose";

/**
 * Calculate expense summary for a group and a specific user
 * @param {Object} group - The group document
 * @param {String} userId - The user's ID
 * @param {Object} billsData - The bills data for the group
 * @returns {Object} Summary data including group and user expense breakdowns
 */
export const calculateExpenseSummary = async (group, userId, billsData) => {
  try {
    // Find the user's memberId in this group
    const userMember = group.members.find(member => 
      member.userId && member.userId.toString() === userId.toString()
    );
    
    if (!userMember) {
      throw new Error('User is not a member of this group');
    }
    
    const userMemberId = userMember.memberId;
    
    if (!billsData || !billsData.groupBills || billsData.groupBills.length === 0) {
      return {
        groupSummary: [],
        userSummary: [],
        groupTotal: 0,
        userTotal: 0
      };
    }
    
    // Get all available labels for mapping
    const allLabels = await Label.find().lean();
    
    // Create a numeric-based mapping for label types
    const labelTypeByNumber = {};
    allLabels.forEach(label => {
      // Extract the numeric ID from the ObjectId's last byte(s)
      const idHex = label._id.toString();
      const numericId = parseInt(idHex.slice(-2), 16); // Extract from last 2 hex chars
      
      if (numericId >= 1 && numericId <= 7) {
        labelTypeByNumber[numericId] = {
          name: label.type,
          id: label._id
        };
      }
    });
    
    console.log('Label mapping by numeric ID:', Object.entries(labelTypeByNumber).map(
      ([id, info]) => `${id} -> ${info.name}`
    ));
    
    // Debug the bills and their labelIds
    const billsDebugInfo = billsData.groupBills.map(bill => {
      // For each bill, extract numeric ID from ObjectId
      const labelIdStr = bill.labelId ? bill.labelId.toString() : null;
      const labelNumericId = labelIdStr ? parseInt(labelIdStr.slice(-2), 16) : null;
      
      return {
        billId: bill.id,
        labelId: labelIdStr,
        numericId: labelNumericId,
        labelType: labelNumericId && labelTypeByNumber[labelNumericId] 
          ? labelTypeByNumber[labelNumericId].name 
          : 'unknown',
        expenses: bill.expenses,
        refunds: bill.refunds
      };
    });
    
    console.log('Bills with numeric IDs:', billsDebugInfo);
    
    // Process bill data to calculate expenses by label
    const groupSummaryMap = {};
    const userSummaryMap = {};
    let groupTotal = 0;
    let userTotal = 0;
    
    // Process all bills in the group
    for (const bill of billsData.groupBills) {
      if (!bill.labelId) {
        console.log(`Skipping bill ${bill.id} with no labelId`);
        continue;
      }
      
      // Extract numeric ID from the labelId ObjectId
      const labelIdStr = bill.labelId.toString();
      const labelNumericId = parseInt(labelIdStr.slice(-2), 16);
      
      // Use the numeric ID to get the label type
      const labelInfo = labelTypeByNumber[labelNumericId];
      
      if (!labelInfo) {
        console.log(`No label info found for numeric ID ${labelNumericId} (from ${labelIdStr}) on bill ${bill.id}`);
        continue;
      }
      
      const labelKey = labelNumericId.toString();
      
      // Initialize label entries in the summary maps if they don't exist
      if (!groupSummaryMap[labelKey]) {
        groupSummaryMap[labelKey] = {
          labelId: labelInfo.id,
          labelName: labelInfo.name,
          totalExpense: 0,
          totalRefund: 0,
          netExpense: 0
        };
      }
      
      if (!userSummaryMap[labelKey]) {
        userSummaryMap[labelKey] = {
          labelId: labelInfo.id,
          labelName: labelInfo.name,
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
      groupSummaryMap[labelKey].totalExpense += billExpense;
      groupSummaryMap[labelKey].totalRefund += billRefund;
      groupSummaryMap[labelKey].netExpense += netBillExpense;
      
      // Calculate user's expense and refund based on the split expense in the members array
      const userEntry = bill.members.find(m => m.memberId === userMemberId);
      if (userEntry) {
        // Use the split expense from the members array instead of the total bill expense
        const userExpense = parseFloat(userEntry.expense) || 0;
        const userRefund = parseFloat(userEntry.refund) || 0;
        const netUserExpense = userExpense - userRefund;
        
        userTotal += netUserExpense;
        userSummaryMap[labelKey].userExpense += userExpense;
        userSummaryMap[labelKey].userRefund += userRefund;
        userSummaryMap[labelKey].netExpense += netUserExpense;
      }
    }
    
    console.log("Group summary before formatting:", Object.entries(groupSummaryMap).map(
      ([labelKey, data]) => `${labelKey} (${data.labelName}): ${data.totalExpense} - ${data.totalRefund} = ${data.netExpense}`
    ));
    
    console.log("User summary before formatting:", Object.entries(userSummaryMap).map(
      ([labelKey, data]) => `${labelKey} (${data.labelName}): ${data.userExpense} - ${data.userRefund} = ${data.netExpense}`
    ));
    
    // Format the data for the frontend with proper capitalization
    const groupSummary = Object.entries(groupSummaryMap)
      .map(([labelKey, item]) => ({
        labelId: item.labelId,
        // Capitalize first letter of label name for display
        labelName: item.labelName.charAt(0).toUpperCase() + item.labelName.slice(1),
        totalExpense: parseFloat(item.netExpense.toFixed(2)),
        percentage: groupTotal > 0 ? parseFloat(((item.netExpense / groupTotal) * 100).toFixed(2)) : 0
      }))
      .filter(item => item.totalExpense > 0);
    
    const userSummary = Object.entries(userSummaryMap)
      .map(([labelKey, item]) => ({
        labelId: item.labelId,
        // Capitalize first letter of label name for display
        labelName: item.labelName.charAt(0).toUpperCase() + item.labelName.slice(1),
        userExpense: parseFloat(item.netExpense.toFixed(2)),
        percentage: userTotal > 0 ? parseFloat(((item.netExpense / userTotal) * 100).toFixed(2)) : 0
      }))
      .filter(item => item.userExpense > 0);
    
    return {
      groupSummary,
      userSummary,
      groupTotal: parseFloat(groupTotal.toFixed(2)),
      userTotal: parseFloat(userTotal.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating expense summary:', error);
    throw error;
  }
};

export default calculateExpenseSummary;