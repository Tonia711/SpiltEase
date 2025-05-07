import { beforeEach, beforeAll, afterAll, it, expect, describe } from "vitest";
import routes from "../../api/bills/index.js";
import { User, Avatar, Label, Group, Icon, Bill, Balance, BalancesCalculate } from "../../../db/schema.js";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";
import app from "../../../app.js"



beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
})

afterAll(async () => {
    await mongoose.disconnect()
})

  
describe("Auth routes", () => {
    // const testUser = {
    //   userName: "testing101",
    //   email: "101@gmail.com",
    //   password: "secure123",
    // };
  
    // test("Register new user successfully", async () => {
    //   const res = await request(app)
    //     .post("/api/register")
    //     .send(testUser)
    //     .expect(201);
  
    //   expect(res.body).toHaveProperty("token");
    //   expect(res.body.user).toMatchObject({
    //     userName: "Alice",
    //     email: "alice@example.com",
    //   });
  
    //   const userInDb = await User.findOne({ email: testUser.email });
    //   expect(userInDb).not.toBeNull();
    //   expect(await bcrypt.compare("secure123", userInDb.password)).toBe(true);
    // });
  
    // test("Register with existing email fails", async () => {
    //   await User.create({ ...testUser, password: await bcrypt.hash("secure123", 10) });
  
    //   const res = await request(app)
    //     .post("/api/register")
    //     .send(testUser)
    //     .expect(409);
  
    //   expect(res.body.error).toBe("Email already exists");
    // });
  
    // test("Login with correct credentials succeeds", async () => {
    //   const hashedPassword = await bcrypt.hash("secure123", 10);
    //   await User.create({ ...testUser, password: hashedPassword });
  
    //   const res = await request(app)
    //     .post("/api/login")
    //     .send({ email: testUser.email, password: "secure123" })
    //     .expect(200);
  
    //   expect(res.body).toHaveProperty("token");
    //   expect(res.body.user.email).toBe(testUser.email);
    // });
  
    // test("Login with wrong password fails", async () => {
    //   const hashedPassword = await bcrypt.hash("secure123", 10);
    //   await User.create({ ...testUser, password: hashedPassword });
  
    //   const res = await request(app)
    //     .post("/api/login")
    //     .send({ email: testUser.email, password: "wrongpass" })
    //     .expect(401);
  
    //   expect(res.body.error).toBe("Invalid credentials");
    // });
  
    // test("Login with non-existent user fails", async () => {
    //   const res = await request(app)
    //     .post("/api/login")
    //     .send({ email: "nouser@example.com", password: "any" })
    //     .expect(401);
  
    //   expect(res.body.error).toBe("Invalid credentials");
    // });
  });