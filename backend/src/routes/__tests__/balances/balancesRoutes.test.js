import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app.js";
import { User, Group, Bill, Balance } from "../../../db/schema.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

let token, userId, groupId;

beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({ email: "balance@test.com" });
  await Group.deleteMany({ groupName: "Balance Test Group" });
  await Bill.deleteMany({});
  await Balance.deleteMany({});

  const user = await User.create({
    userName: "BalanceTester",
    email: "balance@test.com",
    password: "secure123",
  });
  userId = user._id;
  token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  const group = await Group.create({
    groupName: "Balance Test Group",
    members: [{ userName: "BalanceTester", userId }],
  });
  groupId = group._id;
});

describe("Balance Routes", () => {
  it("should recalculate group balance", async () => {
    await Bill.create({
      groupId,
      groupBills: [
        {
          date: "2025-05-01",
          labelId: new mongoose.Types.ObjectId("000000000000000000000001"),
          note: "Dinner",
          paidBy: userId,
          expenses: 100,
          refunds: 0,
          members: [
            { memberId: userId, expense: 50 },
            { memberId: new mongoose.Types.ObjectId(), expense: 50 },
          ],
        },
      ],
    });

    const res = await request(app)
      .post(`/api/balances/group/${groupId}/recalculate`)
      .expect(200);

    expect(res.body).toHaveProperty("message", "Balance recalculated");
    expect(res.body).toHaveProperty("groupBalances");
    expect(Array.isArray(res.body.groupBalances)).toBe(true);
  });

  it("should get group balance by groupId", async () => {
    await Balance.create({
      groupId,
      groupBalances: [
        {
          fromMemberId: new mongoose.Types.ObjectId(),
          toMemberId: userId,
          balance: 25,
          isFinished: false,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/balances/group/${groupId}`)
      .expect(200);

    expect(res.body).toHaveProperty("groupBalances");
    expect(Array.isArray(res.body.groupBalances)).toBe(true);
  });

  it("should mark balance as finished", async () => {
    const fromId = new mongoose.Types.ObjectId();
    const toId = new mongoose.Types.ObjectId();

    await Balance.create({
      groupId,
      groupBalances: [
        {
          fromMemberId: fromId,
          toMemberId: toId,
          balance: 10,
          isFinished: false,
        },
      ],
    });

    const res = await request(app)
        .put(`/api/balances/group/${groupId}/markPaid`) 
        .send({ fromMemberId: fromId, toMemberId: toId }) 
        .expect(200);
    
    expect(res.body.message).toBe("Marked as paid");

    const updated = await Balance.findOne({ groupId });
    const marked = updated.groupBalances.find(
      b => b.fromMemberId.toString() === fromId.toString() && b.toMemberId.toString() === toId.toString()
    );
    expect(marked.isFinished).toBe(true);
    expect(marked.finishHistory.length).toBeGreaterThan(0);
  });
});
