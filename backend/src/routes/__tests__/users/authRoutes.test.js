import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { User } from "../../../db/schema.js";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../../app.js";

beforeAll(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({ email: "101@gmail.com" });
});

afterAll(async () => {
  await User.deleteMany({ email: "101@gmail.com" });
  await mongoose.disconnect();
});

describe("Auth routes", () => {
  const testUser = {
    userName: "testing101",
    email: "101@gmail.com",
    password: "secure123",
  };

  it("Register new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      userName: "testing101",
      email: "101@gmail.com",
    });
  });

  it("Register with existing userName fails", async () => {
    try {
      await User.create({ ...testUser, email: "102@gmail.com" });
      await request(app).post("/api/auth/register").send(testUser);
    } catch (err) {
      expect(err.message).toMatch(/E11000.*userName/);
    }
  });

  it("Register with existing email fails", async () => {
    try {
      await User.create({ ...testUser, userName: "testing102" });
      await request(app).post("/api/auth/register").send(testUser);
    } catch (err) {
      expect(err.message).toMatch(/E11000.*email/);
    }
  });

  it("Login with correct credentials succeeds", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("Login with wrong password fails", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpass" })
      .expect(401);

    expect(res.body.error).toBe("Invalid credentials");
  });

  it("Login with wrong user email fails", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test1@gmail.com", password: "any" })
      .expect(401);

    expect(res.body.error).toBe("Invalid credentials");
  });
});
