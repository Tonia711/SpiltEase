import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../../app.js";
import { User } from "../../../db/schema.js";

const JWT_SECRET = process.env.JWT_SECRET;

let token, userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await User.deleteMany({ email: "me@test.com" });
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({ email: "me@test.com" });

  const user = await User.create({
    userName: "MeTestUser",
    email: "me@test.com",
    password: "password123"
  });

  userId = user._id;
  token = jwt.sign({ id: user._id, email: user.email, userName: user.userName }, JWT_SECRET, {
    expiresIn: "1h"
  });
});

describe("User Routes", () => {
  it("should get current user profile", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe("me@test.com");
    expect(res.body.userName).toBe("MeTestUser");
  });

  it("should update user profile", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ userName: "UpdatedUser" })
      .expect(200);

    expect(res.body.userName).toBe("UpdatedUser");

    const updated = await User.findById(userId);
    expect(updated.userName).toBe("UpdatedUser");
  });

  it("should search users by userName", async () => {
    const res = await request(app)
      .get("/api/users/search?q=MeTestUser")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("userName");
  });

  it("should check if email exists", async () => {
    const res = await request(app)
      .get("/api/users/check?field=email&value=me@test.com")
      .expect(200);

    expect(res.body.exists).toBe(true);
  });

  it("should check if userName does not exist", async () => {
    const res = await request(app)
      .get("/api/users/check?field=userName&value=nonexistent")
      .expect(200);

    expect(res.body.exists).toBe(false);
  });

  it("should delete the user", async () => {
    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe("User deleted");

    const deleted = await User.findById(userId);
    expect(deleted).toBeNull();
  });
});
