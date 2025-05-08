import { beforeEach, beforeAll, afterAll, it, expect, describe } from "vitest";
import { User, Avatar, Label, Group, Icon, Bill, Balance, BalancesCalculate } from "../../../db/schema.js";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../../app.js"

beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
})

afterAll(async () => {
    await mongoose.disconnect()
})

describe('Bill API Routes', () => {
    it('should create a new bill', async () => {
        const group = await Group.findOne({ groupName: "testGroup1" });
        const user1 = group.members.find(m => m.userName === "testUser1");
        const user2 = group.members.find(m => m.userName === "testUser2");
        const res = await request(app)
        .post('/api/bills')  
        .send({
            date: "2025-05-01",
            expenses: 121,
            groupId: group._id,
            labelId: "000000000000000000000001",
            note: "taxi", 
            paidBy: user1._id, 
            refunds: 5,
            splitWay: "Equally",
            members: [
            {
                expense: 60.5, 
                memberId: user2._id,
                refund: 2.5
            },
            {
                expense: 60.5, 
                memberId: user1._id,
                refund: 2.5
            }
            ]
        })

        expect(res.status).toBe(201);
        const newGroupBill = await res.body.groupBills.at(-1);
        expect(newGroupBill.note).toBe("taxi");
    })

    it('should get all labels except transfer', async () => {
        const res = await request(app).get('/api/bills/allLabels');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(6)
        expect(res.body[0]).toHaveProperty('type');
    })

    it('should get bills by groupId', async () => {
        const group = await Group.findOne({ groupName: "testGroup1" });
        const res = await request(app).get(`/api/bills/group/${group._id}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0]).toHaveProperty('expenses');
    })

    it('should get a specific bill by groupId and billId', async () => {
        const group = await Group.findOne({ groupName: "testGroup1" });
        const bill = await Bill.findOne({ groupId: group._id });
        const res = await request(app).get(`/api/bills/${group._id}/bill/${bill.groupBills[0]._id}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('paidByName');
    })

 
    it('should update a bill', async () => {
        const group = await Group.findOne({ groupName: "testGroup1" });
        const bill = await Bill.findOne({ groupId: group._id });
        const billId = bill.groupBills[0]._id;
        const res = await request(app)
        .put(`/api/bills/${group._id}/bill/${billId}`)
        .send({ 
            refunds: 999
        })

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Bill updated successfully');

        const newbill = await Bill.findOne({ groupId: group._id });
        const updatedBill = newbill.groupBills.find(b => b._id.toString() === billId.toString());
        expect(updatedBill.refunds).toBe(999);
    })

    it('should delete a bill', async () => {
        const group = await Group.findOne({ groupName: "testGroup1" });
        const bill = await Bill.findOne({ groupId: group._id });
        const billId = bill.groupBills[1]._id;
        const res = await request(app)
        .delete(`/api/bills/${group._id}/bill/${billId}`)

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Bill deleted successfully');

        const updatedBill = await Bill.findOne({ groupId: group._id });
        const stillExists = updatedBill.groupBills.find(b => b._id.toString() === billId);
        expect(stillExists).toBeUndefined();
    })
})