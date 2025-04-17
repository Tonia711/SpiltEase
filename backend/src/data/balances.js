//界面显示的balances数据
const balances = [
    {
        groupId: 1,
        groupBalances: [
        {
            fromMemberId: 2,
            toMemberId: 1,
            balance: 501.67,
            isFinished: false,
            finishHistory: []
        },
        {
            fromMemberId: 3,
            toMemberId: 1,
            balance: 371.66,
            isFinished: false,
            finishHistory: []
        },
        {
            fromMemberId: 4,
            toMemberId: 1,
            balance: 65,
            isFinished: false,
            finishHistory: []
        },
        {
            fromMemberId: 4,
            toMemberId: 5,
            balance: 30,
            isFinished: false,
            finishHistory: []
        }
        ]
    },
    {
        groupId: 2,
        groupBalances: []
    },
    {
        groupId: 3,
        groupBalances: [
            {
                fromMemberId: 3,
                toMemberId: 1,
                balance: 0,
                isFinished: true,
                finishHistory: [
                    {
                        date: new Date("2025-03-03"),
                        amount: 400
                    }
                ]
            }
        ]
    }
];

export default balances;