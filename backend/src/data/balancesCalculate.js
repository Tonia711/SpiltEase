//计算最简转账的方法
const bills = [
    {
        groupId: 1,
        groupBills: [
            {
                id: 1,
                labelId: 1,
                date: new Date("2025-01-01"),
                note: "testBill1",
                paidBy: 1,
                expenses: 500,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 500,
                        refund: 0
                    }
                ]
            },
            {
                id: 2,
                labelId: 2,
                date: new Date("2025-01-02"),
                note: "testBill2",
                paidBy: 1,
                expenses: 500,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 2,
                        expense: 500,
                        refund: 0
                    }
                ]
            },
            {
                id: 3,
                labelId: 3,
                date: new Date("2025-01-03"),
                note: "testBill3",
                paidBy: 1,
                expenses: 500,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 250,
                        refund: 0
                    },
                    {
                        memberId: 2,
                        expense: 250,
                        refund: 0
                    }
                ]
            },
            {
                id: 4,
                labelId: 4,
                date: new Date("2025-01-04"),
                note: "testBill4",
                paidBy: 1,
                expenses: 500,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 2,
                        expense: 250,
                        refund: 0
                    },
                    {
                        memberId: 3,
                        expense: 250,
                        refund: 0
                    }
                ]
            },
            {
                id: 5,
                labelId: 5,
                date: new Date("2025-01-05"),
                note: "testBill5",
                paidBy: 2,
                expenses: 300,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 100,
                        refund: 0
                    },
                    {
                        memberId: 2,
                        expense: 100,
                        refund: 0
                    },
                    {
                        memberId: 3,
                        expense: 100,
                        refund: 0
                    }
                ]
            },
            {
                id: 6,
                labelId: 6,
                date: new Date("2025-01-06"),
                note: "testBill6",
                paidBy: 2,
                expenses: 300,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 100,
                        refund: 0
                    },
                    {
                        memberId: 3,
                        expense: 100,
                        refund: 0
                    },
                    {
                        memberId: 4,
                        expense: 100,
                        refund: 0
                    }
                ]
            },
            {
                id: 7,
                labelId: 1,
                date: new Date("2025-01-07"),
                note: "testBill7",
                paidBy: 2,
                expenses: 100,
                refunds: 0,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 33.33,
                        refund: 0
                    },
                    {
                        memberId: 2,
                        expense: 33.34,
                        refund: 0
                    },
                    {
                        memberId: 3,
                        expense: 33.33,
                        refund: 0
                    }
                ]
            },
            {
                id: 8,
                labelId: 2,
                date: new Date("2025-01-08"),
                note: "testBill8",
                paidBy: 3,
                expenses: 90,
                refunds: 10,
                splitWay: "As Amounts",
                members: [
                    {
                        memberId: 1,
                        expense: 50,
                        refund: 5
                    },
                    {
                        memberId: 2,
                        expense: 40,
                        refund: 5
                    }
                ]
            },
            {
                id: 9,
                labelId: 3,
                date: new Date("2025-01-09"),
                note: "testBill9",
                paidBy: 3,
                expenses: 80,
                refunds: 20,
                splitWay: "As Amounts",
                members: [
                    {
                        memberId: 3,
                        expense: 30,
                        refund: 10
                    },
                    {
                        memberId: 4,
                        expense: 50,
                        refund: 10
                    }
                ]
            },
            {
                id: 10,
                labelId: 4,
                date: new Date("2025-01-10"),
                note: "testBill10",
                paidBy: 4,
                expenses: 85,
                refunds: 20,
                splitWay: "Equally",
                members: [
                    {
                        memberId: 1,
                        expense: 28.34,
                        refund: 6.66
                    },
                    {
                        memberId: 2,
                        expense: 28.33,
                        refund: 6.67
                    },
                    {
                        memberId: 3,
                        expense: 28.33,
                        refund: 6.67
                    }
                ]
            },
            {
                id: 11,
                labelId: 5,
                date: new Date("2025-01-10"),
                note: "testBill11",
                paidBy: 5,
                expenses: 100,
                refunds: 0,
                splitWay: "As Amounts",
                members: [
                    {
                        memberId: 4,
                        expense: 30,
                        refund: 0
                    },
                    {
                        memberId: 5,
                        expense: 70,
                        refund: 0
                    }
                ]
            }
        ]     
    }
];

function getMinimalTransfers(bills) {
    const balances = [];
  
    for (const group of bills) {
        console.log("📦 group.groupId:", group.groupId);
        console.log("📄 group.groupBills.length:", group.groupBills?.length);
      
        const netBalance = {};

      // Step 1: 计算每个成员的净资产（支付 - 消费，不考虑 refund）
      for (const bill of group.groupBills) {
        console.log("🧾 Processing bill:", JSON.stringify(bill, null, 2));

        const paidBy = String(bill.paidBy);
        const amountPaid = bill.expenses; // 忽略 refunds
  
        netBalance[paidBy] = (netBalance[paidBy] || 0) + amountPaid;
  
        for (const member of bill.members) {
            const memberId = String(member.memberId);
            const expense = member.expense; // 只用 expense，不用 refund
            netBalance[memberId] = (netBalance[memberId] || 0) - expense;
            }
      }
  
      console.log("✅ Final netBalance per group:", JSON.stringify(netBalance, null, 2));

      // Step 2: 分成 creditors 和 debtors
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
  
      // Step 3: 贪心匹配最简转账
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
  
  
// const result = getMinimalTransfers(bills);
// console.log(JSON.stringify(result, null, 2));

export default getMinimalTransfers;