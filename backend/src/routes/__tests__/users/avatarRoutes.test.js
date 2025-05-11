import {  beforeAll, afterAll, it, expect, describe } from "vitest";
import { User } from "../../../db/schema.js";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../../app.js";
import path from "path";
import fs from "fs";

beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
})

afterAll(async () => {
    await mongoose.disconnect()
})


describe("Avatar Routes", () => {
    it("should return all system avatars", async () => {
        const res = await request(app).get("/api/avatars").expect(200);
        
        expect(res.body.length).toBe(10);
        for (const avatar of res.body) {
            expect(avatar.isSystem).toBe(true);
        }
    });

    it("should upload a custom avatar and update user avatarId", async () => {
        const testUser = {
            userName: "testUser1",
            email: "test1@gmail.com",
            password: "password1",
            _id: "000000000000000000000001"
        };

        const avatarFilePath = path.resolve("public/uploads/testing.png"); 
        expect(fs.existsSync(avatarFilePath)).toBe(true);

        const res = await request(app)
        .post("/api/avatars/upload")
        .field("userId", testUser._id.toString())
        .attach("avatar", avatarFilePath)
        .expect(201);

        expect(res.body).toHaveProperty("message", "Avatar uploaded");
        expect(res.body).toHaveProperty("avatarUrl");

        const updatedUser = await User.findById(testUser._id).lean();
        expect(updatedUser.avatarId.toString()).toBe(res.body.avatarId);
    });
});