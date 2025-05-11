import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { Group, Bill } from "../../../db/schema.js";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../../app.js"

let testGroup;
let testUser1;
let testUser2;
let testBill1;
let testBill2;

beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
    
    testGroup = await Group.findOne({ groupName: "testGroup1" });
    testUser1 = testGroup.members.find(m => m.userName === "testUser1");
    testUser2 = testGroup.members.find(m => m.userName === "testUser2");
    
    // Create two test bills
    const bill1 = await request(app)
        .post('/api/bills')
        .send({
            date: "2025-05-01",
            expenses: 121,
            groupId: testGroup._id,
            labelId: "000000000000000000000001",
            note: "testBill1",
            paidBy: testUser1._id,
            refunds: 5,
            splitWay: "Equally",
            members: [
                {
                    expense: 60.5,
                    memberId: testUser2._id,
                    refund: 2.5
                },
                {
                    expense: 60.5,
                    memberId: testUser1._id,
                    refund: 2.5
                }
            ]
        });
    
    const bill2 = await request(app)
        .post('/api/bills')
        .send({
            date: "2025-05-02",
            expenses: 200,
            groupId: testGroup._id,
            labelId: "000000000000000000000001",
            note: "testBill2",
            paidBy: testUser2._id,
            refunds: 10,
            splitWay: "Equally",
            members: [
                {
                    expense: 100,
                    memberId: testUser2._id,
                    refund: 5
                },
                {
                    expense: 100,
                    memberId: testUser1._id,
                    refund: 5
                }
            ]
        });
    
    testBill1 = bill1.body.groupBills.at(-1);
    testBill2 = bill2.body.groupBills.at(-1);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
    if (testBill1) {
        try {
            await request(app).delete(`/api/bills/${testGroup._id}/bill/${testBill1._id}`);
        } catch (error) {
            console.error("Error cleaning up testBill1:", error);
        }
    }
    if (testBill2) {
        try {
            await request(app).delete(`/api/bills/${testGroup._id}/bill/${testBill2._id}`);
        } catch (error) {
            console.error("Error cleaning up testBill2:", error);
        }
    }
    await mongoose.disconnect();
});

describe('Bill API Routes', () => {
    it('should get all labels', async () => {
        const res = await request(app).get('/api/bills/allLabels');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(7);
        expect(res.body[0]).toHaveProperty('type');
    });

    it('should get all labels except transfer', async () => {
        const res = await request(app).get('/api/bills/labelsExcTrans');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(6);
        expect(res.body[0]).toHaveProperty('type');
    });

    it('should get bills by groupId', async () => {
        const res = await request(app).get(`/api/bills/group/${testGroup._id}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0]).toHaveProperty('expenses');
    });

    it('should get a specific bill by groupId and billId', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await request(app).get(`/api/bills/${testGroup._id}/bill/${testBill1._id}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('paidByName');
        expect(res.body).toHaveProperty('members');
        expect(Array.isArray(res.body.members)).toBe(true);
        expect(res.body.members.length).toBe(2);
    });

    it('should update a bill', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await request(app)
            .put(`/api/bills/${testGroup._id}/bill/${testBill1._id}`)
            .send({ 
                refunds: 999
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Bill updated successfully');

        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedBill = await Bill.findOne({ groupId: testGroup._id });
        const bill = updatedBill.groupBills.find(b => b._id.toString() === testBill1._id.toString());
        expect(bill.refunds).toBe(999);
    });

    it('should delete a bill', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const res = await request(app)
            .delete(`/api/bills/${testGroup._id}/bill/${testBill2._id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Bill deleted successfully');

        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedBill = await Bill.findOne({ groupId: testGroup._id });
        const stillExists = updatedBill.groupBills.find(b => b._id.toString() === testBill2._id.toString());
        expect(stillExists).toBeUndefined();
    });
});