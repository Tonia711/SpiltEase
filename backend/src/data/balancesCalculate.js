// calculate the minimal transfers between members in a group
function getMinimalTransfers(bills) {
    const balances = [];
  
    for (const group of bills) {
        const netBalance = {};

      for (const bill of group.groupBills) {

        const paidBy = String(bill.paidBy);
        const amountPaid = bill.expenses; 
  
        netBalance[paidBy] = (netBalance[paidBy] || 0) + amountPaid;
  
        for (const member of bill.members) {
            const memberId = String(member.memberId);
            const expense = member.expense; 
            netBalance[memberId] = (netBalance[memberId] || 0) - expense;
            }
      }

      const creditors = [];
      const debtors = [];
  
      for (const [memberId, balance] of Object.entries(netBalance)) {
        const rounded = Math.round(balance * 100) / 100;
        if (Math.abs(rounded) < 0.01) continue;
        if (rounded > 0) {
          creditors.push({ memberId, balance: rounded });
        } else {
          debtors.push({ memberId, balance: -rounded });
        }
      }
   
      const groupBalances = [];
      let i = 0, j = 0;
  
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const transfer = Math.min(debtor.balance, creditor.balance);
        const rounded = Math.round(transfer * 100) / 100;
  
        groupBalances.push({
          fromMemberId: debtor.memberId,
          toMemberId: creditor.memberId,
          balance: rounded
        });
  
        debtor.balance -= rounded;
        creditor.balance -= rounded;
  
        if (debtor.balance <= 0.01) i++;
        if (creditor.balance <= 0.01) j++;
      }
  
      balances.push({
        groupId: group.groupId,
        groupBalances,
        recalculatedAt: new Date().toISOString()
      });
    }
  
    return balances;
  }

export default getMinimalTransfers;