import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../../app.js";
import { User, Group } from "../../../db/schema.js";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET;

let token, userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  const user = await User.create({
    userName: "GroupTester",
    email: "group@test.com",
    password: "secure123",
  });

  userId = user._id;
  token = jwt.sign(
    { id: user._id, email: user.email, userName: user.userName },
    JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
});

afterEach(async () => {
  await User.deleteMany({ userName: "GroupTester" });
  await Group.deleteMany({
    groupName:
      /Test Group|Validate Group|Test Group Join|Group Update|Summary Test Group|Updated Group Name|Group To Delete|Icon Update Group|Summary Test Group/,
  });
});

describe("Group Routes", () => {
  // --- 1. createGroup ---
  it("should create a group", async () => {
    const res = await request(app)
      .post("/api/groups/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        groupName: "Test Group",
        members: [{ userName: "GroupTester", userId }],
      })
      .expect(201);

    expect(res.body.message).toBe("Group created successfully");
    expect(res.body.group).toHaveProperty("_id");
  });

  // --- 2. getUserGroups ---
  it("should fetch current user's groups", async () => {
    const res = await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- 3. getGroupById ---
  it("should get group by ID", async () => {
    const group = await Group.create({
      groupName: "Test Group",
      members: [{ userName: "GroupTester", userId }],
    });

    const res = await request(app)
      .get(`/api/groups/${group._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.groupName).toBe("Test Group");
  });

  // --- 4. validateJoinCode ---
  it("should return 'already a member'", async () => {
    const joinCode = "VAL123";
    const group = await Group.create({
      groupName: "Validate Group A",
      joinCode,
      members: [{ userId, userName: "GroupTester" }],
    });
    await User.findByIdAndUpdate(userId, { groupId: [group._id] });

    const res = await request(app)
      .post("/api/groups/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ joinCode })
      .expect(200);

    expect(res.body.message).toBe("You are already a member of this group.");
    expect(res.body.isAlreadyMember).toBe(true);
    expect(res.body.canRejoin).toBe(false);
  });

  it("should return 'can rejoin'", async () => {
    const joinCode = "VAL456";
    await Group.create({
      groupName: "Validate Group B",
      joinCode,
      members: [{ userId, userName: "GroupTester" }],
    });

    const res = await request(app)
      .post("/api/groups/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ joinCode })
      .expect(200);

    expect(res.body.message).toBe(
      "You have been in this group, would you like to rejoin?"
    );
    expect(res.body.canRejoin).toBe(true);
  });

  it("should return 'validate code' for new user", async () => {
    const joinCode = "VAL789";
    await Group.create({
      groupName: "Validate Group C",
      joinCode,
      members: [],
    });

    const res = await request(app)
      .post("/api/groups/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ joinCode })
      .expect(200);

    expect(res.body.message).toBe("Validate code!");
    expect(res.body.isAlreadyMember).toBe(false);
  });

  it("should return 404 for invalid join code", async () => {
    const res = await request(app)
      .post("/api/groups/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ joinCode: "INVALID" })
      .expect(404);

    expect(res.body.message).toBe("Invalid code");
  });

  it("should return 400 if join code is missing", async () => {
    const res = await request(app)
      .post("/api/groups/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.message).toBe("Valid join code is required");
  });

  // --- 5. joinGroupByCode ---
  it("should join a group by joinCode", async () => {
    const group = await Group.create({
      groupName: "Test Group Join",
      joinCode: "JOINME",
      members: [],
    });

    const res = await request(app)
      .post("/api/groups/join")
      .set("Authorization", `Bearer ${token}`)
      .send({ joinCode: "JOINME" })
      .expect(201);

    expect(res.body.groupName).toBe("Test Group Join");
  });

  // --- 6. updateGroupInfo ---
  it("should update group info", async () => {
    const group = await Group.create({
      groupName: "Group Update",
      joinCode: "UPD123",
      members: [{ userName: "GroupTester", userId }],
    });

    const res = await request(app)
      .put(`/api/groups/${group._id}/update`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        groupName: "Updated Group Name",
        startDate: "2025-01-01",
        members: [
          { _id: group.members[0]._id, userId, userName: "GroupTester" },
        ],
      })
      .expect(200);

    expect(res.body.groupName).toBe("Updated Group Name");
  });

  // --- 7. getGroupSummary ---
  it("should get group summary", async () => {
    const group = await Group.create({
      groupName: "Summary Test Group",
      members: [{ userName: "GroupTester", userId }],
    });

    const res = await request(app)
      .get(`/api/groups/${group._id}/summary`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("groupSummary");
  });

  // --- 8. updateGroupIcon ---
  it("should update iconId", async () => {
    const group = await Group.create({
      groupName: "Icon Update Group",
      members: [{ userName: "GroupTester", userId }],
    });

    const iconPath = path.resolve("public/uploads/testing.png");
    expect(fs.existsSync(iconPath)).toBe(true);

    const res = await request(app)
      .post("/api/groups/icon")
      .field("groupId", group._id.toString())
      .attach("icon", iconPath)
      .expect(201);

    expect(res.body).toHaveProperty("message", "Icon uploaded");
    expect(res.body).toHaveProperty("iconId");
    expect(res.body).toHaveProperty("iconUrl");

    const updatedGroup = await Group.findById(group._id).lean();
    expect(updatedGroup.iconId.toString()).toBe(res.body.iconId);
  });

  // --- 9. deleteGroup ---
  it("should delete a group", async () => {
    const group = await Group.create({
      groupName: "Group To Delete",
      members: [{ userName: "GroupTester", userId }],
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { groupId: group._id },
    });

    const res = await request(app)
      .delete(`/api/groups/${group._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe("Group removed from user successfully");
  });
});
