//账单
//bills的人取groups里的memberId
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
    },
    {
        groupId: 2,
        groupBills: []
    },
    {
        groupId: 3,
        groupBills: [
            {
                id: 1,
                labelId: 1,
                date: new Date("2025-03-01"),
                note: "testBill1",
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
                id: 2,
                labelId: 2,
                date: new Date("2025-03-02"),
                note: "testBill2",
                paidBy: 2,
                expenses: 500,
                refunds: 50,
                splitWay: "As Amounts",
                members: [
                    {
                        memberId: 1,
                        expense: 100,
                        refund: 25
                    },
                    {
                        memberId: 3,
                        expense: 400,
                        refund: 25
                    }
                ]
            },
            {
                id: 3,
                labelId: 7,
                date: new Date("2025-03-03"),
                note: "transfer1",
                paidBy: 3,
                expenses: 400,
                refunds: 0,
                splitWay: "",
                members: [
                    {
                        memberId: 1,
                        expense: 400,
                        refund: 0
                    }
                ]
            }
        ]
    }
];

export default bills;